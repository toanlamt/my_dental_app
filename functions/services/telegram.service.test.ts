import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  sendTelegramMessage,
  buildAppointmentRequestMessage,
  sendAppointmentRequestNotification,
  sendAppointmentRequestNotificationSafely,
  buildAppointmentCreatedMessage,
} from './telegram.service';
import type { AppointmentRequest } from '../lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockRequest(overrides: Partial<AppointmentRequest> = {}): AppointmentRequest {
  return {
    id: 'req-uuid-123',
    full_name: 'Nguyễn Văn A',
    phone: '0901234567',
    email: null,
    service_slug: 'general-dentistry',
    doctor_id: null,
    doctor_name: null,
    preferred_date: '2026-11-01',
    preferred_time: '09:00',
    message: null,
    status: 'pending',
    rejection_reason: null,
    created_at: '2026-10-17T04:51:00Z',
    reviewed_at: null,
    reviewed_by: null,
    converted_appointment_id: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildAppointmentRequestMessage
// ---------------------------------------------------------------------------

describe('buildAppointmentRequestMessage', () => {
  it('includes the request ID, name, phone, date, and time', () => {
    const msg = buildAppointmentRequestMessage(makeMockRequest());
    expect(msg).toContain('req-uuid-123');
    expect(msg).toContain('Nguyễn Văn A');
    expect(msg).toContain('0901234567');
    expect(msg).toContain('2026-11-01');
    expect(msg).toContain('09:00');
  });

  it('includes service slug when present', () => {
    const msg = buildAppointmentRequestMessage(makeMockRequest({ service_slug: 'orthodontics' }));
    expect(msg).toContain('orthodontics');
  });

  it('omits service line when service_slug is null', () => {
    const msg = buildAppointmentRequestMessage(makeMockRequest({ service_slug: null }));
    expect(msg).not.toContain('Dịch vụ');
  });

  it('includes doctor name when provided', () => {
    const msg = buildAppointmentRequestMessage(makeMockRequest(), 'Dr. Trần Thị B');
    expect(msg).toContain('Dr. Trần Thị B');
  });

  it('omits doctor line when no doctor name is given', () => {
    const msg = buildAppointmentRequestMessage(makeMockRequest(), null);
    expect(msg).not.toContain('Bác sĩ');
  });

  it('includes customer note when present', () => {
    const msg = buildAppointmentRequestMessage(makeMockRequest({ message: 'Răng đau nhiều' }));
    expect(msg).toContain('Răng đau nhiều');
  });

  it('truncates customer notes longer than 150 characters', () => {
    const longNote = 'A'.repeat(200);
    const msg = buildAppointmentRequestMessage(makeMockRequest({ message: longNote }));
    expect(msg).toContain('A'.repeat(150));
    expect(msg).toContain('…');
    expect(msg).not.toContain('A'.repeat(151));
  });

  it('omits notes line when message is null', () => {
    const msg = buildAppointmentRequestMessage(makeMockRequest({ message: null }));
    expect(msg).not.toContain('Ghi chú');
  });

  it('HTML-escapes dangerous characters in full_name', () => {
    const msg = buildAppointmentRequestMessage(makeMockRequest({ full_name: '<script>alert("xss")</script>' }));
    expect(msg).not.toContain('<script>');
    expect(msg).toContain('&lt;script&gt;');
    expect(msg).toContain('&quot;xss&quot;');
  });

  it('HTML-escapes ampersands in phone numbers', () => {
    const msg = buildAppointmentRequestMessage(makeMockRequest({ phone: '090&1234567' }));
    expect(msg).toContain('090&amp;1234567');
  });

  it('HTML-escapes dangerous characters in message notes', () => {
    const msg = buildAppointmentRequestMessage(makeMockRequest({ message: '<b>bold</b> & "quoted"' }));
    expect(msg).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(msg).toContain('&amp;');
    expect(msg).toContain('&quot;quoted&quot;');
  });
});

// ---------------------------------------------------------------------------
// sendTelegramMessage
// ---------------------------------------------------------------------------

describe('sendTelegramMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls the Telegram Bot API with the correct URL and payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: true, result: { message_id: 42 } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await sendTelegramMessage('test-token', '-100123456', '<b>Hello</b>');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.telegram.org/bottest-token/sendMessage');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.chat_id).toBe('-100123456');
    expect(body.text).toBe('<b>Hello</b>');
    expect(body.parse_mode).toBe('HTML');
    expect(result.ok).toBe(true);
  });

  it('returns the Telegram error response when API returns ok=false', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: false, error_code: 400, description: 'Bad Request: chat not found' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await sendTelegramMessage('token', 'bad-chat-id', 'text');
    expect(result.ok).toBe(false);
    expect(result.error_code).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// sendAppointmentRequestNotification
// ---------------------------------------------------------------------------

describe('sendAppointmentRequestNotification', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips silently when TELEGRAM_BOT_TOKEN is missing', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(
      sendAppointmentRequestNotification(
        { TELEGRAM_BOT_TOKEN: undefined, TELEGRAM_CHAT_ID: '-123' },
        makeMockRequest(),
      ),
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips silently when TELEGRAM_CHAT_ID is missing', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(
      sendAppointmentRequestNotification(
        { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: undefined },
        makeMockRequest(),
      ),
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws when Telegram API responds with ok=false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: false, error_code: 401, description: 'Unauthorized' }),
    }));

    await expect(
      sendAppointmentRequestNotification(
        { TELEGRAM_BOT_TOKEN: 'bad-token', TELEGRAM_CHAT_ID: '-123' },
        makeMockRequest(),
      ),
    ).rejects.toThrow('Telegram API returned ok=false: Unauthorized (code=401)');
  });

  it('sends successfully when credentials are valid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: true, result: { message_id: 7 } }),
    }));

    await expect(
      sendAppointmentRequestNotification(
        { TELEGRAM_BOT_TOKEN: 'valid-token', TELEGRAM_CHAT_ID: '-999' },
        makeMockRequest(),
      ),
    ).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// sendAppointmentRequestNotificationSafely
