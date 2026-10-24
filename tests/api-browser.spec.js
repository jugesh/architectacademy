const {test,expect}=require('@playwright/test');
const base='/v2/chapters/04-apis/idempotency-safe-retries/';
for(const edition of ['index','complete','deep-dive','interview-bank']) {
 for(const width of [360,390,768,1440]) test(`api ${edition} at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+edition+'.html');
  for(const mode of ['textbook','cornell','revision']) {
   await page.locator(`[data-mode="${mode}"]`).click();
   await expect(page.locator(`[data-mode="${mode}"]`)).toHaveAttribute('aria-pressed','true');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
   if(mode==='revision')await expect(page.locator('.revision-only')).toBeVisible();
  }
  expect(errors).toEqual([]);
 });
 test(`api ${edition} print`,async({page})=>{
  await page.goto(base+edition+'.html');
  for(const mode of ['textbook','cornell','revision']) {
   await page.emulateMedia({media:'screen'});await page.locator(`[data-mode="${mode}"]`).click();
   await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
   expect(await page.locator('details:not([open])').count()).toBe(0);
   await page.emulateMedia({media:'print'});await expect(page.locator('header')).toBeHidden();
   await page.pdf({path:`test-results/api-${edition}-${mode}.pdf`,format:'A4',printBackground:true});
   await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
  }
 });
}
test('api navigation and diagram',async({page})=>{
 await page.setViewportSize({width:360,height:900});await page.goto(base+'index.html');
 for(const a of await page.locator('.toc a').all()){
  const target=await a.getAttribute('href');await a.click();await expect(page.locator(target)).toBeInViewport();
 }
 await page.locator('figure').first().scrollIntoViewIfNeeded();await expect(page.locator('svg').first()).toBeVisible();
 await page.screenshot({path:'test-results/api-mobile.png'});
});
test('idempotency sizing calculator',async({page})=>{
 await page.goto(base+'index.html');
 await expect(page.locator('#idem-output')).toHaveText('140,000,000 records · 117.3 GiB');
 await page.locator('#idem-days').fill('30');
 await expect(page.locator('#idem-output')).toHaveText('600,000,000 records · 502.9 GiB');
});
