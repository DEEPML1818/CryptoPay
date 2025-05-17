import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';

/**
 * Format a date string or Date object to a readable format
 * @param date - Date string or Date object
 * @param formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date | null | undefined, formatStr = 'MMM dd, yyyy'): string {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }
  
  if (!isValid(dateObj)) {
    return '';
  }
  
  return format(dateObj, formatStr);
}

/**
 * Format a date as a relative time (e.g., "2 hours ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }
  
  if (!isValid(dateObj)) {
    return '';
  }
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Check if a date is in the past
 * @param date - Date string or Date object
 * @returns True if the date is in the past
 */
export function isDatePast(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }
  
  if (!isValid(dateObj)) {
    return false;
  }
  
  return dateObj < new Date();
}

/**
 * Format date for HTML date input (YYYY-MM-DD)
 * @param date - Date object or string 
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else {
    dateObj = date;
  }
  
  if (!isValid(dateObj)) {
    return '';
  }
  
  return format(dateObj, 'yyyy-MM-dd');
}
