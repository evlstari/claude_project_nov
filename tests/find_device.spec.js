const { test, expect } = require('@playwright/test');

test.describe('Aktivitas di halaman home', ()=> {
    test.beforeEach(async ({page}) => {
        await page.goto('/master');
        console.log(`✅ Login berhasil. URL saat ini ada di dashboard`)
    });

    
    
})