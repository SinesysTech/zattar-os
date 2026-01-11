import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { LogoutButton } from '../logout-button';

const mockLogout = jest.fn();

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
    sessionToken: 'test-session-token',
    isLoading: false,
    isAuthenticated: true,
    logout: mockLogout,
    checkSession: jest.fn(),
  }),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the logout button', () => {
    render(<LogoutButton />);
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument();
  });

  it('calls useAuth logout when clicked', async () => {
    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sair/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('uses the shared logout flow that clears secure storage', async () => {
    render(<LogoutButton />);

    const button = screen.getByRole('button', { name: /sair/i });
    fireEvent.click(button);

    // The logout from useAuth is what clears the secure storage keys
    // This test verifies LogoutButton uses that shared flow
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });
});
