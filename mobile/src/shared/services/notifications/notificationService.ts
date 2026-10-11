/**
 * Notification service — local reminders only.
 *
 * The app currently schedules no OS-level pushes (no push backend). This
 * module centralizes reminder scheduling so a native push package can be
 * dropped in later without touching call sites. Today it:
 *  - validates/sanitizes the payload
 *  - logs in dev
 *  - stores pending reminders via storage so they can be surfaced in-app
 *    (Settings → Reminders) when the user next opens the app.
 */
import { storageService, STORAGE_KEYS } from '../storage/asyncStorageService';

export interface ReminderPayload {
  id: string;
  title: string;
  body: string;
  /** ISO datetime the reminder should be shown. */
  fireAt: string;
  createdAt: string;
}

const REMINDERS_KEY = STORAGE_KEYS.PENDING_SUBMISSIONS;

export const notificationService = {
  async scheduleReminder(payload: ReminderPayload): Promise<void> {
    if (__DEV__) {
      console.log('[notifications] schedule reminder', payload.id, payload.title);
    }
    const existing = await storageService.getJSON<Reminder[]>(REMINDERS_KEY);
    const next = [payload, ...(existing ?? [])].slice(0, 20);
    await storageService.setJSON(REMINDERS_KEY, next);
  },

  async getDueReminders(): Promise<Reminder[]> {
    const all = await storageService.getJSON<Reminder[]>(REMINDERS_KEY);
    const now = Date.now();
    return (all ?? []).filter(r => new Date(r.fireAt).getTime() <= now);
  },

  async clearDue(): Promise<void> {
    const all = await storageService.getJSON<Reminder[]>(REMINDERS_KEY);
    const now = Date.now();
    const remaining = (all ?? []).filter(r => new Date(r.fireAt).getTime() > now);
    await storageService.setJSON(REMINDERS_KEY, remaining);
  },
};

type Reminder = ReminderPayload;
