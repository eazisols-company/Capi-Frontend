/**
 * Helper function to calculate real deposit amount from display_deposit_amount and conversion_rate
 * Priority order:
 * 1. display_deposit_amount_for_purchase_event (if exists)
 * 2. Calculated from display_deposit_amount / conversion_rate (if both exist)
 * 3. Fallback to deposit_amount
 * 
 * @param submission - The submission object containing deposit amount fields
 * @returns The calculated or fallback deposit amount
 */
export function calculateRealDepositAmount(submission: any): number | string {
  // First priority: Check if display_deposit_amount_for_purchase_event exists
  if (submission.display_deposit_amount_for_purchase_event != null) {
    return submission.display_deposit_amount_for_purchase_event;
  }
  
  // Second priority: If we have display_deposit_amount and conversion_rate, calculate the real amount
  if (submission.display_deposit_amount != null && submission.conversion_rate != null && submission.conversion_rate > 0) {
    const realAmount = Number(submission.display_deposit_amount) / Number(submission.conversion_rate);
    // Round to 2 decimal places for display
    return Number(realAmount.toFixed(2));
  }
  
  // Fallback to deposit_amount
  return submission.deposit_amount ?? 0;
}

