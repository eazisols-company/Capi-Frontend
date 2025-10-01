import { format, formatDistanceToNow } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// List of timezones based on GMT offsets
export const TIMEZONES = [
  // GMT-12:00
  { value: 'Pacific/Baker_Island', label: 'International Date Line West', offset: '-12:00', abbreviation: 'IDLW' },
  
  // GMT-11:00
  { value: 'Pacific/Samoa', label: 'Samoa Standard Time', offset: '-11:00', abbreviation: 'SST' },
  
  // GMT-10:00
  { value: 'Pacific/Honolulu', label: 'Hawaii–Aleutian Standard Time', offset: '-10:00', abbreviation: 'HAST / HST' },
  
  // GMT-09:00
  { value: 'America/Anchorage', label: 'Alaska Standard Time', offset: '-09:00', abbreviation: 'AKST' },
  
  // GMT-08:00
  { value: 'America/Los_Angeles', label: 'Pacific Standard Time', offset: '-08:00', abbreviation: 'PST' },
  
  // GMT-07:00
  { value: 'America/Denver', label: 'Mountain Standard Time', offset: '-07:00', abbreviation: 'MST' },
  
  // GMT-06:00
  { value: 'America/Chicago', label: 'Central Standard Time', offset: '-06:00', abbreviation: 'CST' },
  
  // GMT-05:00
  { value: 'America/New_York', label: 'Eastern Standard Time', offset: '-05:00', abbreviation: 'EST' },
  
  // GMT-04:00
  { value: 'America/Halifax', label: 'Atlantic Standard Time', offset: '-04:00', abbreviation: 'AST' },
  
  // GMT-03:30
  { value: 'America/St_Johns', label: 'Newfoundland Standard Time', offset: '-03:30', abbreviation: 'NST' },
  
  // GMT-03:00
  { value: 'America/Sao_Paulo', label: 'Argentina Time / Brasília Standard Time', offset: '-03:00', abbreviation: 'ART / BRT' },
  
  // GMT-02:00
  { value: 'Atlantic/South_Georgia', label: 'South Georgia Time', offset: '-02:00', abbreviation: 'GST' },
  
  // GMT-01:00
  { value: 'Atlantic/Azores', label: 'Azores Standard Time / Cape Verde Time', offset: '-01:00', abbreviation: 'AZOT / CVT' },
  
  // GMT±00:00
  { value: 'UTC', label: 'Greenwich Mean Time / Western European Time', offset: '+00:00', abbreviation: 'GMT / WET' },
  
  // GMT+01:00
  { value: 'Europe/Berlin', label: 'Central European Time / West Africa Time', offset: '+01:00', abbreviation: 'CET / WAT' },
  
  // GMT+02:00
  { value: 'Europe/Athens', label: 'Eastern European Time / Central Africa Time', offset: '+02:00', abbreviation: 'EET / CAT' },
  
  // GMT+03:00
  { value: 'Europe/Moscow', label: 'Moscow Standard Time / East Africa Time / Arabia Standard Time', offset: '+03:00', abbreviation: 'MSK / EAT / AST' },
  
  // GMT+03:30
  { value: 'Asia/Tehran', label: 'Iran Standard Time', offset: '+03:30', abbreviation: 'IRST' },
  
  // GMT+04:00
  { value: 'Asia/Dubai', label: 'Gulf Standard Time / Samara Time', offset: '+04:00', abbreviation: 'GST / SAMT' },
  
  // GMT+04:30
  { value: 'Asia/Kabul', label: 'Afghanistan Time', offset: '+04:30', abbreviation: 'AFT' },
  
  // GMT+05:00
  { value: 'Asia/Karachi', label: 'Pakistan Standard Time / Yekaterinburg Time', offset: '+05:00', abbreviation: 'PKT / YEKT' },
  
  // GMT+05:30
  { value: 'Asia/Kolkata', label: 'India Standard Time / Sri Lanka Time', offset: '+05:30', abbreviation: 'IST / SLST' },
  
  // GMT+05:45
  { value: 'Asia/Kathmandu', label: 'Nepal Time', offset: '+05:45', abbreviation: 'NPT' },
  
  // GMT+06:00
  { value: 'Asia/Dhaka', label: 'Bangladesh Standard Time / Bhutan Time / Omsk Time', offset: '+06:00', abbreviation: 'BST / BTT / OMST' },
  
  // GMT+06:30
  { value: 'Asia/Yangon', label: 'Myanmar Time / Cocos Islands Time', offset: '+06:30', abbreviation: 'MMT / CCT' },
  
  // GMT+07:00
  { value: 'Asia/Bangkok', label: 'Indochina Time / Krasnoyarsk Time', offset: '+07:00', abbreviation: 'ICT / KRAT' },
  
  // GMT+08:00
  { value: 'Asia/Shanghai', label: 'China Standard Time / Australian Western Standard Time / Singapore Time', offset: '+08:00', abbreviation: 'CST / AWST / SGT' },
  
  // GMT+08:45
  { value: 'Australia/Eucla', label: 'Australian Central Western Standard Time', offset: '+08:45', abbreviation: 'ACWST' },
  
  // GMT+09:00
  { value: 'Asia/Tokyo', label: 'Japan Standard Time / Korea Standard Time / Irkutsk Time', offset: '+09:00', abbreviation: 'JST / KST / IRKT' },
  
  // GMT+09:30
  { value: 'Australia/Adelaide', label: 'Australian Central Standard Time', offset: '+09:30', abbreviation: 'ACST' },
  
  // GMT+10:00
  { value: 'Australia/Sydney', label: 'Australian Eastern Standard Time / Vladivostok Time', offset: '+10:00', abbreviation: 'AEST / VLAT' },
  
  // GMT+10:30
  { value: 'Australia/Lord_Howe', label: 'Lord Howe Standard Time', offset: '+10:30', abbreviation: 'LHST' },
  
  // GMT+11:00
  { value: 'Pacific/Guadalcanal', label: 'Solomon Islands Time / Srednekolymsk Time', offset: '+11:00', abbreviation: 'SBT / SRET' },
  
  // GMT+12:00
  { value: 'Pacific/Auckland', label: 'New Zealand Standard Time / Fiji Time', offset: '+12:00', abbreviation: 'NZST / FJT' },
  
  // GMT+12:45
  { value: 'Pacific/Chatham', label: 'Chatham Standard Time', offset: '+12:45', abbreviation: 'CHAST' },
  
  // GMT+13:00
  { value: 'Pacific/Tongatapu', label: 'Tonga Time / Phoenix Islands Time', offset: '+13:00', abbreviation: 'TOT / PHOT' },
  
  // GMT+14:00
  { value: 'Pacific/Kiritimati', label: 'Line Islands Time', offset: '+14:00', abbreviation: 'LINT' },
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

// Get timezone display name with offset
export const getTimezoneDisplayWithOffset = (timezone: string): string => {
  const timezoneInfo = TIMEZONES.find(tz => tz.value === timezone);
  if (!timezoneInfo) return timezone;
  
  // Convert offset to GMT format
  const formatOffset = (offset: string): string => {
    if (offset.includes('/')) {
      // Handle DST offsets like '-05:00/-04:00'
      const [std, dst] = offset.split('/');
      return `GMT ${std.includes('+') ? std : std.replace('-', '-')} / GMT ${dst.includes('+') ? dst : dst.replace('-', '-')}`;
    } else {
      // Handle single offset like '+05:30' or '-03:00'
      const formatted = offset.includes('+') ? offset : offset.replace('-', '-');
      return `GMT ${formatted}`;
    }
  };
  
  // Include abbreviation if available
  const abbreviation = timezoneInfo.abbreviation ? ` (${timezoneInfo.abbreviation})` : '';
  return `${timezoneInfo.label}${abbreviation} (${formatOffset(timezoneInfo.offset)})`;
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
