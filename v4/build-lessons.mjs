import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {coreGroups,guideGroups,recommendedOrder,validateGroups} from './library-categories.mjs';
import {lessons} from './lesson-content.mjs';
import {applyTeachingDepth,expandMechanismDerivations} from './teaching-depth.mjs';
import {deepenFoundations} from './foundation-explanations.mjs';
import {deepenWorkloadAndStorage} from './workload-storage-explanations.mjs';
import {deepenCopiesAndDelivery} from './copies-delivery-explanations.mjs';
import {deepenDistributedDecisions} from './distributed-explanations.mjs';
import {deepenOperations} from './operations-explanations.mjs';
import {deepenProjectionsAndPractice} from './projections-design-explanations.mjs';
import {practiceGuides} from './architecture-practice.mjs';
import {deepenDecisionCases} from './decision-case-depth.mjs';
import {deepenWorkedGuides} from './guide-worked-depth.mjs';
deepenDecisionCases(practiceGuides);
deepenWorkedGuides(practiceGuides);
applyTeachingDepth(lessons);
expandMechanismDerivations(lessons);
deepenFoundations(lessons);
deepenWorkloadAndStorage(lessons);
deepenCopiesAndDelivery(lessons);
deepenDistributedDecisions(lessons);
deepenOperations(lessons);
deepenProjectionsAndPractice(lessons);
const allPages=[...lessons,...practiceGuides];
const root=path.dirname(fileURLToPath(import.meta.url));
const allCore=[{slug:'index',title:'API Design',intro:'Contracts, HTTP semantics, security, reliability, and three complete API design cases.'},...lessons];
validateGroups(coreGroups,allCore.map(l=>l.slug),'Core lessons');
validateGroups(guideGroups,practiceGuides.map(l=>l.slug),'Study guides');
validateGroups([{id:'reading-path',slugs:recommendedOrder}],allCore.map(l=>l.slug),'Reading order');
const membership=new Map();
for(const g of coreGroups)for(const slug of g.slugs)membership.set(slug,{...g,anchor:'category-'+g.id});
for(const g of guideGroups)for(const slug of g.slugs)membership.set(slug,{...g,anchor:'practice-'+g.id});
const escapeLabel=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function breadcrumb(slug,title){const g=membership.get(slug);return `<nav class="lesson-breadcrumb" data-library-breadcrumb aria-label="Breadcrumb"><a href="lessons.html">Library</a><span aria-hidden="true">/</span><a href="lessons.html#${g.anchor}">${escapeLabel(g.title)}</a><span aria-hidden="true">/</span><span aria-current="page">${escapeLabel(title)}</span></nav>`;}
const apiSource=readFileSync(path.join(root,'index.html'),'utf8');
const api=apiSource.includes('data-library-breadcrumb')?apiSource.replace(/<nav class="lesson-breadcrumb" data-library-breadcrumb[\s\S]*?<\/nav>/,breadcrumb('index','API Design')):apiSource.replace('<main id="top">','<main id="top">'+breadcrumb('index','API Design'));
if(api!==apiSource)writeFileSync(path.join(root,'index.html'),api);
const styles=[...api.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const extra=`.wrap{grid-template-columns:220px minmax(0,850px)}.top{background:#fff}.library-links{display:flex;gap:7px;flex-wrap:wrap;margin:22px 0}.library-links a{font-size:12px;padding:5px 10px;border:1px solid var(--line);border-radius:5px;text-decoration:none}.section-cue{font-size:12px;color:var(--green);border-left:2px solid #93bea6;padding-left:12px}.mobile-map{display:none}.glossary-entry[hidden]{display:none}#glossary-filter{display:block;max-width:100%;width:100%;padding:12px;border:1px solid var(--line);border-radius:6px;margin:10px 0}.review-item{display:block;padding:10px 0;border-bottom:1px solid var(--line)}.review-item input{margin-right:10px}.review-item a{margin-left:10px}.answer p:last-child{margin-bottom:0}.term{border-bottom:1px dotted var(--green);cursor:help}.flow{align-items:stretch}.node{display:grid;place-content:center;min-height:55px}.arrow{align-self:center}@media(max-width:700px){.mobile-map{display:block;border:1px solid var(--line);padding:12px;border-radius:7px}.mobile-map a{display:block;padding:5px}.top nav a{display:inline}.top nav a:not(.library-home){display:none}}@media print{#glossary-filter,#reset-review,#glossary-count{display:none!important}.glossary-entry[hidden]{display:block!important}.mobile-map,.library-links{display:none!important}.flow{flex-direction:row;justify-content:center}.arrow{transform:none}.node{font-size:10px}.req{grid-template-columns:1fr 1fr}h3{break-after:avoid}}`;
const script=`const links=[...document.querySelectorAll('.side a')]; const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id))}),{rootMargin:'-15% 0px -70% 0px'});document.querySelectorAll('main section[id]').forEach(s=>observer.observe(s));let closed=null;addEventListener('beforeprint',()=>{if(closed!==null)return;closed=[...document.querySelectorAll('details.qa:not([open])')];closed.forEach(d=>d.open=true)});addEventListener('afterprint',()=>{if(closed===null)return;closed.forEach(d=>d.open=false);closed=null});
const filter=document.querySelector('#glossary-filter');if(filter){const entries=[...document.querySelectorAll('.glossary-entry')];const update=()=>{let shown=0;for(const e of entries){e.hidden=!e.textContent.toLowerCase().includes(filter.value.trim().toLowerCase());if(!e.hidden)shown++;}document.querySelector('#glossary-count').textContent=shown+' of '+entries.length+' terms';};filter.addEventListener('input',update);update();}
const checklist=document.querySelector('#review-checklist');if(checklist){const topics=${JSON.stringify([{slug:'index',title:'API Design'},...lessons.map(l=>({slug:l.slug,title:l.title}))])};let marks={};let storage=true;const key='aa-v4-review-v1';try{const raw=JSON.parse(localStorage.getItem(key)||'{}');if(raw&&typeof raw==='object'&&!Array.isArray(raw))marks=raw;}catch{storage=false;}const status=document.querySelector('#review-status');const report=()=>status.textContent=Object.keys(marks).filter(k=>topics.some(t=>t.slug===k)&&marks[k]===true).length+' of '+topics.length+' lesson explanations reviewed.'+(storage?' Saved in this browser.':' Browser storage unavailable; marks last only for this page session.');for(const t of topics){const label=document.createElement('label');label.className='review-item';const input=document.createElement('input');input.type='checkbox';input.checked=marks[t.slug]===true;input.setAttribute('aria-label','Reviewed '+t.title);input.addEventListener('change',()=>{marks[t.slug]=input.checked;try{localStorage.setItem(key,JSON.stringify(marks));}catch{storage=false;}report();});const link=document.createElement('a');link.href=t.slug+'.html#'+(t.slug==='index'?'api-reasoning-path':'reasoning-path');link.textContent=t.title;label.append(input,document.createTextNode('I can explain the reasoning:'),link);checklist.append(label);}document.querySelector('#reset-review').addEventListener('click',()=>{marks={};checklist.querySelectorAll('input').forEach(i=>i.checked=false);try{localStorage.removeItem(key);}catch{storage=false;}report();});report();}
`;
function shell(title,description,body,nav='',navLabel='Lesson map'){
return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(description)}"><title>${esc(title)} — Architect Academy V4</title><style>${styles}\n${extra}</style></head><body><header class="top"><a class="brand" href="lessons.html">architect academy<small>V4 · ARCHITECTURE LESSONS</small></a><nav><a class="library-home" href="lessons.html">All lessons</a><a href="index.html">API Design</a><a href="lessons.html#practice">Study guides</a><button onclick="print()">Print / PDF</button></nav></header><div class="wrap"><aside class="side"><h2>${esc(navLabel)}</h2>${nav}</aside><main id="top">${body}<footer class="footer">Architect Academy V4 · Original teaching examples · Reviewed 31 October 2026</footer></main></div><script>${script}</script></body></html>`;
}
const cards=[...allCore].sort((a,b)=>recommendedOrder.indexOf(a.slug)-recommendedOrder.indexOf(b.slug));
for(const l of allPages){
 const nav=l.sections.map((s,i)=>`<a href="#${s.id}">${i+1}. ${esc(s.short||s.title)}</a>`).join('');
 const pos=cards.findIndex(x=>x.slug===l.slug);const neighbors=pos>=0?[cards[pos-1],cards[pos+1]].filter(Boolean):[];
 const body=`${breadcrumb(l.slug,l.title)}<p class="kicker">${esc(l.title)} · fundamentals to production judgment</p><h1>${esc(l.heading)}</h1><p class="lede">${esc(l.intro)}</p><div class="definition"><strong>Technical definition</strong>${l.definition}</div><div class="callout"><strong>Before you begin.</strong> ${l.prerequisites}<p><strong>Learning outcome:</strong> ${l.outcome}</p></div><details class="mobile-map"><summary>On this page</summary>${nav}</details>${l.sections.map((s,i)=>`<section id="${s.id}"><h2>${i+1}. ${esc(s.title)}</h2>${s.cue?`<p class="section-cue">${s.cue}</p>`:''}${s.html}</section>`).join('')}<div class="library-links"><a href="lessons.html">← All V4 lessons</a><a href="lessons.html#practice">Decision &amp; revision guides</a>${neighbors.map(x=>`<a href="${x.slug}.html">${esc(x.title)}</a>`).join('')}</div>`;
 writeFileSync(path.join(root,l.slug+'.html'),shell(l.title,l.intro,body,nav));
}
const lookup=new Map([...allCore,...practiceGuides].map(l=>[l.slug,l]));
function categorySection(group,isGuide=false){
 const anchor=(isGuide?'practice-':'category-')+group.id;
 return `<section id="${anchor}" class="library-group${isGuide?' guide-group':' core-group'}" data-library-group><div class="category-heading"><h2>${esc(group.title)}</h2><span class="category-count">${group.slugs.length} ${isGuide?'guides':group.slugs.length===1?'lesson':'lessons'}</span></div><p class="category-description">${esc(group.description)}</p><div class="grid">${group.slugs.map(slug=>{const l=lookup.get(slug);return `<article class="card${isGuide?' practice-card':''}" data-lesson="${slug}"><h3><a href="${slug}.html">${esc(l.title)}</a></h3><p>${esc(l.intro)}</p></article>`}).join('')}</div></section>`;
}
const categoryNav=`<h3 class="nav-group-label">Core lessons</h3>${coreGroups.map(g=>`<a href="#category-${g.id}">${esc(g.title)}</a>`).join('')}<h3 class="nav-group-label">Study guides</h3>${guideGroups.map(g=>`<a href="#practice-${g.id}">${esc(g.title)}</a>`).join('')}`;
const libraryBody=`<p class="kicker">Architect Academy · V4</p><h1>Find your next lesson.</h1><p class="lede">17 core lessons and seven study guides, organized by subject. Follow the reading path for a first pass, or jump to the area you need.</p><details class="reading-order"><summary>Recommended reading order</summary><p>The subject groups below are for browsing. This sequence follows the existing prerequisite path.</p><ol>${cards.map(l=>`<li><a href="${l.slug}.html">${esc(l.title)}</a></li>`).join('')}</ol></details><nav class="category-jumps" aria-label="Browse lesson categories">${coreGroups.map(g=>`<a href="#category-${g.id}">${esc(g.title)}</a>`).join('')}<a href="#practice">Study guides</a></nav>${coreGroups.map(g=>categorySection(g)).join('')}<section id="practice" class="practice-library"><p class="kicker">Apply what you learn</p><h2>Study guides</h2><p>Use these alongside the core lessons for decisions, production work, interviews and revision.</p>${guideGroups.map(g=>categorySection(g,true)).join('')}</section><p><a href="../v3/">Open the full V3 curriculum →</a></p>`;
writeFileSync(path.join(root,'lessons.html'),shell('Lesson Library','17 architecture lessons and seven study guides organized by subject, with a recommended reading path.',libraryBody,categoryNav,'Browse library'));
console.log(`Built ${lessons.length} lessons, ${practiceGuides.length} study guides and categorized V4 library.`);
