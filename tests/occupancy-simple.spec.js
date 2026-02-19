import { test, expect } from '@playwright/test';

test('Simple occupancy data verification', async ({ page }) => {
  let apiOccupancyData = null;

  page.on('console', msg => {
    const text = msg.text();

    // Look for occupancy analysis response
    if (text.includes('Occupancy analysis response:')) {
      console.log('📊 Found occupancy data:', text);

      // Try to extract the data
      const match = text.match(/Occupancy analysis response: (.+)/);
      if (match) {
        try {
          apiOccupancyData = JSON.parse(match[1]);
        } catch (e) {
          console.log('Could not parse occupancy JSON');
        }
      }
    }

    // Also look for loaded data summary
    if (text.includes('📊 Loaded data:')) {
      console.log('📈 Found loaded data:', text);
    }
  });

  // Login
  await page.goto('/');
  await page.fill('input[name="email"]', 'admin@demo.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');

  // Navigate to availability
  await page.goto('/disponibilidad');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  console.log('\n=== OCCUPANCY DATA ANALYSIS ===');

  if (apiOccupancyData) {
    console.log('API Occupancy Analysis:');
    console.log(`  Total Available Hours: ${apiOccupancyData.totalAvailableHours || 'N/A'}`);
    console.log(`  Total Booked Hours: ${apiOccupancyData.totalBookedHours || 'N/A'}`);
    console.log(`  Occupancy Rate: ${apiOccupancyData.occupancyRate || 'N/A'}%`);
    console.log(`  Total Slots: ${apiOccupancyData.totalSlots || 'N/A'}`);
  } else {
    console.log('❌ No occupancy data captured from API');
  }

  // Look for any occupancy-related text in the page
  const pageText = await page.locator('body').textContent();

  // Search for percentage patterns
  const percentageMatches = pageText.match(/\d+\.?\d*%/g) || [];
  console.log('\nPercentages found on page:', percentageMatches);

  // Search for hour patterns
  const hourMatches = pageText.match(/\d+\.?\d*\s*h/g) || [];
  console.log('Hours found on page:', hourMatches);

  // Look for occupancy-related words
  const hasOccupancy = pageText.toLowerCase().includes('ocupación') || pageText.toLowerCase().includes('occupancy');
  const hasDisponible = pageText.toLowerCase().includes('disponible');
  const hasReservado = pageText.toLowerCase().includes('reservado');

  console.log('\nOccupancy-related text found:');
  console.log(`  Contains 'ocupación': ${hasOccupancy}`);
  console.log(`  Contains 'disponible': ${hasDisponible}`);
  console.log(`  Contains 'reservado': ${hasReservado}`);

  // Count visual elements in calendar
  const availableCells = await page.locator('[class*="bg-green-50"], [class*="bg-yellow-50"], [class*="bg-blue-50"]').count();
  const appointmentElements = await page.locator('[class*="cursor-move"]').count();

  console.log('\nCalendar Visual Count:');
  console.log(`  Available cells (colored background): ${availableCells}`);
  console.log(`  Appointment elements: ${appointmentElements}`);

  // Take screenshot
  await page.screenshot({ path: 'occupancy-page.png', fullPage: true });
  console.log('📸 Screenshot saved as occupancy-page.png');

  console.log('\n✅ Occupancy verification completed!');
});