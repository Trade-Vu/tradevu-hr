import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

// Mongoose refs (e.g. user.employeeId) come back as a plain id string from some
// endpoints and as a populated object ({ _id, fullName, ... }) from others
// (GET /auth/me populates it). Always unwrap through this before using it as an id,
// or it stringifies to "[object Object]" in a URL/query param.
export function getRefId(ref) {
  if (!ref) return undefined;
  if (typeof ref === 'string') return ref;
  return ref._id || ref.id || undefined;
}

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

/**
 * Truncates a message to a max length, ellipsizing the middle so both the
 * start (usually the meaningful part) and end stay visible. Used as a
 * last-resort safeguard for error text that might echo back a raw path,
 * token, or id rather than a clean human sentence.
 */
export function ellipsifyMiddle(text, maxLength = 120) {
  const str = String(text ?? '');
  if (str.length <= maxLength) return str;
  const keep = maxLength - 1; // reserve 1 char for the ellipsis
  const head = Math.ceil(keep * 0.6);
  const tail = keep - head;
  return `${str.slice(0, head)}…${str.slice(str.length - tail)}`;
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
