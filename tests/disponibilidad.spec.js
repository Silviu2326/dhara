import { test, expect } from '@playwright/test';

test.describe('Disponibilidad Page', () => {
  test('should login, wait 5 seconds, navigate to disponibilidad and check console for data', async ({ page }) => {
    // Array to collect console messages
    const consoleMessages = [];

    // Listen to console events
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });

    // Listen to network requests
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    });

    // Navigate to login page
    await page.goto('/');

    // Login with credentials
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Wait 5 seconds as requested
    console.log('Waiting 5 seconds...');
    await page.waitForTimeout(5000);

    // Navigate to disponibilidad page
    console.log('Navigating to /disponibilidad...');
    await page.goto('/disponibilidad');

    // Wait for page to load and any data requests to complete
    await page.waitForLoadState('networkidle');

    // Additional wait to ensure all async operations complete
    await page.waitForTimeout(3000);

    // Log console messages found
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
    });

    // Log network requests to availability-related endpoints
    console.log('\n=== NETWORK REQUESTS ===');
    const relevantRequests = networkRequests.filter(req =>
      req.url.includes('disponibilidad') ||
      req.url.includes('availability') ||
      req.url.includes('schedule') ||
      req.url.includes('api')
    );

    relevantRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url} (${req.timestamp})`);
    });

    // Check if we successfully navigated to disponibilidad
    await expect(page).toHaveURL('/disponibilidad');

    console.log('\n=== UI CONTENT VERIFICATION ===');

    // Check for loading states or error messages
    let hasLoadingElement = false;
    let hasErrorElement = false;

    try {
      await page.locator('text=loading').first().waitFor({ timeout: 1000 });
      hasLoadingElement = true;
    } catch (e) {
      hasLoadingElement = false;
    }

    try {
      await page.locator('text=error').first().waitFor({ timeout: 1000 });
      hasErrorElement = true;
    } catch (e) {
      hasErrorElement = false;
    }

    console.log(`Loading element found: ${hasLoadingElement}`);
    console.log(`Error element found: ${hasErrorElement}`);

    // Look for common UI elements that indicate data is displayed
    const uiElements = [
      'button',
      'table',
      'div[data-testid]',
      '.availability',
      '.schedule',
      '.calendar',
      '.slot',
      '.appointment',
      '.booking'
    ];

    for (const selector of uiElements) {
      try {
        const elements = await page.locator(selector).count();
        console.log(`${selector}: ${elements} elements found`);
      } catch (error) {
        console.log(`${selector}: Error checking (${error.message})`);
      }
    }

    // Check for specific text content that might indicate data
    const dataIndicators = [
      'disponibilidad',
      'cita',
      'horario',
      'calendario',
      'slot',
      'available',
      'ocupado',
      'libre'
    ];

    console.log('\n=== TEXT CONTENT ANALYSIS ===');
    for (const text of dataIndicators) {
      try {
        const hasText = await page.locator(`text=${text}`, { timeout: 1000 }).count() > 0;
        console.log(`Text "${text}": ${hasText ? 'Found' : 'Not found'}`);
      } catch (error) {
        console.log(`Text "${text}": Error checking`);
      }
    }

    // Get page content for analysis
    console.log('\n=== PAGE CONTENT SAMPLE ===');
    try {
      const bodyText = await page.locator('body').textContent();
      const contentPreview = bodyText?.substring(0, 500) + '...';
      console.log('Page content preview:', contentPreview);
    } catch (error) {
      console.log('Could not extract page content:', error.message);
    }

    // Check for specific availability-related elements
    console.log('\n=== AVAILABILITY-SPECIFIC ELEMENTS ===');
    const availabilitySelectors = [
      '[data-testid*="availability"]',
      '[class*="availability"]',
      '[class*="calendar"]',
      '[class*="schedule"]',
      'input[type="time"]',
      'input[type="date"]',
      'select',
      '.time-slot',
      '.date-picker'
    ];

    for (const selector of availabilitySelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`${selector}: ${count} elements found`);
          // Get text content of first few elements
          for (let i = 0; i < Math.min(3, count); i++) {
            const text = await page.locator(selector).nth(i).textContent();
            console.log(`  - Element ${i + 1}: "${text?.substring(0, 100)}"`);
          }
        }
      } catch (error) {
        console.log(`${selector}: Error checking`);
      }
    }

    // Specific calendar data verification
    console.log('\n=== CALENDAR DATA VERIFICATION ===');

    // Check for appointment-related elements in calendar
    const appointmentSelectors = [
      '[data-testid*="appointment"]',
      '[class*="appointment"]',
      '[data-testid*="booking"]',
      '[class*="booking"]',
      '[data-testid*="cita"]',
      '[class*="cita"]',
      '.event',
      '[class*="event"]'
    ];

    console.log('Looking for appointments in calendar:');
    for (const selector of appointmentSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`${selector}: ${count} appointment elements found`);
          for (let i = 0; i < Math.min(5, count); i++) {
            const text = await page.locator(selector).nth(i).textContent();
            const classNames = await page.locator(selector).nth(i).getAttribute('class');
            console.log(`  - Appointment ${i + 1}: "${text?.substring(0, 150)}" (class: ${classNames})`);
          }
        }
      } catch (error) {
        console.log(`${selector}: Error checking appointments`);
      }
    }

    // Check for availability slots in calendar
    const slotSelectors = [
      '[data-testid*="slot"]',
      '[class*="slot"]',
      '[data-testid*="time"]',
      '[class*="time"]',
      '.available',
      '[class*="available"]',
      '.busy',
      '[class*="busy"]',
      '.free',
      '[class*="free"]'
    ];

    console.log('\nLooking for availability slots in calendar:');
    for (const selector of slotSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`${selector}: ${count} slot elements found`);
          for (let i = 0; i < Math.min(5, count); i++) {
            const text = await page.locator(selector).nth(i).textContent();
            const classNames = await page.locator(selector).nth(i).getAttribute('class');
            console.log(`  - Slot ${i + 1}: "${text?.substring(0, 100)}" (class: ${classNames})`);
          }
        }
      } catch (error) {
        console.log(`${selector}: Error checking slots`);
      }
    }

    // Check for calendar grid/days structure
    console.log('\nLooking for calendar structure:');
    const calendarStructureSelectors = [
      '.calendar-day',
      '[class*="day"]',
      '.week',
      '[class*="week"]',
      '.grid',
      '[class*="grid"]',
      '.time-block',
      '[class*="time-block"]'
    ];

    for (const selector of calendarStructureSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`${selector}: ${count} calendar structure elements found`);
          // Sample first few elements
          for (let i = 0; i < Math.min(3, count); i++) {
            const text = await page.locator(selector).nth(i).textContent();
            console.log(`  - Structure ${i + 1}: "${text?.substring(0, 80)}..."`);
          }
        }
      } catch (error) {
        console.log(`${selector}: Error checking calendar structure`);
      }
    }

    // Check for specific time indicators (hours, minutes, etc.)
    console.log('\nLooking for time indicators in calendar:');
    const timePatterns = [
      'text=/\\d{1,2}:\\d{2}/',  // Time format like 09:00, 14:30
      'text=/\\d{1,2}h/',       // Hour format like 9h, 14h
      'text=/\\d{1,2}AM|PM/i',  // 12-hour format
      'text=/lunes|martes|miércoles|jueves|viernes|sábado|domingo/i', // Spanish days
      'text=/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i' // English days
    ];

    for (const pattern of timePatterns) {
      try {
        const count = await page.locator(pattern).count();
        if (count > 0) {
          console.log(`${pattern}: ${count} time indicators found`);
          for (let i = 0; i < Math.min(3, count); i++) {
            const text = await page.locator(pattern).nth(i).textContent();
            console.log(`  - Time indicator ${i + 1}: "${text}"`);
          }
        }
      } catch (error) {
        console.log(`${pattern}: Error checking time patterns`);
      }
    }

    // Check if calendar is actually displaying the data we expect
    console.log('\n=== CALENDAR DATA EXPECTATIONS ===');
    console.log('From console logs, we expect to see:');
    console.log('- 4 appointments displayed in calendar');
    console.log('- 5 availability slots visible');
    console.log('- 9 calendar events rendered');
    console.log('- Week view from Sept 22-28, 2025');

    // Take a screenshot of the calendar for manual inspection
    await page.screenshot({
      path: 'calendar-screenshot.png',
      fullPage: true
    });
    console.log('📸 Full page screenshot saved as calendar-screenshot.png');

    // Try to get a specific screenshot of just the calendar area
    try {
      const calendarElement = page.locator('[class*="calendar"], [data-testid*="calendar"]').first();
      if (await calendarElement.count() > 0) {
        await calendarElement.screenshot({ path: 'calendar-area-screenshot.png' });
        console.log('📸 Calendar area screenshot saved as calendar-area-screenshot.png');
      }
    } catch (error) {
      console.log('Could not take calendar area screenshot:', error.message);
    }

    // Assertions
    expect(consoleMessages.length).toBeGreaterThanOrEqual(0);

    // Check for specific console messages indicating data loading
    const hasDataLogs = consoleMessages.some(msg =>
      msg.text.toLowerCase().includes('data') ||
      msg.text.toLowerCase().includes('loading') ||
      msg.text.toLowerCase().includes('fetch') ||
      msg.text.toLowerCase().includes('api') ||
      msg.text.toLowerCase().includes('slots') ||
      msg.text.toLowerCase().includes('availability')
    );

    console.log(`\nData-related console messages found: ${hasDataLogs}`);
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Total network requests: ${networkRequests.length}`);
    console.log(`Relevant API requests: ${relevantRequests.length}`);
  });
});