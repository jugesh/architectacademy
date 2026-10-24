"""Compose the complete edition from canonical chapters; no third-party dependencies."""
from pathlib import Path
import re,sys
BASE=Path(__file__).resolve().parents[1]/'v2/chapters/01-foundations/software-architecture'
def read(name): return (BASE/name).read_text()
def sections(text): return re.findall(r'<section\b.*?</section>',text,re.S)
index=read('index.html');complete=read('complete.html')
core=[s for s in sections(index) if re.search(r'id="s\d+"',s)]
practice=sections(read('exercises.html'));kit=sections(read('review-kit.html'))
sources=[s for s in sections(index) if '<h2>Source reading' in s]
revision=index[index.index('<div class="revision-only">'):index.index('</main>')]
body='<div class="full"><h2 id="textbook-start">Part A · Concepts, decisions and case study</h2>'+''.join(core)
body+='<h2 id="practice-start">Part B · Interviews and exercises</h2>'+''.join(practice)
body+='<h2 id="kit-start">Part C · Architecture review kit</h2>'+''.join(kit+sources)
body+='<div class="cornell-summary"><strong>Notes and areas for further practice</strong><div class="lines"></div></div></div>'+revision
result=complete[:complete.index('<div class="full">')]+body+complete[complete.index('</main>'):]
if '--check' in sys.argv:
    assert result==complete,'Complete edition is stale: run python3 scripts/build-chapter-one.py'
else:(BASE/'complete.html').write_text(result)
print('PASS: complete edition matches canonical sources')
