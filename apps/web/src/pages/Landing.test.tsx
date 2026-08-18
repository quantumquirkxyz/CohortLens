import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Landing } from './Landing';

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}

afterEach(() => {
  document.documentElement.classList.remove('dark');
  window.localStorage.removeItem('cohortlens-theme');
});

describe('Landing page', () => {
  it('states the product thesis and explains the capabilities', () => {
    renderLanding();

    expect(
      screen.getByRole('heading', { name: /See capital flow before the market does/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Map capital topology')).toBeInTheDocument();
    expect(screen.getByText('Read movement pressure')).toBeInTheDocument();
    expect(screen.getByText('Find lower-friction paths')).toBeInTheDocument();
  });

  it('drives the visitor to the dashboard', () => {
    renderLanding();

    const enterLinks = screen.getAllByRole('link', { name: 'Enter dashboard' });
    expect(enterLinks.length).toBeGreaterThan(0);
    expect(enterLinks[0]).toHaveAttribute('href', '/app');
  });

  it('describes the example graph so the motif is not visual-only', () => {
    renderLanding();

    expect(
      screen.getByRole('img', {
        name: 'Capital flow graph: protocol-1 to pool-a to wallet-4 to exchange-2',
      }),
    ).toBeInTheDocument();
  });

  it('links capability cards to relevant dashboard sections', () => {
    renderLanding();

    expect(screen.getByRole('link', { name: 'Open graph' })).toHaveAttribute('href', '/app/graph');

    expect(screen.getByRole('link', { name: 'View lenses' })).toHaveAttribute('href', '/app/lenses');
    expect(screen.getByRole('link', { name: 'Find routes' })).toHaveAttribute('href', '/app/routes');
  });

  it('has a mobile menu toggle button', () => {
    renderLanding();

    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(menuButton);
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows the pipeline steps', () => {
    renderLanding();

    expect(screen.getByText('Ingest')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Analyze')).toBeInTheDocument();
    expect(screen.getByText('Act')).toBeInTheDocument();
  });
});
