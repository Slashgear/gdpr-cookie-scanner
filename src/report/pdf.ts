import { writeFile } from "fs/promises";
import { chromium } from "playwright";

export async function generatePdf(html: string, outputPath: string): Promise<void> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
    await writeFile(outputPath, pdf);
  } finally {
    await browser.close();
  }
}
