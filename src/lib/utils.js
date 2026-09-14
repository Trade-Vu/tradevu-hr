import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

// Backend enums are often stored inconsistently (MALE, Male, male, PENDING_APPROVAL...).
// Always format through this instead of the CSS `capitalize` class, which only
// uppercases the first letter and leaves the rest of an already-uppercase string untouched.
export function toTitleCase(value) {
  if (!value) return '';
  return String(value)
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

export function extractErrorMessage(error, defaultMsg = "An unexpected error occurred.") {
  if (!error) return defaultMsg;
  
  // If it's a GraphQL response with a clean message
  if (error.response?.errors?.[0]?.message) {
    return error.response.errors[0].message;
  }
  
  if (typeof error.message === 'string') {
    // graphql-request appends the stringified response to the error message.
    // E.g., 'Cannot query field "employee" on type "Offboarding". {"response":...'
    const match = error.message.match(/^(.*?):\s*{"response":/);
    if (match && match[1]) return match[1].trim();
    
    const splitIndex = error.message.indexOf('{"response":');
    if (splitIndex > -1) {
      return error.message.substring(0, splitIndex).trim();
    }
    
    return error.message;
  }
  
  return defaultMsg;
}
