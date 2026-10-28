const {test,expect}=require('@playwright/test');
test('V3 curriculum, retry effects, saved state and revision',async({page})=>{
 await page.goto('/v3/#idempotency');
 await expect(page.locator('h1')).toHaveText('Idempotency');
 await expect(page.locator('#sim-total')).toHaveText('$49.99');
 await page.getByRole('button',{name:'No key',exact:true}).click();
 await expect(page.locator('#sim-total')).toHaveText('$149.97');
 await page.getByRole('button',{name:'New key each time',exact:true}).click();
 await expect(page.locator('#sim-verdict')).toContainText('3 charges');
 await page.getByRole('button',{name:'Stable key',exact:true}).click();
 await page.locator('#save').click();
 await page.locator('#personal-notes').fill('Same intent, same key.');
 await page.locator('#complete').click();
 await page.reload();
 await expect(page.locator('#save')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#personal-notes')).toHaveValue('Same intent, same key.');
 await expect(page.locator('#progress-text')).toHaveText('1 of 121 completed');
 await page.getByRole('button',{name:'Saved',exact:true}).click();
 await expect(page.locator('.lesson-link')).toHaveCount(1);
 await page.getByRole('button',{name:'Revision',exact:true}).click();
 await expect(page.locator('.revision-content')).toBeVisible();
 await expect(page.locator('.full-content')).toBeHidden();
 await page.getByRole('button',{name:'All lessons',exact:true}).click();
 await page.locator('#search').fill('zz-no-result');
 await expect(page.locator('#no-results')).toBeVisible();
});
for(const width of [360,768,1440])test(`V3 layout and navigation ${width}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:1000});await page.goto('/v3/#idempotency');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 if(width===360){await page.locator('#menu').click();await expect(page.locator('#sidebar')).toBeVisible();}
 await page.locator('#search').fill('outbox');await page.locator('.lesson-link').click();
 await expect(page.locator('h1')).toHaveText('Multi-System Sync');
 if(width===360)await expect(page.locator('#sidebar')).toBeHidden();
 await page.screenshot({path:`test-results/v3-${width}.png`,fullPage:true});expect(errors).toEqual([]);
});
test('V3 every lesson renders and textbook links resolve',async({page})=>{
 await page.goto('/v3/');const topics=await page.evaluate(()=>ACADEMY_LESSONS.map(l=>({id:l.id,title:l.title})));
 expect(topics).toHaveLength(121);
 for(const {id,title} of topics){await page.goto('/v3/#'+id);await expect(page.locator('h1')).toHaveText(title);await expect(page.locator('#personal-notes')).toBeVisible();}
 const paths=await page.evaluate(()=>ACADEMY_LESSONS.filter(l=>l.deep).map(l=>'/v2/chapters/'+l.deep+'/index.html'));
 for(const path of paths)expect((await page.request.get(path)).status()).toBe(200);
 await page.goto('/v3/#idempotency');await page.emulateMedia({media:'print'});await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
 await expect(page.locator('.topbar')).toBeHidden();await expect(page.locator('details.question')).toHaveAttribute('open','');
 await page.pdf({path:'test-results/v3-idempotency.pdf',format:'A4',printBackground:true});
});
test('V3 handles unavailable storage and unknown lessons',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('Storage disabled');};});
 await page.goto('/v3/#idempotency');await page.locator('#save').click();await expect(page.locator('#storage-message')).toBeVisible();
 await page.goto('/v3/#missing');await expect(page.locator('h1')).toHaveText('Lesson not found');await page.getByRole('link',{name:'Return to the introduction'}).click();await expect(page.locator('h1')).toHaveText('Introduction');
});
test('V3 navigation exactly matches every reference title, parent and position',async({page})=>{
 const reference=require('../v3/curriculum.json');await page.goto('/v3/');
 const expected=reference.groups.map(g=>({title:g.title,sections:g.sections.map(s=>({title:s.title,lessons:s.lessons}))}));
 const actual=await page.evaluate(()=>[...document.querySelectorAll('.curriculum-group')].map(g=>{
  const heading=g.querySelector('summary').cloneNode(true);heading.querySelector('.group-number').remove();
  return {title:heading.textContent.trim(),sections:[...g.querySelectorAll('.subgroup')].map(s=>({title:s.querySelector('h3').textContent,lessons:[...s.querySelectorAll('.lesson-link')].map(a=>{const label=a.cloneNode(true);label.querySelector('.dot').remove();return {id:a.getAttribute('href').slice(1),title:label.textContent};})}))};
 }));expect(actual).toEqual(expected);
 const content=await page.evaluate(()=>ACADEMY_LESSONS.map(l=>({id:l.id,title:l.title,model:l.model,steps:l.steps})));
 expect(content.map(({id,title})=>({id,title}))).toEqual(reference.groups.flatMap(g=>g.sections.flatMap(s=>s.lessons)));
 for(const lesson of content){expect(lesson.model.length).toBeGreaterThan(30);expect(lesson.steps.length).toBeGreaterThanOrEqual(3);}
});
test('V3 old bookmarks reach canonical reference topics',async({page})=>{
 for(const [old,id,title] of [['start','what-is-system-design-interview','Introduction'],['outbox','multi-system-data-sync','Multi-System Sync'],['timeouts','timeout','Timeout']]){
  await page.goto('/v3/#'+old);await expect(page.locator('h1')).toHaveText(title);await expect(page).toHaveURL(new RegExp('#'+id+'$'));
 }
});
test('V3 migrates earlier browser notes and progress without duplication',async({page})=>{
 await page.goto('/v3/');await page.evaluate(()=>localStorage.setItem('architect-academy-v3',JSON.stringify({saved:['start'],completed:['timeouts'],notes:{timeouts:'Keep the outcome unresolved.'},mode:'notes'})));
 await page.goto('/v3/#timeout');await page.reload();
 await expect(page.locator('#personal-notes')).toHaveValue('Keep the outcome unresolved.');
 await expect(page.locator('#complete')).toHaveAttribute('aria-pressed','true');
 await page.locator('#personal-notes').fill('Keep the outcome unresolved. Query by stable intent.');await page.reload();
 await expect(page.locator('#personal-notes')).toHaveValue('Keep the outcome unresolved. Query by stable intent.');
 await page.goto('/v3/#what-is-system-design-interview');await expect(page.locator('#save')).toHaveAttribute('aria-pressed','true');
});
