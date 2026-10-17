import type { Env } from '../lib/db';
import type { Appointment, AppointmentRequest } from '../lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TelegramApiResponse = {
  ok: boolean;
  result?: unknown;
  description?: string;
  error_code?: number;
};

// ---------------------------------------------------------------------------
// HTML escaping
// Telegram sendMessage with parse_mode=HTML requires that dynamic values
// are escaped so that customer-supplied text cannot inject HTML tags.
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

/**
 * Sends a message via the Telegram Bot API.
 *
 * Returns true on confirmed delivery (ok: true in Telegram response).
 * Throws on network/timeout errors so callers can decide whether to log.
 *
 * Uses AbortSignal.timeout() to cap latency at 4 s — appropriate for a
 * Cloudflare Pages Function that must return a 201 to the customer quickly.
 */
export async function sendTelegramMessage(
  token: string,
  chatId: string,
  html: string,
): Promise<TelegramApiResponse> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
    }),
    signal: AbortSignal.timeout(4000),
  });

  const data = (await response.json()) as TelegramApiResponse;
  return data;
}

// ---------------------------------------------------------------------------
// Message builder — personal-data minimization
// Only sends the minimum fields a clinic receptionist needs to action a
// new appointment request. No medical records, diagnosis, or credentials.
// ---------------------------------------------------------------------------

export function buildAppointmentRequestMessage(request: AppointmentRequest, doctorName?: string | null): string {
  const lines: string[] = [
    '🦷 <b>Yêu cầu đặt lịch mới / New Appointment Request</b>',
    '',
    `📋 <b>Mã tham chiếu:</b> <code>${escapeHtml(request.id)}</code>`,
    `👤 <b>Họ và tên / Name:</b> ${escapeHtml(request.full_name)}`,
    `📞 <b>Số điện thoại / Phone:</b> ${escapeHtml(request.phone)}`,
    `📅 <b>Ngày mong muốn / Preferred date:</b> ${escapeHtml(request.preferred_date)}`,
    `🕐 <b>Giờ mong muốn / Preferred time:</b> ${escapeHtml(request.preferred_time)}`,
  ];

  if (request.service_slug) {
    lines.push(`🩺 <b>Dịch vụ / Service:</b> ${escapeHtml(request.service_slug)}`);
  }

  if (doctorName) {
    lines.push(`👨‍⚕️ <b>Bác sĩ yêu cầu / Requested doctor:</b> ${escapeHtml(doctorName)}`);
  }

  if (request.message) {
    // Truncate customer notes to 150 characters to keep the message readable.
    const truncated = request.message.length > 150
      ? `${request.message.slice(0, 150)}…`
      : request.message;
    lines.push(`💬 <b>Ghi chú / Notes:</b> ${escapeHtml(truncated)}`);
  }

  lines.push('');
  lines.push('👉 <i>Vui lòng xem xét trong trang quản lý / Please review in the admin panel.</i>');

  return lines.join('\n');
}

export function buildAppointmentCreatedMessage(
  appointment: Appointment,
  patientName: string,
  doctorName?: string | null,
  phone?: string | null,
): string {
  const lines: string[] = [
    '🦷 <b>Lịch hẹn mới đã được tạo / New Appointment Scheduled</b>',
    '',
    `📋 <b>Mã lịch hẹn:</b> <code>${escapeHtml(appointment.id)}</code>`,
    `👤 <b>Bệnh nhân / Patient:</b> ${escapeHtml(patientName)}`,
  ];

  if (phone) {
    lines.push(`📞 <b>Số điện thoại / Phone:</b> ${escapeHtml(phone)}`);
  }

  lines.push(
    `📅 <b>Thời gian bắt đầu / Start:</b> ${escapeHtml(appointment.start_at)}`,
    `🕐 <b>Thời gian kết thúc / End:</b> ${escapeHtml(appointment.end_at)}`,
  );

  if (doctorName) {
    lines.push(`👨‍⚕️ <b>Bác sĩ / Doctor:</b> ${escapeHtml(doctorName)}`);
  }

  if (appointment.reason) {
    const truncated = appointment.reason.length > 150
      ? `${appointment.reason.slice(0, 150)}…`
      : appointment.reason;
    lines.push(`💬 <b>Lý do khám / Reason:</b> ${escapeHtml(truncated)}`);
  }

  lines.push('');
  lines.push('👉 <i>Vui lòng xem chi tiết trong lịch phòng khám / Please view in clinic calendar.</i>');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public API — safe wrappers
// ---------------------------------------------------------------------------

/**
 * Sends a Telegram notification for a newly created appointment request.
 *
 * If either TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is absent, this function
 * logs an informational notice and returns immediately — never throws.
 * Telegram is a secondary notification channel; any failure is logged but
 * must not fail the primary appointment_request insert.
 */
export async function sendAppointmentRequestNotification(
  env: Pick<Env, 'TELEGRAM_BOT_TOKEN' | 'TELEGRAM_CHAT_ID'>,
  request: AppointmentRequest,
  doctorName?: string | null,
): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.info('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured — skipping notification');
    return;
  }

  const message = buildAppointmentRequestMessage(request, doctorName);
  const result = await sendTelegramMessage(token, chatId, message);

  if (!result.ok) {
    throw new Error(
      `Telegram API returned ok=false: ${result.description ?? 'unknown error'} (code=${result.error_code ?? '?'})`,
    );
  }
}

/**
 * Fire-and-forget wrapper. Catches all errors (network, timeouts, API errors)
 * and logs them, so that the calling route handler is never impacted.
 * This mirrors the pattern used by createNotificationsSafely in [[route]].ts.
 */
export async function sendAppointmentRequestNotificationSafely(
  env: Pick<Env, 'TELEGRAM_BOT_TOKEN' | 'TELEGRAM_CHAT_ID'>,
  request: AppointmentRequest,
  doctorName?: string | null,
): Promise<void> {
  try {
    await sendAppointmentRequestNotification(env, request, doctorName);
  } catch (err) {
    console.error('[telegram] Failed to send appointment request notification:', err);
  }
}

export async function sendAppointmentCreatedNotification(
  env: Pick<Env, 'TELEGRAM_BOT_TOKEN' | 'TELEGRAM_CHAT_ID'>,
  appointment: Appointment,
  patientName: string,
  doctorName?: string | null,
  phone?: string | null,
): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.info('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured — skipping notification');
    return;
  }

  const message = buildAppointmentCreatedMessage(appointment, patientName, doctorName, phone);
  const result = await sendTelegramMessage(token, chatId, message);

  if (!result.ok) {
    throw new Error(
      `Telegram API returned ok=false: ${result.description ?? 'unknown error'} (code=${result.error_code ?? '?'})`,
    );
  }
}

export async function sendAppointmentCreatedNotificationSafely(
  env: Pick<Env, 'TELEGRAM_BOT_TOKEN' | 'TELEGRAM_CHAT_ID'>,
  appointment: Appointment,
  patientName: string,
  doctorName?: string | null,
  phone?: string | null,
): Promise<void> {
  try {
    await sendAppointmentCreatedNotification(env, appointment, patientName, doctorName, phone);
  } catch (err) {
    console.error('[telegram] Failed to send appointment created notification:', err);
  }
}
