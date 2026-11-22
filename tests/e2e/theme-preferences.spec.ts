import {test,expect} from '@playwright/test';
// Public browser interaction; no login or production mutations required.
for(const width of [390,768,1366]){
  test(`all portals support theme switching at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:850});
    const response=await page.goto('/login',{waitUntil:'domcontentloaded'});
    expect(response?.status()).toBe(200);
    const trigger=page.getByRole('button',{name:'Tùy chọn giao diện'});
    await expect(trigger).toBeVisible();
    await trigger.click();
    await page.getByRole('button',{name:'Tối',exact:true}).click();
    await expect(page.locator('html')).toHaveAttribute('data-gp-theme','dark');
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('html')).toHaveAttribute('data-gp-theme','dark');
    await trigger.click();
    await page.getByRole('button',{name:'Sáng',exact:true}).click();
    await expect(page.locator('html')).toHaveAttribute('data-gp-theme','light');
    const pageWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
    expect(pageWidth).toBeLessThanOrEqual(width+2);
  });
}
