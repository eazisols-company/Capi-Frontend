import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a meaningful error message from an API error response
 * @param error - The error object from the API call
 * @param fallbackMessage - Default message if no specific error is found
 * @returns A user-friendly error message
 */
export function extractApiErrorMessage(error: any, fallbackMessage: string = "An error occurred"): string {
  // Extract the actual error message from the API response
  if (error.response?.data?.details) {
    const details = error.response.data.details;
    
    // Handle validation errors with nested field details (e.g., {field: {message}})
    if (typeof details === 'object' && !Array.isArray(details)) {
      const messages: string[] = [];
      Object.entries(details).forEach(([field, fieldErrors]: [string, any]) => {
        if (typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
          // Handle nested error objects like {field: {"Not a valid URL.": true}}
          Object.keys(fieldErrors).forEach(message => {
            messages.push(`${field}: ${message}`);
          });
        } else if (Array.isArray(fieldErrors)) {
          // Handle array of error messages
          fieldErrors.forEach(msg => messages.push(`${field}: ${msg}`));
        } else if (typeof fieldErrors === 'string') {
          // Handle simple string errors
          messages.push(`${field}: ${fieldErrors}`);
        }
      });
      if (messages.length > 0) {
        return messages.join(', ');
      }
    } else if (Array.isArray(details) && details.length > 0) {
      // Handle array of details
      return details.map((detail: any) => detail.message || detail).join(', ');
    } else if (typeof details === 'string') {
      // Handle string details
      return details;
    }
  } else if (error.response?.data?.message) {
    // Handle general error messages
    return error.response.data.message;
  } else if (error.response?.data?.error) {
    // Handle error field
    return error.response.data.error;
  } else if (error.message) {
    // Fallback to axios error message
    return error.message;
  }
  
  return fallbackMessage;
}

/**
 * Converts currency code to symbol
 * @param currency - The currency code (EUR, USD)
 * @returns The corresponding currency symbol
 */
export function getCurrencySymbol(currency?: string): string {
  switch (currency) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    default:
      return '€'; // Default to EUR
  }
}