import {test,expect} from '@playwright/test';
test('shipper renders mobile-first UI and does not fabricate orders',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.getByRole('heading',{name:'Đơn giao của tôi'})).toBeVisible();await expect(page.getByText('Chưa có đơn trong trạng thái này.')).toBeVisible();await expect(page.getByRole('button',{name:'Tải đơn hàng'})).toBeDisabled();
});
test('api rejects unauthenticated reads',async({request})=>{const response=await request.get('/api/shipper/deliveries');expect([401,503]).toContain(response.status());});
