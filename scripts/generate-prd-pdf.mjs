import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "prd.html");
const pdfPath = path.join(root, "prd.pdf");
const htmlUri = "file:///" + htmlPath.replace(/\\/g, "/");

const pdfStyles = `
  @page {
    size: A4;
    margin: 15mm 15mm 17mm 15mm;
  }

  html.pdf-export {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html.pdf-export body {
    background: #fff !important;
    line-height: 1.78;
    font-size: 11.5pt;
  }

  html.pdf-export .wrap {
    max-width: none;
    margin: 0;
    padding: 0;
  }

  /* Cover — no forced page break; section 1 continues below */
  html.pdf-export .cover {
    min-height: 0;
    margin: 0;
    padding: 6mm 0 5mm;
    border: none;
    border-radius: 0;
    page-break-after: avoid;
    break-after: avoid;
    background: none;
    box-shadow: none;
    position: relative;
  }

  html.pdf-export .cover::before {
    content: "";
    position: absolute;
    top: 0;
    right: -15mm;
    left: -15mm;
    height: 5mm;
    background: #1f6b4a;
  }

  html.pdf-export .cover-head {
    padding-top: 4mm;
    margin-bottom: 2mm;
  }

  html.pdf-export .cover .eyebrow {
    font-size: 9.5pt;
    letter-spacing: 0.1em;
    margin: 0 0 6px;
  }

  html.pdf-export .cover h1 {
    font-size: 22pt;
    margin: 0 0 4px;
    color: #1a1f2e;
  }

  html.pdf-export .cover .subtitle {
    font-size: 14pt;
    margin: 0 0 0;
    color: #1f6b4a;
    font-weight: 600;
  }

  html.pdf-export .cover-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 112mm;
    margin: 0 auto;
    padding: 6mm 0;
  }

  html.pdf-export table.meta {
    font-size: 10.5pt;
    width: 100%;
    max-width: 100mm;
    margin: 0 auto;
  }

  html.pdf-export table.meta th,
  html.pdf-export table.meta td {
    padding: 7px 10px;
  }

  /* First section flows on cover page */
  html.pdf-export .cover + .section {
    border-top: 1px solid #e4e8ef;
    padding-top: 5mm;
    margin-top: 0;
  }

  html.pdf-export .section {
    background: #fff;
    border: none;
    border-radius: 0;
    padding: 0 0 8mm;
    margin: 0 0 6mm;
    page-break-inside: auto;
    break-inside: auto;
  }

  html.pdf-export .section + .section {
    border-top: 1px solid #e4e8ef;
    padding-top: 6mm;
  }

  html.pdf-export h2 {
    font-size: 15.5pt;
    margin: 0 0 10px;
    padding: 6px 0 8px;
    border-bottom: 2px solid #1f6b4a;
    page-break-after: avoid;
    break-after: avoid;
  }

  html.pdf-export .lead {
    font-size: 10pt;
    margin: 0 0 12px;
    color: #5c6578;
  }

  html.pdf-export h3 {
    font-size: 12pt;
    margin: 18px 0 8px;
    page-break-after: avoid;
    break-after: avoid;
  }

  html.pdf-export h4 {
    font-size: 10.5pt;
    margin: 12px 0 5px;
    page-break-after: avoid;
    break-after: avoid;
  }

  html.pdf-export p,
  html.pdf-export li {
    font-size: 11pt;
    margin: 0 0 6px;
  }

  html.pdf-export ul {
    margin: 6px 0 12px;
    padding-right: 18px;
  }

  html.pdf-export li {
    margin-bottom: 4px;
  }

  html.pdf-export .vp,
  html.pdf-export .split,
  html.pdf-export .value-grid {
    gap: 10px;
    margin-top: 10px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  html.pdf-export .vp article,
  html.pdf-export .split article,
  html.pdf-export .value-grid article {
    padding: 10px 12px;
    border-radius: 6px;
  }

  html.pdf-export .vp h4,
  html.pdf-export .split h4,
  html.pdf-export .value-grid h4 {
    font-size: 10pt;
    margin-bottom: 5px;
  }

  html.pdf-export .vp li,
  html.pdf-export .value-grid p {
    font-size: 9.5pt;
  }

  html.pdf-export .out,
  html.pdf-export .scope-out,
  html.pdf-export .global-out {
    padding: 10px 14px;
    margin: 8px 0;
    border-radius: 6px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  html.pdf-export .scope-out li,
  html.pdf-export .global-out li {
    font-size: 10pt;
  }

  html.pdf-export .section.feat h3 {
    margin: 16px 0 12px;
    padding: 5px 10px;
    background: #e8f4ee;
    border-right: 3px solid #1f6b4a;
    border-radius: 4px;
    color: #1f6b4a;
  }

  html.pdf-export .section.feat h3:first-of-type {
    margin-top: 10px;
  }

  html.pdf-export .section.feat h4 {
    border-bottom: 1px solid #e4e8ef;
    padding-bottom: 4px;
    color: #1a1f2e;
  }

  html.pdf-export .block {
    margin-bottom: 8px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  html.pdf-export .block h5 {
    font-size: 9.5pt;
    margin: 12px 0 5px;
  }

  html.pdf-export .flow {
    padding: 12px 14px;
    margin: 10px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  html.pdf-export .flow li {
    font-size: 10pt;
    margin-bottom: 4px;
  }

  html.pdf-export .section.nfr h3 {
    margin: 12px 0 7px;
    font-size: 11pt;
  }

  html.pdf-export .section.nfr li {
    font-size: 10pt;
  }

  html.pdf-export code {
    font-size: 9.5pt;
    background: #f0f3f8;
    padding: 1px 5px;
    border-radius: 3px;
  }

  html.pdf-export table.stories,
  html.pdf-export table.epic-compact {
    font-size: 9.5pt;
    margin: 10px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  html.pdf-export table.stories th,
  html.pdf-export table.stories td,
  html.pdf-export table.epic-compact th,
  html.pdf-export table.epic-compact td {
    padding: 6px 9px;
  }

  html.pdf-export table.epic-compact td.epic-name {
    font-size: 9.5pt;
  }

  html.pdf-export table.epic-compact td.story-list {
    line-height: 1.55;
    font-size: 9pt;
  }

  html.pdf-export .tag {
    font-size: 8.5pt;
    padding: 1px 6px;
  }

  html.pdf-export .screen-list {
    padding: 10px 14px;
    margin: 8px 0 12px;
    font-size: 9.5pt;
  }

  html.pdf-export .screen-list li {
    font-size: 9.5pt;
    margin-bottom: 3px;
  }
`;

