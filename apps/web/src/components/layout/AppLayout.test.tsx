import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppLayout } from './AppLayout';

vi.mock('../wallet/WalletButton', () => ({
  WalletButton: () => <button type="button">Connect wallet</button>,
}));

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<p>Dashboard content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout', () => {
  it('provides a keyboard-accessible mobile navigation menu', () => {
    renderLayout();

    const toggle = screen.getByRole('button', { name: 'Open navigation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: 'Graph' }).at(-1)).toHaveAttribute('href', '/app/graph');
  });
});
