"""Dependency-free checks for Chapter 1's four reader editions."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'v2/chapters/01-foundations/software-architecture'
class Page(HTMLParser):
    def __init__(self,path):
        super().__init__(); self.path=path;self.ids=[];self.links=[];self.modes=[];self.details=0
        self.feed(path.read_text())
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='a' and 'href' in a:self.links.append(a['href'])
        if 'data-mode' in a:self.modes.append(a['data-mode'])
        if tag=='details':self.details+=1
for path in BASE.glob('*.html'):
    p=Page(path)
    assert len(p.ids)==len(set(p.ids)),f'{path}: duplicate IDs'
    assert set(p.modes)=={'textbook','cornell','revision'},f'{path}: missing mode'
    for href in p.links:
        u=urlsplit(href)
        if u.scheme or u.netloc:continue
        target=(path.parent/unquote(u.path)).resolve() if u.path else path
        if target.is_dir():target/='index.html'
        assert target.is_file(),f'{path}: broken link {href}'
        if u.fragment:assert unquote(u.fragment) in Page(target).ids,f'{path}: missing anchor {href}'
    print(f'PASS {path.name}: {len(p.ids)} anchors, {len(p.links)} links, {p.details} answer disclosures')
