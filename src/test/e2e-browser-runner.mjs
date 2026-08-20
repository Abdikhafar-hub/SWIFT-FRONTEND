import puppeteer from "puppeteer-core";

async function run() {
  console.log("🚀 Launching local Google Chrome (/usr/bin/google-chrome)...");
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  console.log("🌐 Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

  const title = await page.title();
  console.log(`✅ Page loaded! Title: "${title}"`);

  await browser.close();
}

run().catch((err) => {
  console.error("❌ Error launching browser:", err);
  process.exit(1);
});
