import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TARGET_DIR = path.resolve(__dirname, '../../docs/screenshots');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'mobile_390px', width: 390, height: 844 },
  { name: 'tablet_768px', width: 768, height: 1024 },
  { name: 'desktop_1440px', width: 1440, height: 900 },
];

const THEMES = ['dark', 'light'] as const;

const PAGES = [
  { slug: 'home', route: '/' },
  { slug: 'new_review', route: '/app/new' },
  { slug: 'review_queue', route: '/app/queue' },
  { slug: 'brand_hub', route: '/app/hub' },
  { slug: 'audit_disclosure', route: '/app/audit' },
  { slug: 'insights', route: '/app/insights' },
  { slug: 'settings', route: '/app/settings' },
];

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`Saving screenshots to: ${TARGET_DIR}`);

  // First fetch a valid review ID
  let sampleReviewId = 'REV-DEMO-001';
  try {
    await page.goto('http://localhost:5173/app/queue');
    await page.waitForLoadState('domcontentloaded');
    const firstReviewLink = page.locator('table tbody tr td a, table tbody tr td:first-child, .font-mono.font-bold').first();
    const txt = await firstReviewLink.textContent();
    if (txt && txt.trim().startsWith('REV-')) {
      sampleReviewId = txt.trim();
    }
  } catch {
    // fallback to REV-DEMO-001
  }

  const allPages = [
    ...PAGES,
    { slug: 'review_findings', route: `/app/review/${sampleReviewId}` },
  ];

  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const p of allPages) {
        await page.goto(`http://localhost:5173${p.route}`);
        await page.waitForLoadState('domcontentloaded');

        // Apply theme to document element
        await page.evaluate((th) => {
          if (th === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('pramaan_theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('pramaan_theme', 'light');
          }
        }, theme);

        await page.waitForTimeout(350); // settle animations

        const filename = `${p.slug}_${vp.name}_${theme}.png`;
        const filepath = path.join(TARGET_DIR, filename);

        await page.screenshot({ path: filepath, fullPage: false });
        console.log(`Saved: ${filename}`);
      }
    }
  }

  await browser.close();
  console.log('Finished capturing all responsive screenshots!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
