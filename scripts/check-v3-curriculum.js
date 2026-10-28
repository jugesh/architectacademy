/* Offline contract check against the captured public navigation, not an inferred syllabus. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
global.window={};
for(const file of ['curriculum','lessons','topic-notes','curriculum-adapter'])require(path.join(root,'v3',file+'.js'));
const reference=JSON.parse(fs.readFileSync(path.join(root,'v3/curriculum.json'),'utf8'));
assert.deepEqual(window.ACADEMY_CURRICULUM,reference.groups);
const expected=reference.groups.flatMap(g=>g.sections.flatMap(s=>s.lessons));
assert.equal(reference.groups.length,7);assert.equal(reference.groups.flatMap(g=>g.sections).length,23);assert.equal(expected.length,121);
assert.equal(new Set(expected.map(l=>l.id)).size,121);
assert.deepEqual(window.ACADEMY_LESSONS.map(({id,title})=>({id,title})),expected);
assert.deepEqual(window.ACADEMY_GROUPS,reference.groups.map(g=>[g.title,g.sections.map(s=>[s.title,s.lessons.map(l=>l.id)])]));
for(const lesson of window.ACADEMY_LESSONS){
 for(const field of ['title','problem','model','tradeoff','question','answer','takeaway'])assert.ok(typeof lesson[field]==='string'&&lesson[field].length>0,`${lesson.id}: ${field}`);
 assert.ok(lesson.steps.length>=3,lesson.id);
 if(lesson.deep)assert.ok(fs.existsSync(path.join(root,'v2','chapters',lesson.deep,'index.html')),lesson.deep);
}
console.log('PASS V3: exact 7-section / 23-subsection / 121-topic reference hierarchy; all topics have original notes and valid textbook links.');
