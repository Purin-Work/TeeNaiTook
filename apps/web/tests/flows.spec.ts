import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('home → search → product → comparison → chart ranges', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ที่ไหนถูก');
  await expect(page.getByText('โหมดสาธิต', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'ราคาลด', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'สินค้ายอดนิยม', exact: true })).toBeVisible();
  const search = page.getByRole('combobox', { name: 'ค้นหาสินค้า' });
  await search.fill('9800x3d');
  await expect(page.getByRole('listbox')).toBeVisible();
  await search.press('Escape');
  await search.press('Enter');
  await expect(page).toHaveURL(/search\?q=9800x3d/);
  await page.locator('.product-card').first().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AMD Ryzen 7 9800X3D');
  await expect(page.locator('.offer-row')).toHaveCount(3);
  await expect(page.locator('.offer-best')).toContainText('Advice');
  await expect(page.getByRole('heading', { name: /ราคาใน Shopee/ })).toBeVisible();
  await expect(page.locator('.shopee-card')).toHaveCount(3);
  await expect(page.locator('.shopee-card').first()).toContainText('ราคาสุทธิโดยประมาณ');
  await expect(page.getByText('ราคาหลังโค้ดเป็นค่าประมาณ')).toBeVisible();
  await expect(page.getByTestId('price-chart')).toBeVisible();
  for (const range of ['7 วัน', '90 วัน', 'ทั้งหมด', '30 วัน']) {
    await page.getByRole('button', { name: range, exact: true }).click();
    await expect(page.getByRole('button', { name: range, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByTestId('price-chart')).toBeVisible();
  }
  await page.getByRole('button', { name: 'แยกร้าน', exact: true }).click();
  await expect(page.locator('.chart-legend')).toContainText('JIB');
  expect(errors).toEqual([]);
});

test('shareable filters, empty results, mobile navigation and overflow', async ({ page }) => {
  await page.goto('/search');
  await page.getByRole('combobox', { name: /หมวดหมู่/ }).selectOption('RAM');
  await expect(page).toHaveURL(/category=RAM/);
  await expect(page.getByRole('combobox', { name: /แบรนด์/ }).locator('option')).toHaveText([
    'ทุกแบรนด์',
    'Kingston',
  ]);
  await page.getByRole('combobox', { name: /หมวดหมู่/ }).selectOption('CPU');
  await expect(page).toHaveURL(/category=CPU/);
  await expect(page.getByRole('combobox', { name: /แบรนด์/ }).locator('option')).toHaveText([
    'ทุกแบรนด์',
    'AMD',
    'Intel',
  ]);
  await page.getByRole('combobox', { name: /แบรนด์/ }).selectOption('AMD');
  await expect(page).toHaveURL(/brand=AMD/);
  await page.getByRole('button', { name: '฿5,000–10,000', exact: true }).click();
  await expect(page).toHaveURL(/minPrice=5000.*maxPrice=10000/);
  await page.getByLabel('เฉพาะสินค้าที่มีพร้อมขาย', { exact: true }).check();
  await expect(page).toHaveURL(/inStock=true/);
  await page.getByRole('combobox', { name: /เรียงตาม/ }).selectOption('name');
  await expect(page).toHaveURL(
    /category=CPU.*brand=AMD.*minPrice=5000.*maxPrice=10000.*inStock=true.*sort=name/,
  );
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card')).toContainText('AMD Ryzen 5 9600X');
  await page.goto('/search?q=no-such-product-fixture');
  await expect(page.getByRole('heading', { name: 'ไม่พบสินค้าที่ค้นหา' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'เปิดเมนู', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'หมวดหมู่' }).click();
  await expect(page).toHaveURL('/categories');
  for (const path of ['/', '/search', '/product/amd-ryzen-7-9800x3d', '/about']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      path,
    ).toBe(false);
  }
});

test('admin login → create/edit → map source → test scrape → readable log → archive', async ({
  page,
}) => {
  if (process.env.SCRAPER_ENABLED !== 'false')
    throw new Error(
      'Browser admin test requires SCRAPER_ENABLED=false so no retailer is contacted.',
    );
  const slug = `browser-test-${randomUUID()}`;
  let productId = '';
  await page.goto('/admin');
  await expect(page).toHaveURL('/admin/login');
  await page.getByLabel('อีเมล', { exact: true }).fill(process.env.ADMIN_SEED_EMAIL || '');
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill(process.env.ADMIN_SEED_PASSWORD || '');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.goto('/admin/products/new');
  await page.getByLabel('ชื่อสินค้า', { exact: true }).fill('Browser test CPU');
  await page.getByLabel('Slug', { exact: true }).fill(slug);
  await page.getByLabel('แบรนด์', { exact: true }).fill('Test');
  await page.getByRole('button', { name: 'บันทึกสินค้า', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products\/[a-f0-9-]+$/);
  productId = page.url().split('/').at(-1)!;
  try {
    await page
      .getByLabel('คำอธิบาย', { exact: true })
      .fill('Created by the browser integration test.');
    await page.getByRole('button', { name: 'บันทึกสินค้า', exact: true }).click();
    await expect(page.getByText('บันทึกสินค้าเรียบร้อยแล้ว')).toBeVisible();
    await page
      .getByRole('combobox', { name: 'ร้านค้า', exact: true })
      .selectOption({ label: 'JIB' });
    await page
      .getByLabel('URL หน้าสินค้า', { exact: true })
      .fill('https://www.jib.co.th/product/browser-test-fixture');
    await page.getByRole('button', { name: 'บันทึก Source', exact: true }).click();
    await expect(page.getByRole('button', { name: 'ทดสอบการดึงราคา', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'ทดสอบการดึงราคา', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ผลการดึงราคา', exact: true })).toBeVisible();
    await expect(page.getByTestId('scrape-result')).toContainText('SCRAPER_DISABLED');
    await expect(page.locator('.status-FAILED')).toBeVisible();
  } finally {
    if (productId) {
      await page.goto(`/admin/products/${productId}`);
      await page.getByRole('checkbox', { name: /เปิดใช้งานสินค้า/ }).uncheck();
      await page.getByRole('button', { name: 'บันทึกสินค้า', exact: true }).click();
      await expect(page.getByText('บันทึกสินค้าเรียบร้อยแล้ว')).toBeVisible();
    }
  }
  await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).click();
  await expect(page).toHaveURL('/admin/login');
});
