const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  const filePath = 'file:///' + path.resolve(__dirname, 'capture.html').replace(/\\/g, '/');
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Wait for font to load
  await page.waitForFunction(() => document.fonts.ready);

  const sticker = await page.$('#sticker-a');
  await sticker.screenshot({
    path: path.join(__dirname, 'sticker-option-a.png'),
    omitBackground: true,
  });

  await browser.close();
  console.log('Done → sticker/sticker-option-a.png');
})();
