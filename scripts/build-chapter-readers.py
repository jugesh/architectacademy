"""Build integrated readers from canonical core, lab and interview pages.

Only chapters explicitly listed in COMPLETED are included in this audited builder.
"""
from pathlib import Path
import re,sys
ROOT=Path(__file__).resolve().parents[1]
COMPLETED=['03-scalability/horizontal-scaling','04-apis/idempotency-safe-retries','05-java/jvm-memory-gc','06-spring/transactions-proxies']
def sections(text):return re.findall(r'<section\b.*?</section>',text,re.S)
def revision(text):return text[text.index('<div class="revision-only">'):text.index('</main>')]
for chapter in COMPLETED:
    base=ROOT/'v2/chapters'/chapter
    core=(base/'index.html').read_text()
    prefix=core[:core.index('<nav class="toc">')]
    prefix=prefix.replace('Vertical vs Horizontal Scaling —','Complete Capacity Reader —')
    body='<nav class="toc"><a href="#concepts">Concepts</a><a href="#lab">Worked Lab</a><a href="#interviews">Interviews</a></nav><div class="full">'
    for label,filename in [('concepts','index.html'),('lab','deep-dive.html'),('interviews','interview-bank.html')]:
        text=(base/filename).read_text()
        parts=sections(text)
        if filename=='index.html':parts=[s for s in parts if not any(x in s for x in ['Extended textbook lab','Senior interview question bank','Complete chapter edition'])]
        # Namespace every source ID and internal fragment for collision-free composition.
        fragment=''.join(parts)
        fragment=re.sub(r'id="([^"]+)"',lambda m:f'id="{label}-{m[1]}"',fragment)
        fragment=re.sub(r'href="#([^"]+)"',lambda m:f'href="#{label}-{m[1]}"',fragment)
        fragment=re.sub(r'aria-labelledby="([^"]+)"',lambda m:'aria-labelledby="'+' '.join(label+'-'+v for v in m[1].split())+'"',fragment)
        body+=f'<h2 id="{label}">{label.capitalize()}</h2>'+fragment
    result=prefix+body+'</div>'+revision(core)+'</main><script src="../../../assets/book.js"></script></html>'
    path=base/'complete.html'
    if '--check' in sys.argv:assert path.read_text()==result,f'Stale complete reader: {chapter}'
    else:path.write_text(result)
    print('PASS integrated reader:',chapter)
