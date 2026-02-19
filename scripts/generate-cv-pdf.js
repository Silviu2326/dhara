import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDF() {
  const htmlPath = path.join(__dirname, '../src/services/api/CurriculumSilviuOprescu_Print.html');
  const outputPath = path.join(__dirname, '../src/services/api/CurriculumSilviuOprescu.pdf');

  console.log('🚀 Iniciando generación de PDF con fondo oscuro...');
  console.log('📄 HTML:', htmlPath);
  console.log('📤 PDF:', outputPath);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Cargar el archivo HTML optimizado para impresión
  const fileUrl = `file://${path.resolve(htmlPath)}`;
  await page.goto(fileUrl, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Esperar renderizado
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generar PDF con printBackground: true
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm'
    },
    printBackground: true,
    scale: 0.85
  });

  await browser.close();

  console.log('✅ PDF generado exitosamente con fondo oscuro:', outputPath);
}

generatePDF().catch(err => {
  console.error('❌ Error generando PDF:', err);
  process.exit(1);
});