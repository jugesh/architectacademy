const {test,expect}=require('@playwright/test');
test('main website opens the categorized lesson library',async({page})=>{
 await page.goto('/');await expect(page).toHaveURL(/\/v4\/lessons.html$/);
 await expect(page.locator('.core-group')).toHaveCount(6);await expect(page.locator('.guide-group')).toHaveCount(3);
 await expect(page.getByRole('heading',{name:'Find your next lesson.'})).toBeVisible();
});
test('main entry retains query and category deep links',async({page})=>{
 await page.goto('/?entry=test#category-data-consistency');await expect(page).toHaveURL(/\/v4\/lessons.html\?entry=test#category-data-consistency$/);
 await expect(page.locator('#category-data-consistency')).toBeVisible();
});
test('main entry reaches categories with JavaScript disabled',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL});
 try{const page=await context.newPage();await page.goto('/');await expect(page).toHaveURL(/\/v4\/lessons.html$/);await expect(page.locator('.core-group')).toHaveCount(6);}finally{await context.close();}
});
test('V2 bookmarks can reach the library and return to chapter editions',async({page})=>{
 await page.goto('/v2/');await page.getByRole('navigation',{name:'Current lesson library'}).getByRole('link',{name:'Open the categorized lesson library'}).click();
 await expect(page).toHaveURL(/\/v4\/lessons.html$/);
 await page.getByRole('link',{name:'Read the V2 chapter editions →',exact:true}).click();await expect(page).toHaveURL(/\/v2\/$/);
});
test('V3 exposes the categorized library on desktop and in the mobile curriculum',async({page})=>{
 await page.goto('/v3/');await expect(page.getByRole('navigation',{name:'Site'}).getByRole('link',{name:'Browse topics ↗'})).toHaveAttribute('href','../v4/lessons.html');
 await page.setViewportSize({width:360,height:800});await page.locator('#menu').click();
 await page.locator('#sidebar').getByRole('link',{name:'Browse the categorized lesson library ↗'}).click();await expect(page).toHaveURL(/\/v4\/lessons.html$/);
});
