import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { MemoryRouter } from 'react-router';
import { expect, it } from 'vitest';
import OurStoryPage from '../../pages/our-story';

it('presents the neighborhood concept, pilot limits, and working navigation', () => {
  render(<HelmetProvider><MemoryRouter><OurStoryPage /></MemoryRouter></HelmetProvider>);
  expect(screen.getByRole('heading', { level: 1, name: 'Less driving. More work on the block.' })).toBeVisible();
  expect(screen.getByText('Concept illustration, not a live route or service area.')).toBeVisible();
  expect(screen.getByText(/hypotheses to test, not guaranteed savings or earnings/)).toBeVisible();
  expect(screen.getByRole('region', { name: 'Our pilot' })).toHaveTextContent('No online payments or automatic dispatch.');
  expect(screen.getByRole('link', { name: 'Explore the provider demo' })).toHaveAttribute('href', '/join');
  expect(screen.getByRole('link', { name: 'Explore services' })).toHaveAttribute('href', '/book');
});

it('keeps story questions expandable with the first answer open', async () => {
  render(<HelmetProvider><MemoryRouter><OurStoryPage /></MemoryRouter></HelmetProvider>);
  const user = userEvent.setup();
  const first = screen.getByText('What is Blokpakt?').closest('summary');
  const provider = screen.getByText('What is the provider experience meant to be like?').closest('summary');
  expect(first?.parentElement).toHaveAttribute('open');
  expect(provider?.parentElement).not.toHaveAttribute('open');
  expect(provider).not.toBeNull();
  if (!provider) throw new Error('Provider story summary is missing.');
  await user.click(provider);
  expect(provider?.parentElement).toHaveAttribute('open');
  expect(screen.getByText(/Block claiming, job photos, and earnings screens are currently demo concepts/)).toBeVisible();
});
