/**
 * Lightweight spaced-repetition scheduler (SM-2-lite).
 *
 * The classic SM-2 algorithm uses a 0-5 recall grade. Flashcards here only
 * expose a binary "known" / "missed" gesture, so we map that to SM-2:
 *   - known  -> quality 5 (correct, easy recall)
 *   - missed -> quality 2 (incorrect, must review again soon)
 *
 * A card carries three pieces of state: `interval` (days until it is due
 * again), `easeFactor` (how quickly the interval grows) and `repetitions`
 * (consecutive successes). `schedule()` returns the next state plus the ISO
 * `dueDate`, so the flashcard player can persist it and re-queue due cards.
 */

export type ReviewGrade = 'known' | 'missed';

export interface SRState {
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface SRResult extends SRState {
  dueDate: string;
}

export const MIN_EASE_FACTOR = 1.3;
export const DEFAULT_EASE_FACTOR = 2.5;

/** Fresh card defaults — due immediately so it appears in the first session. */
export function initialSRState(now: Date = new Date()): SRResult {
  return {
    interval: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    repetitions: 0,
    dueDate: now.toISOString(),
  };
}

function addDays(from: Date, days: number): Date {
  const result = new Date(from);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Compute the next scheduling state for a card given the user's recall grade.
 * `now` is injectable to keep the function deterministic in tests.
 */
export function schedule(state: SRState, grade: ReviewGrade, now: Date = new Date()): SRResult {
  if (grade === 'missed') {
    // Reset progress; the card becomes due again in the same session.
    return {
      interval: 0,
      easeFactor: Math.max(MIN_EASE_FACTOR, state.easeFactor - 0.2),
      repetitions: 0,
      dueDate: now.toISOString(),
    };
  }

  const repetitions = state.repetitions + 1;

  let interval: number;
  if (repetitions === 1) {
    interval = 1;
  } else if (repetitions === 2) {
    interval = 3;
  } else {
    interval = Math.round(state.interval * state.easeFactor);
  }

  // Nudge ease factor up slightly on a clean recall (capped for sanity).
  const easeFactor = Math.min(3.0, state.easeFactor + 0.1);

  return {
    interval,
    easeFactor,
    repetitions,
    dueDate: addDays(now, interval).toISOString(),
  };
}

/** True when a card's due date has arrived (used to build the review queue). */
export function isDue(dueDate: string | undefined, now: Date = new Date()): boolean {
  if (!dueDate) return true;
  return new Date(dueDate).getTime() <= now.getTime();
}
