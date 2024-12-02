export const REDIRECT_REASONS = {
    EDIT_POST: 'EDIT_POST',
    // Add other redirect reasons as needed
} as const;

export type RedirectReason = keyof typeof REDIRECT_REASONS;
