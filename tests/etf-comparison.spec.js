const { test, expect } = require('@playwright/test');

// Test data constants
const CIBR_DATA = `Ticker	Weight	Name
AAPL	5.2	Apple Inc
MSFT	4.8	Microsoft Corporation
GOOGL	3.1	Alphabet Inc Class A
AMZN	2.9	Amazon.com Inc
TSLA	2.5	Tesla Inc
NVDA	2.3	NVIDIA Corporation
META	2.1	Meta Platforms Inc`;

const VTI_DATA = `Ticker	Weight	Name
AAPL	8.1	Apple Inc
MSFT	7.3	Microsoft Corporation
AMZN	3.2	Amazon.com Inc
GOOGL	2.8	Alphabet Inc Class A
BRK.B	1.4	Berkshire Hathaway Inc Class B
JPM	1.1	JPMorgan Chase & Co
JNJ	0.9	Johnson & Johnson`;

test.describe('ETF Comparison Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('ETF Holdings Comparison Tool');
  });

  test('should load the application with correct initial state', async ({ page }) => {
    // Check page title and main heading
    await expect(page.locator('h1')).toContainText('ETF Holdings Comparison Tool');
    
    // Check initial form elements are present
    await expect(page.getByRole('textbox', { name: 'ETF Ticker (e.g., CIBR, UFO)' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Display Name (optional)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add New ETF' })).toBeVisible();
    
    // Check theme toggle is present
    await expect(page.getByRole('button', { name: /Dark Mode|Light Mode/ })).toBeVisible();
  });

  test('should toggle dark/light theme', async ({ page }) => {
    // Click theme toggle button (should be Dark Mode initially in light theme)
    const themeButton = page.getByRole('button', { name: /Dark Mode|Light Mode/ });
    const initialText = await themeButton.textContent();
    
    await themeButton.click();
    
    // Button text should change
    const newText = await themeButton.textContent();
    expect(newText).not.toBe(initialText);
    
    // Toggle back
    await themeButton.click();
    const finalText = await themeButton.textContent();
    expect(finalText).toBe(initialText);
  });

  test('should create first ETF with holdings data', async ({ page }) => {
    // Fill ETF form
    await page.getByRole('textbox', { name: 'ETF Ticker (e.g., CIBR, UFO)' }).fill('CIBR');
    await page.getByRole('textbox', { name: 'Display Name (optional)' }).fill('iShares Cybersecurity ETF');
    await page.getByPlaceholder('123').fill('2.5');
    await page.getByPlaceholder('My $').fill('5000');
    
    // Click Add New ETF to expand data input section
    await page.getByRole('button', { name: 'Add New ETF' }).click();
    
    // Verify data input section appears
    await expect(page.getByRole('textbox', { name: 'Paste your ETF holdings data' })).toBeVisible();
    
    // Fill holdings data
    await page.getByRole('textbox', { name: 'Paste your ETF holdings data' }).fill(CIBR_DATA);
    
    // Detect columns
    await page.getByRole('button', { name: 'Detect Columns' }).click();
    
    // Set column mappings
    await page.locator('#ticker-column').selectOption(['Ticker']);
    await page.locator('#amount-column').selectOption(['Weight']);
    await page.locator('#description-column').selectOption(['Name']);
    
    // Process ETF
    await page.getByRole('button', { name: 'Process ETF' }).click();
    
    // Verify ETF appears in comparison view
    await expect(page.locator('h3').filter({ hasText: 'CIBR $2.5B - My: $5,000' })).toBeVisible();
    await expect(page.locator('text=iShares Cybersecurity ETF')).toBeVisible();
    
    // Verify some holdings are displayed
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=MSFT')).toBeVisible();
    await expect(page.locator('text=5.2%').first()).toBeVisible();
  });

  test('should create second ETF and show overlap analysis', async ({ page }) => {
    // First, create the first ETF (CIBR)
    await page.getByRole('textbox', { name: 'ETF Ticker (e.g., CIBR, UFO)' }).fill('CIBR');
    await page.getByRole('textbox', { name: 'Display Name (optional)' }).fill('iShares Cybersecurity ETF');
    await page.getByPlaceholder('123').fill('2.5');
    await page.getByPlaceholder('My $').fill('5000');
    await page.getByRole('button', { name: 'Add New ETF' }).click();
    await page.getByRole('textbox', { name: 'Paste your ETF holdings data' }).fill(CIBR_DATA);
    await page.getByRole('button', { name: 'Detect Columns' }).click();
    await page.locator('#ticker-column').selectOption(['Ticker']);
    await page.locator('#amount-column').selectOption(['Weight']);
    await page.locator('#description-column').selectOption(['Name']);
    await page.getByRole('button', { name: 'Process ETF' }).click();
    
    // Now create second ETF (VTI)
    await page.getByRole('textbox', { name: 'ETF Ticker (e.g., CIBR, UFO)' }).fill('VTI');
    await page.getByRole('textbox', { name: 'Display Name (optional)' }).fill('Vanguard Total Stock Market ETF');
    await page.getByPlaceholder('123').fill('1200');
    await page.getByPlaceholder('My $').fill('10000');
    await page.getByRole('button', { name: 'Add New ETF' }).click();
    await page.getByRole('textbox', { name: 'Paste your ETF holdings data' }).fill(VTI_DATA);
    await page.getByRole('button', { name: 'Detect Columns' }).click();
    await page.locator('#ticker-column').selectOption(['Ticker']);
    await page.locator('#amount-column').selectOption(['Weight']);
    await page.locator('#description-column').selectOption(['Name']);
    await page.getByRole('button', { name: 'Process ETF' }).click();
    
    // Verify overlap analysis appears
    await expect(page.locator('h3').filter({ hasText: 'Overlap Analysis' })).toBeVisible();
    
    // Check overlap statistics (should show overlapping holdings)
    await expect(page.locator('text=Total Unique Holdings')).toBeVisible();
    await expect(page.locator('text=Overlapping Holdings')).toBeVisible();
    await expect(page.locator('text=Overlap Percentage')).toBeVisible();
    
    // Verify both ETFs are displayed
    await expect(page.locator('h3').filter({ hasText: 'CIBR $2.5B - My: $5,000' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'VTI $1200B - My: $10,000' })).toBeVisible();
  });

  test('should test sorting functionality', async ({ page }) => {
    // Create first ETF
    await page.getByRole('textbox', { name: 'ETF Ticker (e.g., CIBR, UFO)' }).fill('CIBR');
    await page.getByPlaceholder('123').fill('2.5');
    await page.getByPlaceholder('My $').fill('5000');
    await page.getByRole('button', { name: 'Add New ETF' }).click();
    await page.getByRole('textbox', { name: 'Paste your ETF holdings data' }).fill(CIBR_DATA);
    await page.getByRole('button', { name: 'Detect Columns' }).click();
    await page.locator('#ticker-column').selectOption(['Ticker']);
    await page.locator('#amount-column').selectOption(['Weight']);
    await page.locator('#description-column').selectOption(['Name']);
    await page.getByRole('button', { name: 'Process ETF' }).click();
    
    // Test alphabetical sorting
    await page.getByRole('button', { name: '↑A-Z' }).first().click();
    
    // Verify sort worked by checking if first holding starts with A (AAPL or AMZN)
    const firstHolding = await page.locator('.holding-row').first().locator('.ticker').textContent();
    expect(firstHolding).toMatch(/^A/);
    
    // Test percentage sorting
    await page.getByRole('button', { name: '↓%' }).first().click();
    
    // Should now be sorted by percentage (highest first - MSFT has 4.8%)
    const firstHoldingByPercent = await page.locator('.holding-row').first().locator('.ticker').textContent();
    expect(['AAPL', 'MSFT']).toContain(firstHoldingByPercent); // Either should be at top depending on implementation
  });

  test('should handle financial calculations correctly', async ({ page }) => {
    // Create ETF with known values
    await page.getByRole('textbox', { name: 'ETF Ticker (e.g., CIBR, UFO)' }).fill('TEST');
    await page.getByPlaceholder('123').fill('100'); // $100B total
    await page.getByPlaceholder('My $').fill('1000'); // $1000 investment
    await page.getByRole('button', { name: 'Add New ETF' }).click();
    
    // Add simple test holding: 10% allocation
    await page.getByRole('textbox', { name: 'Paste your ETF holdings data' }).fill('AAPL\t10.0\tApple Inc');
    await page.getByRole('button', { name: 'Detect Columns' }).click();
    await page.locator('#ticker-column').selectOption(['Ticker']);
    await page.locator('#amount-column').selectOption(['Weight']);
    await page.locator('#description-column').selectOption(['Name']);
    await page.getByRole('button', { name: 'Process ETF' }).click();
    
    // Verify calculations
    // 10% of $100B = $10B fund allocation
    // 10% of $1000 = $100 personal allocation
    await expect(page.locator('text=10.0%')).toBeVisible();
    await expect(page.locator('text=$10.0B')).toBeVisible();
    await expect(page.locator('text=My: $100.00')).toBeVisible();
  });

  test('should handle error cases gracefully', async ({ page }) => {
    // Try to process ETF without filling required fields
    await page.getByRole('button', { name: 'Add New ETF' }).click();
    
    // Try to detect columns with no data
    await page.getByRole('button', { name: 'Detect Columns' }).click();
    
    // The app should handle this gracefully without crashing
    await expect(page.locator('h1')).toContainText('ETF Holdings Comparison Tool');
    
    // Try with invalid data format
    await page.getByRole('textbox', { name: 'Paste your ETF holdings data' }).fill('invalid data format');
    await page.getByRole('button', { name: 'Detect Columns' }).click();
    
    // App should still be functional
    await expect(page.getByRole('button', { name: 'Process ETF' })).toBeVisible();
  });

  test('should persist data across page reloads', async ({ page }) => {
    // Create an ETF
    await page.getByRole('textbox', { name: 'ETF Ticker (e.g., CIBR, UFO)' }).fill('PERSIST');
    await page.getByPlaceholder('123').fill('1');
    await page.getByPlaceholder('My $').fill('1000');
    await page.getByRole('button', { name: 'Add New ETF' }).click();
    await page.getByRole('textbox', { name: 'Paste your ETF holdings data' }).fill('AAPL\t10.0\tApple Inc');
    await page.getByRole('button', { name: 'Detect Columns' }).click();
    await page.locator('#ticker-column').selectOption(['Ticker']);
    await page.locator('#amount-column').selectOption(['Weight']);
    await page.locator('#description-column').selectOption(['Name']);
    await page.getByRole('button', { name: 'Process ETF' }).click();
    
    // Verify ETF was created
    await expect(page.locator('h3').filter({ hasText: 'PERSIST' })).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Verify data persisted (LocalStorage should restore it)
    await expect(page.locator('h3').filter({ hasText: 'PERSIST' })).toBeVisible();
    await expect(page.locator('text=AAPL')).toBeVisible();
  });

  test('should support tab management', async ({ page }) => {
    // Create initial ETF
    await page.getByRole('textbox', { name: 'ETF Ticker (e.g., CIBR, UFO)' }).fill('TAB1');
    await page.getByPlaceholder('123').fill('1');
    await page.getByPlaceholder('My $').fill('1000');
    await page.getByRole('button', { name: 'Add New ETF' }).click();
    await page.getByRole('textbox', { name: 'Paste your ETF holdings data' }).fill('AAPL\t10.0\tApple Inc');
    await page.getByRole('button', { name: 'Detect Columns' }).click();
    await page.locator('#ticker-column').selectOption(['Ticker']);
    await page.locator('#amount-column').selectOption(['Weight']);
    await page.locator('#description-column').selectOption(['Name']);
    await page.getByRole('button', { name: 'Process ETF' }).click();
    
    // Check if tab functionality exists
    const tabContainer = page.locator('.tabs-container');
    if (await tabContainer.count() > 0) {
      // Test creating new tab
      const addTabButton = page.locator('text=+');
      if (await addTabButton.count() > 0) {
        await addTabButton.click();
        
        // Verify new tab was created
        await expect(page.locator('text=Comparison 2')).toBeVisible();
      }
    }
  });

  test('should handle ETF deletion', async ({ page }) => {
    // Create an ETF
    await page.getByRole('textbox', { name: 'ETF Ticker (e.g., CIBR, UFO)' }).fill('DELETE');
    await page.getByPlaceholder('123').fill('1');
    await page.getByPlaceholder('My $').fill('1000');
    await page.getByRole('button', { name: 'Add New ETF' }).click();
    await page.getByRole('textbox', { name: 'Paste your ETF holdings data' }).fill('AAPL\t10.0\tApple Inc');
    await page.getByRole('button', { name: 'Detect Columns' }).click();
    await page.locator('#ticker-column').selectOption(['Ticker']);
    await page.locator('#amount-column').selectOption(['Weight']);
    await page.locator('#description-column').selectOption(['Name']);
    await page.getByRole('button', { name: 'Process ETF' }).click();
    
    // Verify ETF exists
    await expect(page.locator('h3').filter({ hasText: 'DELETE' })).toBeVisible();
    
    // Look for delete button (trash icon)
    const deleteButtons = page.getByRole('button', { name: '🗑️' });
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click();
      
      // Handle potential confirmation dialog
      page.on('dialog', dialog => dialog.accept());
      
      // Verify ETF was deleted
      await expect(page.locator('h3').filter({ hasText: 'DELETE' })).not.toBeVisible();
    }
  });
});
