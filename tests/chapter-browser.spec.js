const {test,expect}=require('@playwright/test');
const base='/v2/chapters/01-foundations/software-architecture/';
for(const pageName of ['index','complete','exercises','review-kit']){
 for(const width of [360,390,768,1440]){
  test(`${pageName} reading modes at ${width}px`,async({page})=>{
   await page.setViewportSize({width,height:900});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+pageName+'.html');
   for(const mode of ['textbook','cornell','revision','textbook']){
    await page.locator(`[data-mode="${mode}"]`).click();
    await expect(page.locator(`[data-mode="${mode}"]`)).toHaveAttribute('aria-pressed','true');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
    if(mode==='revision')await expect(page.locator('.revision-only')).toBeVisible();
   }
   expect(errors).toEqual([]);
   await page.screenshot({path:`test-results/${pageName}-${width}.png`});
  });
 }
 test(`${pageName} print expands and restores answers`,async({page})=>{
  await page.goto(base+pageName+'.html');
  await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
  expect(await page.locator('details:not([open])').count()).toBe(0);
  await page.emulateMedia({media:'print'});
  await expect(page.locator('header')).toBeHidden();
  await page.pdf({path:`test-results/${pageName}.pdf`,format:'A4',printBackground:true});
  await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
  if(await page.locator('details').count())expect(await page.locator('details:not([open])').count()).toBeGreaterThan(0);
 });
}
test('TOC targets and tooltip dismissal',async({page})=>{
 await page.setViewportSize({width:360,height:800});await page.goto(base+'index.html');
 const links=page.locator('.toc a');
 for(let i=0;i<await links.count();i++){
  const link=links.nth(i),href=await link.getAttribute('href');await link.click();
  await expect(page.locator(href)).toBeInViewport();
 }
 const term=page.locator('.term').first();await term.scrollIntoViewIfNeeded();await term.click();
 await expect(page.locator('#book-tooltip')).toBeVisible();
 const b=await page.locator('#book-tooltip').boundingBox();expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(360);
 await term.press('Escape');await expect(page.locator('#book-tooltip')).toBeHidden();
});
