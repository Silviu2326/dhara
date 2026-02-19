const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  const htmlPath = path.join(__dirname, 'CurriculumSilviuOprescu.html');
  const cssPath = path.join(__dirname, 'CurriculumSilviuOprescu.css');
  const pdfPath = path.join(__dirname, 'CurriculumSilviuOprescu.pdf');

  console.log('Generando PDF...');
  console.log('HTML:', htmlPath);
  console.log('CSS:', cssPath);
  console.log('PDF Output:', pdfPath);

  // Read HTML and CSS to combine them
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Inject CSS into HTML
  htmlContent = htmlContent.replace('</head>', `<style>${cssContent}</style></head>`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.setContent(htmlContent, {
    waitUntil: 'networkidle0'
  });

  // Generate PDF with print styles
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    footerTemplate: `
      <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
        Página <span class="pageNumber"></span> de <span class="totalPages"></span>
      </div>
    `,
    headerTemplate: '<div></div>'
  });

  await browser.close();

  console.log('✅ PDF generado exitosamente:', pdfPath);
}

generatePDF().catch(err => {
  console.error('Error generando PDF:', err);
  process.exit(1);
});
