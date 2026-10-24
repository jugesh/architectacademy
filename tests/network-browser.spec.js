const {test,expect}=require('@playwright/test');
const url='/v2/chapters/02-networking/http-tls-load-balancing/index.html';
for(const width of [360,390,768,1440])test(`network chapter modes at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 for(const mode of ['textbook','cornell','revision']){
  await page.locator(`[data-mode="${mode}"]`).click();
  await expect(page.locator(`[data-mode="${mode}"]`)).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  await page.screenshot({path:`test-results/network-${width}-${mode}.png`});
 }
 expect(errors).toEqual([]);
});
test('network anchors and mobile diagram',async({page})=>{
 await page.setViewportSize({width:360,height:900});await page.goto(url);
 for(const a of await page.locator('.toc a').all()){
  const href=await a.getAttribute('href');await a.click();await expect(page.locator(href)).toBeInViewport();
 }
 await page.locator('figure').first().scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/network-diagram-mobile.png'});
 await page.locator('#aws-path figure').scrollIntoViewIfNeeded();
 await expect(page.locator('#aws-path svg')).toBeVisible();
 await page.screenshot({path:'test-results/network-aws-mobile.png'});
});
test('network prints all modes with answers',async({page})=>{
 await page.goto(url);
 for(const mode of ['textbook','cornell','revision']){
  await page.emulateMedia({media:'screen'});await page.locator(`[data-mode="${mode}"]`).click();
  await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
  expect(await page.locator('details:not([open])').count()).toBe(0);
  await page.emulateMedia({media:'print'});
  await page.pdf({path:`test-results/network-${mode}.pdf`,format:'A4',printBackground:true});
 }
});
