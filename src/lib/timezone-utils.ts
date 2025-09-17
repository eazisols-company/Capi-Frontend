import { format, formatDistanceToNow } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// List of common timezones for selection
export const TIMEZONES = [
  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (New York)', offset: '-05:00/-04:00' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)', offset: '-06:00/-05:00' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)', offset: '-07:00/-06:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)', offset: '-08:00/-07:00' },
  { value: 'America/Toronto', label: 'Eastern Time (Toronto)', offset: '-05:00/-04:00' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)', offset: '-08:00/-07:00' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (São Paulo)', offset: '-03:00' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina Time (Buenos Aires)', offset: '-03:00' },
  { value: 'America/Mexico_City', label: 'Central Time (Mexico City)', offset: '-06:00' },
  
  // Europe
  { value: 'Europe/London', label: 'Greenwich Mean Time (London)', offset: '+00:00/+01:00' },
  { value: 'Europe/Berlin', label: 'Central European Time (Berlin)', offset: '+01:00/+02:00' },
  { value: 'Europe/Paris', label: 'Central European Time (Paris)', offset: '+01:00/+02:00' },
  { value: 'Europe/Rome', label: 'Central European Time (Rome)', offset: '+01:00/+02:00' },
  { value: 'Europe/Madrid', label: 'Central European Time (Madrid)', offset: '+01:00/+02:00' },
  { value: 'Europe/Amsterdam', label: 'Central European Time (Amsterdam)', offset: '+01:00/+02:00' },
  { value: 'Europe/Zurich', label: 'Central European Time (Zurich)', offset: '+01:00/+02:00' },
  { value: 'Europe/Vienna', label: 'Central European Time (Vienna)', offset: '+01:00/+02:00' },
  { value: 'Europe/Stockholm', label: 'Central European Time (Stockholm)', offset: '+01:00/+02:00' },
  { value: 'Europe/Oslo', label: 'Central European Time (Oslo)', offset: '+01:00/+02:00' },
  { value: 'Europe/Copenhagen', label: 'Central European Time (Copenhagen)', offset: '+01:00/+02:00' },
  { value: 'Europe/Helsinki', label: 'Eastern European Time (Helsinki)', offset: '+02:00/+03:00' },
  { value: 'Europe/Warsaw', label: 'Central European Time (Warsaw)', offset: '+01:00/+02:00' },
  { value: 'Europe/Moscow', label: 'Moscow Standard Time', offset: '+03:00' },
  { value: 'Europe/Istanbul', label: 'Turkey Time (Istanbul)', offset: '+03:00' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai)', offset: '+04:00' },
  { value: 'Asia/Riyadh', label: 'Arabia Standard Time (Riyadh)', offset: '+03:00' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (Mumbai)', offset: '+05:30' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (Shanghai)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)', offset: '+09:00' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (Seoul)', offset: '+09:00' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Standard Time', offset: '+08:00' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (Bangkok)', offset: '+07:00' },
  { value: 'Asia/Jakarta', label: 'Western Indonesia Time (Jakarta)', offset: '+07:00' },
  
  // Australia & Oceania
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney)', offset: '+10:00/+11:00' },
  { value: 'Australia/Melbourne', label: 'Australian Eastern Time (Melbourne)', offset: '+10:00/+11:00' },
  { value: 'Australia/Perth', label: 'Australian Western Time (Perth)', offset: '+08:00' },
  { value: 'Pacific/Auckland', label: 'New Zealand Standard Time (Auckland)', offset: '+12:00/+13:00' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Eastern European Time (Cairo)', offset: '+02:00' },
  { value: 'Africa/Johannesburg', label: 'South Africa Standard Time', offset: '+02:00' },
  { value: 'Africa/Lagos', label: 'West Africa Time (Lagos)', offset: '+01:00' },
  { value: 'Africa/Casablanca', label: 'Western European Time (Casablanca)', offset: '+00:00/+01:00' },
];

// Get user's detected timezone
export const getDetectedTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect timezone, defaulting to UTC');
    return 'UTC';
  }
};

// Format date in user's timezone
export const formatDateInTimezone = (
  date: string | Date,
  userTimezone: string = 'UTC',
  formatString: string = 'MMM dd, yyyy HH:mm'
): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    const zonedDate = toZonedTime(dateObj, userTimezone);
    return format(zonedDate, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Format date for table display (short format)
export const formatDateForTable = (
  date: string | Date,
  userTimezone: string = 'UTC'
): string => {
  return formatDateInTimezone(date, userTimezone, 'MM/dd/yyyy HH:mm');
};

// Format date for detailed display (long format)
export const formatDateDetailed = (
  date: string | Date,
  userTimezone: string = 'UTC'
): string => {
  return formatDateInTimezone(date, userTimezone, 'MMM dd, yyyy \'at\' HH:mm:ss');
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (
  date: string | Date,
  userTimezone: string = 'UTC'
): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    const zonedDate = toZonedTime(dateObj, userTimezone);
    return formatDistanceToNow(zonedDate, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
};

// Format date for CSV export
export const formatDateForExport = (
  date: string | Date,
  userTimezone: string = 'UTC'
): string => {
  return formatDateInTimezone(date, userTimezone, 'yyyy-MM-dd HH:mm:ss');
};

// Get timezone display name
export const getTimezoneDisplayName = (timezone: string): string => {
  const timezoneInfo = TIMEZONES.find(tz => tz.value === timezone);
  return timezoneInfo ? timezoneInfo.label : timezone;
};

// Convert UTC date to user timezone for display
export const convertToUserTimezone = (
  utcDate: string | Date,
  userTimezone: string = 'UTC'
): Date => {
  try {
    const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    return toZonedTime(dateObj, userTimezone);
  } catch (error) {
    console.error('Error converting to user timezone:', error);
    return new Date();
  }
};

// Check if timezone is valid
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};

// Get current time in user's timezone
export const getCurrentTimeInTimezone = (userTimezone: string = 'UTC'): Date => {
  return toZonedTime(new Date(), userTimezone);
};
