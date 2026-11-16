const { test, expect } = require('@playwright/test');

test('study notes have a separate index and stay out of the architecture library', async ({ page }) => {
  for (const library of ['/', '/v4/lessons.html']) {
    await page.goto(library);
    await expect(page.locator('a[href*="study-notes"], a[href*="digital-logic"], a[href*="mfcs-i"]')).toHaveCount(0);
  }

  await page.goto('/study-notes/');
  await page.getByRole('link', { name: 'Mathematical Foundations of Computer Science I', exact: true }).click();
  await expect(page).toHaveURL(/\/study-notes\/mfcs-i\/$/);
  await page.getByRole('link', { name: 'Study Notes', exact: true }).click();
  await page.getByRole('link', { name: 'Digital Logic and Computer Organization', exact: true }).click();
  await expect(page).toHaveURL(/\/study-notes\/digital-logic\/$/);
  await expect(page.locator('a[href*="lessons.html"]')).toHaveCount(0);
});

test('old course bookmarks retain query parameters and section links', async ({ page }) => {
  await page.goto('/v4/mfcs-i/unit-1.html?from=bookmark#warshall');
  await expect(page).toHaveURL(/\/study-notes\/mfcs-i\/unit-1\.html\?from=bookmark#warshall$/);
  await expect(page.locator('#warshall')).toBeVisible();

  await page.goto('/v4/digital-logic/unit-4.html#memory');
  await expect(page).toHaveURL(/\/study-notes\/digital-logic\/unit-4\.html#memory$/);
  await expect(page.locator('#memory')).toBeVisible();
});

test('digital logic notes fit a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/study-notes/digital-logic/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Digital Logic and Computer Organization');

  for (const unit of ['I', 'II', 'III', 'IV']) {
    await page.getByRole('navigation', { name: 'Course navigation' })
      .getByRole('link', { name: 'Unit ' + unit, exact: true }).click();
    await expect(page.locator('[aria-current="page"]')).toHaveText('Unit ' + unit);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

    const diagram = page.locator('figure.diagram').first();
    await expect(diagram).toBeVisible();
    const bounds = await diagram.boundingBox();
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);

    const exercise = page.locator('details').first();
    await exercise.locator('summary').click();
    await expect(exercise.locator('p')).toBeVisible();
    await exercise.locator('summary').click();
    await page.emulateMedia({ media: 'print' });
    expect(await exercise.evaluate(node => getComputedStyle(node, '::details-content').contentVisibility)).toBe('visible');
    await page.emulateMedia({ media: 'screen' });
  }
});
