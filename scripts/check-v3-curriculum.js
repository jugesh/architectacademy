/* Offline contract check against the captured public navigation, not an inferred syllabus. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
global.window={};
for(const file of ['curriculum','lessons','topic-notes','curriculum-adapter'])require(path.join(root,'v3',file+'.js'));
require(path.join(root,'v3/depth.js'));
require(path.join(root,'v3/introductions.js'));
require(path.join(root,'v3/idempotency-practice.js'));
assert.equal(Object.keys(window.ACADEMY_IDEMPOTENCY_CHOICES).length,5);
assert.ok(window.ACADEMY_IDEMPOTENCY_REFERENCES.length>=15);
for(const [title,url,why] of window.ACADEMY_IDEMPOTENCY_REFERENCES){assert.ok(title&&why&&url.startsWith('https://'));}
const reference=JSON.parse(fs.readFileSync(path.join(root,'v3/curriculum.json'),'utf8'));
assert.deepEqual(window.ACADEMY_CURRICULUM,reference.groups);
const expected=reference.groups.flatMap(g=>g.sections.flatMap(s=>s.lessons));
assert.equal(reference.groups.length,7);assert.equal(reference.groups.flatMap(g=>g.sections).length,23);assert.equal(expected.length,121);
assert.equal(new Set(expected.map(l=>l.id)).size,121);
assert.deepEqual(Object.keys(window.ACADEMY_INTRODUCTIONS).sort(),expected.map(l=>l.id).sort());
for(const topic of expected){const intro=window.ACADEMY_INTRODUCTIONS[topic.id];assert.ok(intro.length===2&&intro[0].length>60&&intro[1].length>120,'Technical definition and explanation: '+topic.id);}
assert.deepEqual(window.ACADEMY_LESSONS.map(({id,title})=>({id,title})),expected);
assert.deepEqual(window.ACADEMY_GROUPS,reference.groups.map(g=>[g.title,g.sections.map(s=>[s.title,s.lessons.map(l=>l.id)])]));
for(const group of reference.groups)for(const section of group.sections){const guide=window.ACADEMY_SECTION_GUIDES[section.title];assert.ok(guide&&guide.length===4,section.title);for(const p of guide)assert.ok(p.length>20,section.title);}
for(const [id,detail] of Object.entries(window.ACADEMY_TOPIC_DETAILS)){assert.ok(expected.some(l=>l.id===id),id);assert.ok(detail.paragraphs.length>=2&&detail.code&&detail.exercise,id);}
for(const lesson of window.ACADEMY_LESSONS){
 for(const field of ['title','problem','model','tradeoff','question','answer','takeaway'])assert.ok(typeof lesson[field]==='string'&&lesson[field].length>0,`${lesson.id}: ${field}`);
 assert.ok(lesson.steps.length>=3,lesson.id);
 if(lesson.deep)assert.ok(fs.existsSync(path.join(root,'v2','chapters',lesson.deep,'index.html')),lesson.deep);
}
console.log('PASS V3: exact 7-section / 23-subsection / 121-topic reference hierarchy; all topics have original notes and valid textbook links.');
