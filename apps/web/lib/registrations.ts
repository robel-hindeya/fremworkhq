import type { Registration } from '@/lib/api';

/** Registrations made in this browser, keyed by event id, with the token needed to cancel them. */
const STORE = 'fremwork.registrations';

export function loadRegs(): Record<string, Registration> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveRegs(r: Record<string, Registration>) {
  try {
    localStorage.setItem(STORE, JSON.stringify(r));
  } catch {
    /* storage blocked */
  }
}
