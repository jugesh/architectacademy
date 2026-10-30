const {test,expect}=require('@playwright/test');
const topics=['scalability','databases','caching','messaging','reliability','observability'];
test('V4 library links to API design and every authored lesson',async({page})=>{
 await page.goto('/v4/lessons.html');
 await expect(page.locator('.card')).toHaveCount(7);
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
