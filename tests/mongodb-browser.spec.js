const {test,expect}=require('@playwright/test');
const url='/v2/chapters/08-nosql-storage/mongodb-migration/index.html';
for(const width of [360,390,768,1440]) test('mongodb chapter at '+width,async({page})=>{
  await page.setViewportSize({width,height:900});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  for(const mode of ['textbook','cornell','revision']){
    await page.locator('[data-mode="'+mode+'"]').click();
    await expect(page.locator('[data-mode="'+mode+'"]')).toHaveAttribute('aria-pressed','true');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  }
  expect(errors).toEqual([]);
});
test('mongodb print modes',async({page})=>{
  await page.goto(url);
  for(const mode of ['textbook','cornell','revision']){
    await page.emulateMedia({media:'screen'});await page.locator('[data-mode="'+mode+'"]').click();
    await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));expect(await page.locator('details:not([open])').count()).toBe(0);
    await page.emulateMedia({media:'print'});await expect(page.locator('header')).toBeHidden();
    await page.pdf({path:'test-results/mongodb-'+mode+'.pdf',format:'A4',printBackground:true});
    await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
  }
});
test('mongodb navigation and migration diagram',async({page})=>{
  await page.setViewportSize({width:390,height:900});await page.goto(url);
  for(const a of await page.locator('.toc a').all()){const target=await a.getAttribute('href');await a.click();await expect(page.locator(target)).toBeInViewport();}
  await page.locator('figure').scrollIntoViewIfNeeded();await expect(page.locator('svg')).toBeVisible();
  await page.screenshot({path:'test-results/mongodb-mobile.png'});
});
