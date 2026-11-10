// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: false,          // browser fisik selalu terbuka
    launchOptions: { slowMo: 500 }, // perlambat agar proses terlihat
    viewport: { width: 1366, height: 768 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    //jalan lebih dulu login
    {
      name: 'setup', testMatch: /auth\.setup\.js/,
    },
    { name: 'chromium', testMatch: /.*\.spec\.js/, use: { ...devices['Desktop Chrome'], headless: true, launchOptions: { args: ['--no-sandbox'] } }, dependencies: ['setup'] },
  ],
});
