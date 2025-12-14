/**
 * Format date and time utilities with correct timezone (Vietnam UTC+7)
 */

/**
 * Get current date/time in Vietnam timezone
 * @returns {Date} Date object representing current time in Vietnam
 */
export const getVietnamTime = () => {
  return new Date();
};

/**
 * Get date components in Vietnam timezone
 * @param {Date} date - Date object
 * @returns {Object} { year, month, day, hours, minutes, seconds }
 */
const getVietnamDateComponents = (date) => {
  if (!date || isNaN(date.getTime())) return null;
  
  // Use Intl.DateTimeFormat to get components in Vietnam timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const partsMap = {};
  parts.forEach(part => {
    partsMap[part.type] = part.value;
  });
  
  return {
    year: parseInt(partsMap.year),
    month: parseInt(partsMap.month) - 1, // JavaScript months are 0-indexed
    day: parseInt(partsMap.day),
    hours: parseInt(partsMap.hour),
    minutes: parseInt(partsMap.minute),
    seconds: parseInt(partsMap.second)
  };
};

/**
 * Parse date string to Date object and get Vietnam timezone components
 * Backend returns date strings in format "yyyy-MM-dd'T'HH:mm:ss" (assumed to be in server timezone or UTC)
 * We need to interpret it correctly and convert to Vietnam timezone for display
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {Object|null} Date components in Vietnam timezone
 */
const parseToVietnamTime = (dateString) => {
  if (!dateString) return null;
  
  let date;
  if (dateString instanceof Date) {
    date = dateString;
  } else if (typeof dateString === 'string') {
    // Backend returns "yyyy-MM-dd'T'HH:mm:ss" format (no timezone)
    // Check if it has timezone info
    const hasTimezone = dateString.includes('Z') || 
                        dateString.match(/[+-]\d{2}:?\d{2}$/) || 
                        dateString.match(/[+-]\d{4}$/);
    
    if (!hasTimezone && dateString.includes('T')) {
      // No timezone info, assume it's UTC (backend likely stores as UTC)
      // Add 'Z' to indicate UTC
      date = new Date(dateString + 'Z');
    } else {
      // Has timezone info, parse normally
      date = new Date(dateString);
    }
  } else {
    return null;
  }
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return getVietnamDateComponents(date);
};

/**
 * Format date for display (Vietnam timezone)
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string (e.g., "Hôm nay, 14:30" or "15/12, 14:30")
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const dateComponents = parseToVietnamTime(dateString);
  if (!dateComponents) return '';
  
  // Get current date in Vietnam timezone
  const nowComponents = getVietnamDateComponents(new Date());
  if (!nowComponents) return '';
  
  const now = new Date(nowComponents.year, nowComponents.month, nowComponents.day);
  const bookingDate = new Date(dateComponents.year, dateComponents.month, dateComponents.day);
  
  const hours = dateComponents.hours.toString().padStart(2, '0');
  const minutes = dateComponents.minutes.toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  if (bookingDate.getTime() === now.getTime()) {
    return `Hôm nay, ${timeStr}`;
  } else {
    const day = dateComponents.day.toString().padStart(2, '0');
    const month = (dateComponents.month + 1).toString().padStart(2, '0');
    const year = dateComponents.year;
    const currentYear = nowComponents.year;
    
    if (year === currentYear) {
      return `${day}/${month}, ${timeStr}`;
    } else {
      return `${day}/${month}/${year}, ${timeStr}`;
    }
  }
};

/**
 * Format date with yesterday support
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string
 */
export const formatDateWithYesterday = (dateString) => {
  if (!dateString) return '';
  
  const dateComponents = parseToVietnamTime(dateString);
  if (!dateComponents) return '';
  
  // Get current date in Vietnam timezone
  const nowComponents = getVietnamDateComponents(new Date());
  if (!nowComponents) return '';
  
  const now = new Date(nowComponents.year, nowComponents.month, nowComponents.day);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const bookingDate = new Date(dateComponents.year, dateComponents.month, dateComponents.day);
  
  const hours = dateComponents.hours.toString().padStart(2, '0');
  const minutes = dateComponents.minutes.toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  if (bookingDate.getTime() === now.getTime()) {
    return `Hôm nay, ${timeStr}`;
  } else if (bookingDate.getTime() === yesterday.getTime()) {
    return `Hôm qua, ${timeStr}`;
  } else {
    const day = dateComponents.day.toString().padStart(2, '0');
    const month = (dateComponents.month + 1).toString().padStart(2, '0');
    const year = dateComponents.year;
    const currentYear = nowComponents.year;
    
    if (year === currentYear) {
      return `${day}/${month}, ${timeStr}`;
    } else {
      return `${day}/${month}/${year}, ${timeStr}`;
    }
  }
};

/**
 * Format date to locale date string (Vietnam)
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date (e.g., "15/12/2024")
 */
export const formatDateOnly = (dateString) => {
  if (!dateString) return '';
  
  const dateComponents = parseToVietnamTime(dateString);
  if (!dateComponents) return '';
  
  const day = dateComponents.day.toString().padStart(2, '0');
  const month = (dateComponents.month + 1).toString().padStart(2, '0');
  const year = dateComponents.year;
  
  return `${day}/${month}/${year}`;
};

/**
 * Format time only (Vietnam timezone)
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted time (e.g., "14:30")
 */
export const formatTimeOnly = (dateString) => {
  if (!dateString) return '';
  
  const dateComponents = parseToVietnamTime(dateString);
  if (!dateComponents) return '';
  
  const hours = dateComponents.hours.toString().padStart(2, '0');
  const minutes = dateComponents.minutes.toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