const footerTemplate = `
<div style="width:100%; font-family:'Vazirmatn',Tahoma,sans-serif; font-size:8px; color:#8a93a3; padding:0 15mm; direction:rtl; display:flex; justify-content:space-between; align-items:center;">
  <span>مستند نیازمندی‌های محصول — اجاره خودرو · V1</span>
  <span>صفحه <span class="pageNumber"></span> از <span class="totalPages"></span></span>
</div>`;

const headerTemplate = `
<div style="width:100%; font-family:'Vazirmatn',Tahoma,sans-serif; font-size:8px; color:#1f6b4a; padding:0 15mm; direction:rtl; border-bottom:1px solid #e4e8ef; padding-bottom:4px;">
  <span>DigiNext · اجاره خودرو · PRD</span>
</div>`;

function countPdfPages(buffer) {
  return (buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
}

async function main() {
  if (!fs.existsSync(htmlPath)) {
    console.error("prd.html not found:", htmlPath);
    process.exit(1);
  }

  const chromePaths = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  const executablePath = chromePaths.find((p) => fs.existsSync(p));
  if (!executablePath) {
    console.error("Chrome/Edge not found. Set CHROME_PATH env variable.");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--font-render-hinting=medium", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(htmlUri, { waitUntil: "networkidle0", timeout: 60000 });
    await page.evaluate(() => document.documentElement.classList.add("pdf-export"));
    await page.addStyleTag({ content: pdfStyles });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 800));

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: { top: "18mm", bottom: "15mm", left: "0", right: "0" },
      preferCSSPageSize: true,
    });

    const stats = fs.statSync(pdfPath);
    const pages = countPdfPages(fs.readFileSync(pdfPath));
    console.log(`PDF created: ${pdfPath}`);
    console.log(`Pages: ${pages}`);
    console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
