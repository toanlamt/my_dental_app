export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  DOCUMENTS: R2Bucket;
  /** Telegram Bot API token. Optional — Telegram notifications are skipped when absent. */
  TELEGRAM_BOT_TOKEN?: string;
  /** Telegram chat/channel/group ID to receive appointment-request notifications. Optional. */
  TELEGRAM_CHAT_ID?: string;
};
