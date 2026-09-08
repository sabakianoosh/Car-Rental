import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import HTMLtoDOCX from "@turbodocx/html-to-docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "prd.html");
const docxPath = path.join(root, "prd.docx");

function prepareHtml(rawHtml) {
  const $ = cheerio.load(rawHtml, { decodeEntities: false });

  $("style, script, link").remove();

  const styleMap = {
    h1: "font-size:24pt;font-weight:700;color:#1a1f2e;margin:0 0 8px;",
    h2: "font-size:18pt;font-weight:700;color:#1a1f2e;border-bottom:2px solid #1f6b4a;padding-bottom:6px;margin:24px 0 10px;",
    h3: "font-size:14pt;font-weight:700;color:#1f6b4a;margin:18px 0 8px;",
    h4: "font-size:12pt;font-weight:700;color:#1a1f2e;margin:14px 0 6px;",
    h5: "font-size:10pt;font-weight:600;color:#5c6578;margin:12px 0 4px;",
    p: "font-size:11pt;line-height:1.7;margin:0 0 8px;",
    li: "font-size:11pt;line-height:1.7;margin:0 0 4px;",
    ul: "margin:6px 0 12px;padding-right:24px;",
    ol: "margin:6px 0 12px;padding-right:24px;",
    code: "font-family:Consolas,Tahoma,sans-serif;background:#f0f3f8;padding:1px 4px;",
    table: "width:100%;border-collapse:collapse;margin:10px 0 14px;",
    th: "border:1px solid #cfd6e0;background:#f4f6f9;padding:6px 8px;font-size:10pt;font-weight:600;text-align:right;",
    td: "border:1px solid #cfd6e0;padding:6px 8px;font-size:10pt;text-align:right;vertical-align:top;",
  };

  for (const [tag, style] of Object.entries(styleMap)) {
    $(tag).each((_, el) => {
      const current = $(el).attr("style") || "";
      $(el).attr("style", `${style}${current}`);
    });
  }

  $(".eyebrow").each((_, el) => {
    $(el).replaceWith(
      `<p style="font-size:10pt;font-weight:600;color:#1f6b4a;letter-spacing:0.08em;margin:0 0 6px;">${$(el).html()}</p>`
    );
  });

  $(".subtitle").each((_, el) => {
    $(el).replaceWith(
      `<p style="font-size:14pt;color:#1f6b4a;font-weight:600;margin:0 0 16px;">${$(el).html()}</p>`
    );
  });

  $(".lead").each((_, el) => {
    $(el).attr("style", "font-size:10.5pt;color:#5c6578;margin:0 0 14px;line-height:1.7;");
  });

  $(".cover").each((_, el) => {
    $(el).attr(
      "style",
      "margin:0 0 24px;padding:0 0 18px;border-bottom:3px solid #1f6b4a;"
    );
  });

  $(".section.feat h3").each((_, el) => {
    $(el).attr(
      "style",
      "font-size:13pt;font-weight:700;color:#1f6b4a;background:#e8f4ee;padding:6px 10px;border-right:4px solid #1f6b4a;margin:20px 0 10px;"
    );
  });

  $(".scope-out, .out, .global-out").each((_, el) => {
    $(el).attr(
      "style",
      "background:#f8f1f1;border:1px solid #eadcdc;border-radius:6px;padding:10px 12px;margin:8px 0 12px;"
    );
  });

  $(".vp article, .split article, .value-grid article, .flow").each((_, el) => {
    $(el).attr(
      "style",
      "background:#e8f4ee;border:1px solid #c5dfd0;border-radius:6px;padding:10px 12px;margin:0 0 8px;"
    );
  });

  $(".block").each((_, el) => {
    $(el).attr("style", "margin:0 0 8px;");
  });

  $(".epic-name").each((_, el) => {
    $(el).attr("style", "font-weight:700;color:#1f6b4a;white-space:nowrap;");
  });

  $(".story-list").each((_, el) => {
    $(el).attr("style", "font-size:10pt;line-height:1.6;");
  });

  $("div, article, section").each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    if (tag === "div" || tag === "article" || tag === "section") {
      const cls = $(el).attr("class");
      if (cls && /^(wrap|section|block|cover-head|cover-meta)$/.test(cls)) {
        $(el).removeAttr("class");
      }
    }
  });

  const bodyHtml = $(".wrap").html() || $("body").html();
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>مستند نیازمندی‌های محصول — اجاره خودرو</title>
</head>
<body dir="rtl" style="font-family:Tahoma,'B Nazanin',Arial,sans-serif;color:#1a1f2e;line-height:1.7;">
${bodyHtml}
</body>
</html>`;
}

async function main() {
  if (!fs.existsSync(htmlPath)) {
    console.error("prd.html not found:", htmlPath);
    process.exit(1);
  }

  const rawHtml = fs.readFileSync(htmlPath, "utf8");
  const html = prepareHtml(rawHtml);

  const buffer = await HTMLtoDOCX(
    html,
    null,
    {
      orientation: "portrait",
      pageSize: { width: 11906, height: 16838 },
      margins: {
        top: 1200,
        right: 1200,
        bottom: 1200,
        left: 1200,
        header: 720,
        footer: 720,
        gutter: 0,
      },
      title: "مستند نیازمندی‌های محصول — اجاره خودرو",
      subject: "PRD V1",
      creator: "DigiNext",
      keywords: ["PRD", "اجاره خودرو"],
      font: "Tahoma",
      fontSize: 22,
      lang: "fa-IR",
      direction: "rtl",
      decodeUnicode: true,
      table: {
        row: { cantSplit: false },
      },
      footer: true,
      footerType: "default",
    },
    `<p style="text-align:center;font-size:9pt;color:#8a93a3;">مستند نیازمندی‌های محصول — اجاره خودرو · V1</p>`
  );

  fs.writeFileSync(docxPath, buffer);
  const stats = fs.statSync(docxPath);
  console.log(`DOCX created: ${docxPath}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
