import { differenceInDays, isValid, startOfDay } from 'date-fns';

/**
 * Computes the lead time in days between demand creation and candidate joining.
 * Returns null if the requisition is not yet fulfilled or dates are invalid.
 */
export function calculateLeadTime(raisedDate: Date, fulfilledDate: Date | null): number | null {
  if (!fulfilledDate) return null;
  if (!isValid(raisedDate) || !isValid(fulfilledDate)) return null;
  
  // Use startOfDay to avoid time-of-day differences causing off-by-one day counts
  return Math.max(0, differenceInDays(startOfDay(fulfilledDate), startOfDay(raisedDate)));
}

/**
 * Validates a provided lead time against the computed date math.
 * Returns true if valid (matches within 1 day tolerance, or no provided value).
 */
export function validateLeadTime(computed: number | null, provided: number | null | undefined): boolean {
  if (computed === null) return true; // Nothing to validate against
  if (provided == null || isNaN(provided)) return true; // No provided value to conflict with
  
  return Math.abs(computed - provided) <= 1;
}
