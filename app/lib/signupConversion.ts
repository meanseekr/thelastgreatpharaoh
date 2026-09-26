// In-memory handoff between SignupForm and the success-page tracker. This
// proves the browser actually completed a new signup during the current
// client-side visit without writing advertising state to a cookie or web
// storage before the visitor has granted Advertising consent.
let pendingConversionId: string | null = null;

export function rememberSignupConversion(id: string): void {
  pendingConversionId = id;
}

export function getPendingSignupConversion(): string | null {
  return pendingConversionId;
}

export function consumeSignupConversion(id: string): void {
  if (pendingConversionId === id) pendingConversionId = null;
}
