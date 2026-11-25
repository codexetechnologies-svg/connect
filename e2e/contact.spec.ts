import { expect, test } from '@playwright/test';

test('contact form prepares a mail draft without sending or storing the message', async ({ page }) => {
  await page.goto('/contact.html');

  await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
  await page.getByLabel('Your name').fill('Alex Buyer');
  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByLabel('Business type').selectOption({ label: 'Medical shop' });
  await page.getByLabel('What can we help with?').selectOption({ label: 'Medicine search or price comparison' });
  await page.getByRole('textbox', { name: 'Message' }).fill('I have a question about medicine search.');
  await page.getByRole('button', { name: 'Prepare Email' }).click();

  await expect(page.getByRole('status')).toContainText('Open it below and press Send in your email app');
  const draft = page.getByRole('link', { name: 'Open Email Draft' });
  await expect(draft).toBeVisible();
  const href = await draft.getAttribute('href');
  expect(href).toMatch(/^mailto:connectpharma@gmail\.com\?/);
  const decodedHref = decodeURIComponent(href || '');
  expect(decodedHref).toContain('subject=Connect Pharma enquiry: Medicine search or price comparison');
  expect(decodedHref).toContain('Email: alex@example.com');
  expect(decodedHref).toContain('Message:\nI have a question about medicine search.');
  await expect(page.getByText(/website does not send or store your message/i)).toBeVisible();
});

test('contact form requires the essential fields before preparing a draft', async ({ page }) => {
  await page.goto('/contact.html');
  await page.getByRole('button', { name: 'Prepare Email' }).click();

  await expect(page.getByRole('link', { name: 'Open Email Draft' })).toBeHidden();
  await expect(page.getByRole('status')).toBeHidden();
  await expect(page.getByLabel('Your name')).toHaveAttribute('required', '');
  await expect(page.getByLabel('Email address')).toHaveAttribute('required', '');
  await expect(page.getByLabel('What can we help with?')).toHaveAttribute('required', '');
  await expect(page.getByRole('textbox', { name: 'Message' })).toHaveAttribute('required', '');

  await page.getByLabel('Your name').fill('   ');
  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByLabel('What can we help with?').selectOption({ label: 'Other enquiry' });
  await page.getByRole('textbox', { name: 'Message' }).fill('   ');
  await page.getByRole('button', { name: 'Prepare Email' }).click();
  await expect(page.getByRole('status')).toContainText('Please complete the required fields');
  await expect(page.getByRole('link', { name: 'Open Email Draft' })).toBeHidden();
});
