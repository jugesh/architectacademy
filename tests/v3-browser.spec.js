const {test,expect}=require('@playwright/test');
test('V3 curriculum, retry effects, saved state and revision',async({page})=>{
 await page.goto('/v3/#idempotency');
 await expect(page.locator('h1')).toHaveText('Idempotency: one payment, many attempts');
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
 await expect(page.locator('#progress-text')).toHaveText('1 of 25 completed');
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
 await expect(page.locator('h1')).toHaveText('Publish events without a dual-write gap');
 if(width===360)await expect(page.locator('#sidebar')).toBeHidden();
 await page.screenshot({path:`test-results/v3-${width}.png`,fullPage:true});expect(errors).toEqual([]);
});
test('V3 every lesson renders and textbook links resolve',async({page})=>{
 await page.goto('/v3/');const ids=await page.evaluate(()=>ACADEMY_LESSONS.map(l=>l.id));
 for(const id of ids){await page.goto('/v3/#'+id);await expect(page.locator('h1')).toBeVisible();await expect(page.locator('#personal-notes')).toBeVisible();}
 const paths=await page.evaluate(()=>ACADEMY_LESSONS.filter(l=>l.deep).map(l=>'/v2/chapters/'+l.deep+'/index.html'));
 for(const path of paths)expect((await page.request.get(path)).status()).toBe(200);
 await page.goto('/v3/#idempotency');await page.emulateMedia({media:'print'});await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
 await expect(page.locator('.topbar')).toBeHidden();await expect(page.locator('details.question')).toHaveAttribute('open','');
 await page.pdf({path:'test-results/v3-idempotency.pdf',format:'A4',printBackground:true});
});
test('V3 handles unavailable storage and unknown lessons',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('Storage disabled');};});
 await page.goto('/v3/#idempotency');await page.locator('#save').click();await expect(page.locator('#storage-message')).toBeVisible();
 await page.goto('/v3/#missing');await expect(page.locator('h1')).toHaveText('Lesson not found');await page.getByRole('link',{name:'Return to the introduction'}).click();await expect(page.locator('h1')).toHaveText('Think in systems, not components');
});
