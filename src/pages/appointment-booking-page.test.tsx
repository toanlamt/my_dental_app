import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppointmentBookingPage } from './appointment-booking-page';
import { BrowserRouter } from 'react-router-dom';
import * as authContext from '@/lib/auth-context';

vi.mock('@/lib/auth-context', () => ({
  apiRequest: vi.fn().mockResolvedValue({ doctors: [] }),
}));

vi.mock('@/lib/seo', () => ({
  usePageMeta: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AppointmentBookingPage', () => {
  it('renders booking form correctly', () => {
    render(
      <BrowserRouter>
        <AppointmentBookingPage />
      </BrowserRouter>
    );
    expect(screen.getByLabelText('appointmentRequests.name')).toBeInTheDocument();
    expect(screen.getByLabelText('appointmentRequests.phone')).toBeInTheDocument();
    expect(screen.getByLabelText('appointmentRequests.date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'appointmentRequests.submit' })).toBeInTheDocument();
  });

  it('shows error on invalid phone', async () => {
    render(
      <BrowserRouter>
        <AppointmentBookingPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('appointmentRequests.name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('appointmentRequests.phone'), { target: { value: 'invalid-phone' } });
    
    // Use form submit directly to avoid HTML5 validation blocking in JSDOM
    const form = screen.getByLabelText('appointmentRequests.name').closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('appointmentRequests.invalidPhone')).toBeInTheDocument();
    });
  });

  it('submits form successfully', async () => {
    (authContext.apiRequest as any).mockResolvedValue({ request: { id: 'test-req-123' } });

    render(
      <BrowserRouter>
        <AppointmentBookingPage />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('appointmentRequests.name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('appointmentRequests.phone'), { target: { value: '1234567890' } });
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const dateStr = futureDate.toISOString().slice(0, 10);
    
    fireEvent.change(screen.getByLabelText('appointmentRequests.date'), { target: { value: dateStr } });
    fireEvent.change(screen.getByLabelText('appointmentRequests.time'), { target: { value: '10:00' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'appointmentRequests.submit' }));

    await waitFor(() => {
      expect(authContext.apiRequest).toHaveBeenCalled();
    });
  });
});