// ---------------------------------------------------------------------------

describe('sendAppointmentRequestNotificationSafely', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw when Telegram returns an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: false, error_code: 400, description: 'Bad Request' }),
    }));

    await expect(
      sendAppointmentRequestNotificationSafely(
        { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: '-123' },
        makeMockRequest(),
      ),
    ).resolves.toBeUndefined();
  });

  it('does not throw when fetch times out (AbortError)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      Object.assign(new DOMException('The operation was aborted', 'AbortError')),
    ));

    await expect(
      sendAppointmentRequestNotificationSafely(
        { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: '-123' },
        makeMockRequest(),
      ),
    ).resolves.toBeUndefined();
  });

  it('does not throw when network fetch fails entirely', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(
      sendAppointmentRequestNotificationSafely(
        { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: '-123' },
        makeMockRequest(),
      ),
    ).resolves.toBeUndefined();
  });

  it('delivers successfully under normal conditions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: true, result: { message_id: 1 } }),
    }));

    await expect(
      sendAppointmentRequestNotificationSafely(
        { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: '-123' },
        makeMockRequest({ message: 'Test note' }),
        'Dr. Lê Văn C',
      ),
    ).resolves.toBeUndefined();
  });
});

describe('buildAppointmentCreatedMessage', () => {
  const mockAppointment = {
    id: 'apt-123',
    patient_id: 'p1',
    doctor_id: 'd1',
    start_at: '2026-10-18T09:00:00Z',
    end_at: '2026-10-18T10:00:00Z',
    status: 'scheduled' as const,
    reason: 'Routine cleaning',
    notes: null,
    created_at: '2026-10-17T00:00:00Z',
    updated_at: '2026-10-17T00:00:00Z',
  };

  it('includes core appointment details and escapes HTML', () => {
    const msg = buildAppointmentCreatedMessage(mockAppointment, 'Nguyễn <Van> A', 'Dr. B', '0901234567');
    expect(msg).toContain('apt-123');
    expect(msg).toContain('Nguyễn &lt;Van&gt; A');
    expect(msg).toContain('Dr. B');
    expect(msg).toContain('0901234567');
    expect(msg).toContain('Routine cleaning');
  });
});

describe('sendAppointmentCreatedNotificationSafely', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips silently when secrets are missing', async () => {
    const { sendAppointmentCreatedNotificationSafely } = await import('./telegram.service');
    await expect(
      sendAppointmentCreatedNotificationSafely(
        {},
        { id: '1', patient_id: 'p', doctor_id: 'd', start_at: 'a', end_at: 'b', status: 'scheduled', reason: null, notes: null, created_at: '', updated_at: '' },
        'Patient',
      ),
    ).resolves.toBeUndefined();
  });

  it('handles network error safely without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { sendAppointmentCreatedNotificationSafely } = await import('./telegram.service');
    await expect(
      sendAppointmentCreatedNotificationSafely(
        { TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_CHAT_ID: 'chat' },
        { id: '1', patient_id: 'p', doctor_id: 'd', start_at: 'a', end_at: 'b', status: 'scheduled', reason: null, notes: null, created_at: '', updated_at: '' },
        'Patient',
      ),
    ).resolves.toBeUndefined();
  });
});
