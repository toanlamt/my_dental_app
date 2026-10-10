import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from './login-page';
import { BrowserRouter } from 'react-router-dom';

const mockLogin = vi.fn();
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: null,
    login: mockLogin,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

describe('LoginPage', () => {
  it('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    expect(screen.getByLabelText('auth.username')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.signIn' })).toBeInTheDocument();
  });

  it('calls login function with credentials when submitted', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    fireEvent.change(screen.getByLabelText('auth.username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'auth.signIn' }));
    
    expect(mockLogin).toHaveBeenCalledWith('admin', 'password123');
  });
});
