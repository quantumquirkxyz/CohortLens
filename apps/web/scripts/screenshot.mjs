/* global console */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  
  // Desktop viewport (1440x900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();
  
  // Mobile viewport (iPhone 14 Pro)
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  console.log('Capturing desktop screenshots...');
  
  // Landing page - dark mode (default)
  await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: 'screenshots/landing-desktop-dark.png', fullPage: true });
  console.log('✓ landing-desktop-dark.png');

  // Landing page - light mode
  await desktopPage.click('button[aria-label="Switch to light mode"]');
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: 'screenshots/landing-desktop-light.png', fullPage: true });
  console.log('✓ landing-desktop-light.png');

  // Dashboard - dark mode
  await desktopPage.click('a[href="/app"]');
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: 'screenshots/dashboard-desktop-dark.png', fullPage: true });
  console.log('✓ dashboard-desktop-dark.png');

  // Graph explorer
  await desktopPage.click('a[href="/app/graph"]');
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: 'screenshots/graph-desktop-dark.png', fullPage: true });
  console.log('✓ graph-desktop-dark.png');

  console.log('\nCapturing mobile screenshots...');

  // Landing page - dark mode
  await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: 'screenshots/landing-mobile-dark.png', fullPage: true });
  console.log('✓ landing-mobile-dark.png');

  // Landing page - light mode
  await mobilePage.click('button[aria-label="Switch to light mode"]');
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: 'screenshots/landing-mobile-light.png', fullPage: true });
  console.log('✓ landing-mobile-light.png');

  // Mobile menu
  await mobilePage.click('button[aria-label="Open menu"]');
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: 'screenshots/landing-mobile-menu.png', fullPage: true });
  console.log('✓ landing-mobile-menu.png');

  // Dashboard - mobile
  await mobilePage.click('a[href="/app"]');
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: 'screenshots/dashboard-mobile-dark.png', fullPage: true });
  console.log('✓ dashboard-mobile-dark.png');

  await browser.close();
  console.log('\n✅ All screenshots captured in screenshots/ directory');
}

captureScreenshots().catch((error) => globalThis.console.error(error));
