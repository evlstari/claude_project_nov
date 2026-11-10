
const { test, expect, chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');


const LOGIN_URL = 'https://websms-staging.mceasy.cloud/login';
const DASHBOARD_URL = 'https://websms-staging.mceasy.cloud/master';

const CREDENTIALS = {
  email: process.env.LOGIN_EMAIL || 'edev@mail.com',
  password: process.env.LOGIN_PASSWORD || '123123',
};

const SELECTORS = {
  email: 'input[name="email"]',
  password: 'input[name="password"]',
  submit: 'button[type="submit"]',
};

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const authFile = path.join(__dirname, '../.auth/user.json')

async function takeFailureScreenshot(page, label) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(SCREENSHOT_DIR, `${label}-${timestamp}.png`);
  try {
    await page.screenshot({ path: filePath, fullPage: true });
    console.error(`📸 Screenshot disimpan: ${filePath}`);
  } catch (screenshotError) {
    console.error(`Gagal mengambil screenshot: ${screenshotError.message}`);
  }
  return filePath;
}

test.describe('Login McEasy Staging', () => {
  test('berhasil login dan redirect ke dashboard', async ({}, testInfo) => {
    // Visual UI: buka browser fisik dan jeda 1 detik di setiap langkah
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();

    try {
      // 1. Buka halaman login
      console.log(`➡️  Membuka ${LOGIN_URL}`);
      await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

      // 2. Isi email
      const emailInput = page.locator(SELECTORS.email);
      await expect(emailInput).toBeVisible();
      await emailInput.fill(CREDENTIALS.email);

      // 3. Isi password
      const passwordInput = page.locator(SELECTORS.password);
      await expect(passwordInput).toBeVisible();
      await passwordInput.fill(CREDENTIALS.password);

      // 4. Klik tombol login
      console.log('➡️  Klik tombol login');
      await page.locator(SELECTORS.submit).click();

      // 5. Verifikasi redirect ke dashboard
      await page.waitForURL(`${DASHBOARD_URL}**`, { timeout: 30_000 });
      await expect(page).toHaveURL(new RegExp(`^${DASHBOARD_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));

      console.log(`✅ Login berhasil. URL saat ini: ${page.url()}`);

      //Simpan cookie + localStorage
      await page.context().storageState({path: authFile});

      // Tahan browser agar tidak langsung tertutup.
      // page.pause() tidak berfungsi saat headless, jadi pakai jeda waktu (default 10 detik, ubah via HOLD_MS)
      const holdMs = Number(process.env.HOLD_MS || 10_000);
      test.setTimeout(testInfo.timeout + holdMs); // tambah timeout test sebesar durasi jeda
      console.log(`⏸️  Menahan browser selama ${holdMs / 1000} detik...`);
      await page.waitForTimeout(holdMs);
    } catch (error) {
      console.error(`❌ Login gagal: ${error.message}`);
      console.error(`   URL terakhir: ${page.url()}`);

      const screenshotPath = await takeFailureScreenshot(page, 'login-failed');
      await testInfo.attach('login-failed', { path: screenshotPath, contentType: 'image/png' })
        .catch(() => {});

      throw error; // tetap gagalkan test agar terlapor di report
    } finally {
      await browser.close();
    }
  });
});
