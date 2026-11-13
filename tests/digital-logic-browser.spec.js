const { test, expect } = require('@playwright/test');

test('digital logic notes open from both libraries and fit a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  for (const library of ['/', '/v4/lessons.html']) {
    await page.goto(library);
    await page.getByRole('link', { name: 'Digital logic notes', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Digital Logic and Computer Organization');
  }

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
