const {test,expect}=require('@playwright/test');
test('main index directly contains the categorized library without a redirect',async({page})=>{
 const response=await page.goto('/');const html=await response.text();expect(html).toContain('class="library-group core-group"');expect(html).not.toContain('http-equiv="refresh"');expect(html).not.toContain('location.replace');
 await expect(page).toHaveURL(/\/$/);await expect(page.locator('.core-group')).toHaveCount(6);await expect(page.locator('.guide-group')).toHaveCount(3);
 await expect(page.getByRole('heading',{name:'Find your next lesson.'})).toBeVisible();await expect(page.locator('.card[data-lesson="index"] a')).toHaveAttribute('href','v4/index.html');
});
test('main entry retains query and category deep links on the home page',async({page})=>{
 await page.goto('/?entry=test#category-data-consistency');await expect(page).toHaveURL(/\/\?entry=test#category-data-consistency$/);
 await expect(page.locator('#category-data-consistency')).toBeVisible();
});
test('main entry displays categories with JavaScript disabled',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL});
 try{const page=await context.newPage();await page.goto('/index.html');await expect(page).toHaveURL(/\/index.html$/);await expect(page.locator('.core-group')).toHaveCount(6);await expect(page.locator('.card')).toHaveCount(24);}finally{await context.close();}
});
test('root search opens the matching V4 section',async({page})=>{
 await page.goto('/');await page.getByLabel('Search lessons and technical terms').fill('invalidationFloor');const result=page.locator('#search-results a[href="v4/caching.html#invalidation-race"]');await expect(result).toBeVisible();await result.click();await expect(page).toHaveURL(/\/v4\/caching.html#invalidation-race$/);
});
test('root resume, progress and mobile printing use the same lessons',async({page})=>{
 await page.goto('/v4/caching.html');await page.getByLabel('Lesson progress',{exact:true}).selectOption('reviewed');await page.goto('/v4/caching.html#write-pattern');await page.goto('/');
 await expect(page.locator('#resume-learning a')).toHaveAttribute('href','v4/caching.html#write-pattern');await expect(page.locator('#study-summary')).toContainText('1 reviewed');
 await page.setViewportSize({width:360,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByLabel('Show',{exact:true}).selectOption('reviewed');await expect(page.locator('.card:visible')).toHaveCount(1);await page.emulateMedia({media:'print'});await expect(page.locator('.card:visible')).toHaveCount(24);
});
test('current home and lesson pages have no links back to V2 or V3',async({page})=>{
 const index=await(await page.request.get('/v4/search-index.json')).json();const urls=['/','/v4/lessons.html',...new Set(index.map(r=>'/v4/'+r.url.split('#')[0]))];
 for(const url of urls){const response=await page.request.get(url);expect(response.status()).toBe(200);const html=await response.text();const links=[...html.matchAll(/href="([^\"]+)"/g)].map(m=>m[1]);for(const href of links){const target=new URL(href,'http://127.0.0.1:8000'+url);expect(target.pathname).not.toMatch(/\/v[23](?:\/|$)/);}}
});
