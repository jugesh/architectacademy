const {test,expect}=require('@playwright/test');
const topics=['scalability','databases','caching','messaging','reliability','observability','networking','security','consistency','microservices','rate-limiting','replication-partitioning','deployment-runtime','disaster-recovery','search-pipelines','design-practice'];
test('V4 library links to API design and every authored lesson',async({page})=>{
 await page.goto('/v4/lessons.html');
 await expect(page.locator('.card:not(.practice-card)')).toHaveCount(17);
 for(const href of await page.locator('.card a').evaluateAll(as=>as.map(a=>a.href))){
  const response=await page.request.get(href);expect(response.status()).toBe(200);
 }
 await page.goto('/v4/');await page.getByRole('link',{name:'V4 lesson library',exact:true}).click();
 await expect(page).toHaveURL(/\/v4\/lessons.html$/);
});
for(const topic of topics)test(`V4 ${topic}: navigation, answers, mobile and print`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`/v4/${topic}.html`);
 const nav=page.locator('.side a');
 for(const href of await nav.evaluateAll(as=>as.map(a=>a.getAttribute('href'))))await expect(page.locator(href)).toHaveCount(1);
 await page.locator('.side a[href="#interview"]').click();
 await expect(page).toHaveURL(/#interview$/);
 const first=page.locator('details.qa').first();await first.locator('summary').click();
 await expect(first.locator('.answer')).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.goto(`/v4/${topic}.html`);await page.locator('.mobile-map summary').click();
 await expect(page.locator('.mobile-map a[href="#worked"]')).toBeVisible();
 await page.locator('.mobile-map a[href="#worked"]').click();await expect(page).toHaveURL(/#worked$/);
 await page.emulateMedia({media:'print'});await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
 await expect(page.locator('details.qa:not([open])')).toHaveCount(0);
 await expect(page.locator('.top')).toBeHidden();
 await page.pdf({path:`test-results/v4-${topic}.pdf`,format:'A4',printBackground:true});
 await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
 await expect(page.locator('details.qa[open]')).toHaveCount(0);
 // Repeated browser lifecycle notifications must preserve the initial state.
 await page.emulateMedia({media:'screen'});
 await page.locator('details.qa').first().locator('summary').click();
 await page.evaluate(()=>{dispatchEvent(new Event('beforeprint'));dispatchEvent(new Event('beforeprint'));dispatchEvent(new Event('afterprint'));dispatchEvent(new Event('afterprint'));});
 await expect(page.locator('details.qa[open]')).toHaveCount(1);
 expect(errors).toEqual([]);
});

const guides=['decision-guides','failure-case-studies','capacity-cost','java-spring-internals','interview-workbook','migration-modernization','revision-toolkit'];
for(const guide of guides)test(`V4 guide ${guide}: complete navigation and print lifecycle`,async({page})=>{
 await page.goto(`/v4/${guide}.html`);
 for(const href of await page.locator('.side a').evaluateAll(as=>as.map(a=>a.hash)))await expect(page.locator(href)).toHaveCount(1);
 expect(await page.locator('main').innerText()).not.toContain('undefined');
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.locator('.mobile-map summary').click();
 await page.locator('.mobile-map a[href="#worked"]').click();await expect(page).toHaveURL(/#worked$/);
 await page.evaluate(()=>{dispatchEvent(new Event('beforeprint'));dispatchEvent(new Event('beforeprint'));});
 await expect(page.locator('details.qa:not([open])')).toHaveCount(0);
 await page.evaluate(()=>{dispatchEvent(new Event('afterprint'));dispatchEvent(new Event('afterprint'));});
 await expect(page.locator('details.qa[open]')).toHaveCount(0);
});
test('V4 retrieval tools filter terms, preserve marks and reset only their own key',async({page})=>{
 await page.goto('/v4/revision-toolkit.html');
 await page.getByLabel('Find a term').fill('deadline');
 await expect(page.locator('.glossary-entry:visible')).toHaveCount(1);
 await page.getByLabel('Find a term').fill('nothing-matches-this-term');
 await expect(page.locator('#glossary-count')).toContainText('0 of');
 await page.getByLabel('Reviewed Databases',{exact:true}).check();
 await page.evaluate(()=>localStorage.setItem('unrelated-setting','keep'));
 await page.reload();await expect(page.getByLabel('Reviewed Databases',{exact:true})).toBeChecked();
 await page.getByRole('button',{name:'Reset review marks'}).click();
 await expect(page.getByLabel('Reviewed Databases',{exact:true})).not.toBeChecked();
 expect(await page.evaluate(()=>localStorage.getItem('unrelated-setting'))).toBe('keep');
});
test('V4 tools remain usable when browser storage is blocked',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});});
 await page.goto('/v4/revision-toolkit.html');
 await page.getByLabel('Reviewed Databases',{exact:true}).check();
 await expect(page.locator('#review-status')).toContainText('1 of 17');
 await expect(page.locator('#review-status')).toContainText('unavailable');
});

for(const width of [360,768,1440])test(`V4 API teaching progression at ${width}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:900});await page.goto('/v4/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 for(const id of ['hypermedia','pagination','caching']){
  const section=page.locator('#'+id);
  await expect(section.locator('.definition')).toBeVisible();
  await expect(section.locator('.section-walkthrough')).toHaveCount(1);
  expect(await section.evaluate(e=>!!(e.querySelector('.definition').compareDocumentPosition(e.querySelector('.section-walkthrough'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBeTruthy();
 }
 await page.getByRole('tab',{name:'AWS',exact:true}).click();
 await expect(page.locator('#aws')).toBeVisible();
 expect(errors).toEqual([]);
});

test('V4 API printing expands tabs and answers and preserves original state',async({page})=>{
 await page.goto('/v4/');await page.locator('details.qa').first().locator('summary').click();
 await page.evaluate(()=>{dispatchEvent(new Event('beforeprint'));dispatchEvent(new Event('beforeprint'));});
 await expect(page.locator('details.qa:not([open])')).toHaveCount(0);
 await page.emulateMedia({media:'print'});
 for(const panel of await page.locator('.tab-panel').all())await expect(panel).toBeVisible();
 await page.pdf({path:'test-results/v4-api-foundation.pdf',format:'A4',printBackground:true});
 await page.evaluate(()=>{dispatchEvent(new Event('afterprint'));dispatchEvent(new Event('afterprint'));});
 await expect(page.locator('details.qa[open]')).toHaveCount(1);
});
