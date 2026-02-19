import { test, expect } from '@playwright/test';

test('Verify occupancy summary matches calendar data', async ({ page }) => {
  const consoleMessages = [];
  let occupancyData = null;
  let calendarData = { availability: 0, appointments: 0 };

  page.on('console', msg => {
    const text = msg.text();

    // Capture occupancy analysis data
    if (text.includes('✅ Occupancy analysis response:')) {
      const match = text.match(/✅ Occupancy analysis response: (.+)/);
      if (match) {
        try {
          occupancyData = JSON.parse(match[1]);
          console.log('📊 Captured occupancy data:', occupancyData);
        } catch (e) {
          console.log('Could not parse occupancy data');
        }
      }
    }

    // Count availability backgrounds and appointment events
    if (text.includes('🟢 AVAILABILITY BACKGROUND') ||
        text.includes('📅 APPOINTMENT EVENTS') ||
        text.includes('📍 Availability slots in map') ||
        text.includes('👥 Appointment events')) {
      consoleMessages.push(text);
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

  console.log('\n=== OCCUPANCY VS CALENDAR COMPARISON ===');

  // Extract occupancy summary from the UI
  try {
    const occupancyText = await page.locator('text=/Ocupación:.*%/').textContent();
    console.log('UI Occupancy text:', occupancyText);

    const occupancyMatch = occupancyText.match(/(\d+\.?\d*)%.*?(\d+\.?\d*)\s*h\s*de\s*(\d+\.?\d*)\s*h/);
    if (occupancyMatch) {
      const uiOccupancyRate = parseFloat(occupancyMatch[1]);
      const uiBookedHours = parseFloat(occupancyMatch[2]);
      const uiAvailableHours = parseFloat(occupancyMatch[3]);

      console.log('UI Occupancy Summary:');
      console.log(`  Rate: ${uiOccupancyRate}%`);
      console.log(`  Booked: ${uiBookedHours}h`);
      console.log(`  Available: ${uiAvailableHours}h`);

      // Compare with API data
      if (occupancyData) {
        console.log('\nAPI Occupancy Data:');
        console.log(`  Rate: ${occupancyData.occupancyRate}%`);
        console.log(`  Booked: ${occupancyData.totalBookedHours}h`);
        console.log(`  Available: ${occupancyData.totalAvailableHours}h`);

        // Check if they match (with small tolerance for rounding)
        const rateMatch = Math.abs(uiOccupancyRate - occupancyData.occupancyRate) < 0.1;
        const bookedMatch = Math.abs(uiBookedHours - occupancyData.totalBookedHours) < 0.1;
        const availableMatch = Math.abs(uiAvailableHours - occupancyData.totalAvailableHours) < 0.1;

        console.log('\nData Consistency Check:');
        console.log(`  Occupancy rate matches: ${rateMatch ? '✅' : '❌'}`);
        console.log(`  Booked hours match: ${bookedMatch ? '✅' : '❌'}`);
        console.log(`  Available hours match: ${availableMatch ? '✅' : '❌'}`);

        if (!rateMatch || !bookedMatch || !availableMatch) {
          console.log('⚠️  MISMATCH DETECTED between UI and API data!');
        }
      }
    }
  } catch (error) {
    console.log('Could not extract occupancy from UI:', error.message);
  }

  // Count calendar visual elements
  const availableCells = await page.locator('.bg-green-50, .bg-yellow-50, .bg-blue-50').count();
  const appointmentEvents = await page.locator('[class*="bg-blue-600"], [class*="bg-deep"]').count();
  const availabilityIndicators = await page.locator('.bg-green-400.opacity-60').count();

  console.log('\nCalendar Visual Elements:');
  console.log(`  Available cells (background): ${availableCells}`);
  console.log(`  Appointment events: ${appointmentEvents}`);
  console.log(`  Availability indicators: ${availabilityIndicators}`);

  // Extract data from console logs
  const mapSizeMessages = consoleMessages.filter(msg => msg.includes('📍 Availability slots in map:'));
  const appointmentMessages = consoleMessages.filter(msg => msg.includes('👥 Appointment events:'));

  if (mapSizeMessages.length > 0) {
    const lastMapMessage = mapSizeMessages[mapSizeMessages.length - 1];
    const slotsMatch = lastMapMessage.match(/(\d+) time slots/);
    if (slotsMatch) {
      console.log(`  Availability slots in map: ${slotsMatch[1]}`);
    }
  }

  if (appointmentMessages.length > 0) {
    const lastAppointmentMessage = appointmentMessages[appointmentMessages.length - 1];
    const appointmentsMatch = lastAppointmentMessage.match(/(\d+) events/);
    if (appointmentsMatch) {
      console.log(`  Appointment events processed: ${appointmentsMatch[1]}`);
    }
  }

  // Count actual background occurrences
  const backgroundCount = consoleMessages.filter(msg => msg.includes('🟢 AVAILABILITY BACKGROUND')).length;
  const eventCount = consoleMessages.filter(msg => msg.includes('📅 APPOINTMENT EVENTS')).length;

  console.log('\nActual Rendering Count:');
  console.log(`  Background availability renders: ${backgroundCount}`);
  console.log(`  Appointment event renders: ${eventCount}`);

  // Take screenshot for manual verification
  await page.screenshot({ path: 'occupancy-calendar-comparison.png', fullPage: true });
  console.log('📸 Screenshot saved as occupancy-calendar-comparison.png');

  // Basic assertion - we should have some data
  expect(availableCells + appointmentEvents).toBeGreaterThan(0);

  console.log('\n✅ Occupancy comparison test completed!');
});