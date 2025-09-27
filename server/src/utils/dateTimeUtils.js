/**
 * Healthcare System - Date & Time Utilities
 * 
 * Comprehensive date and time operations for healthcare applications including
 * appointment scheduling, age calculations, medical timelines, and timezone handling.
 * 
 * Features:
 * - Patient age calculations with precision
 * - Appointment scheduling and availability
 * - Medical date formatting for records
 * - Timezone handling for multi-location healthcare
 * - Business hours and availability checks
 * - Medical timeline calculations
 * - Prescription expiry tracking
 */

/**
 * Date/Time Configuration for Healthcare System
 */
const DATETIME_CONFIG = {
    // Business hours configuration
    DEFAULT_BUSINESS_HOURS: {
        start: 9, // 9 AM
        end: 17,  // 5 PM
        timezone: 'America/New_York'
    },
    
    // Appointment settings
    APPOINTMENT_SETTINGS: {
        DEFAULT_DURATION: 30, // minutes
        MIN_ADVANCE_BOOKING: 30, // minutes
        MAX_ADVANCE_BOOKING: 365, // days
        REMINDER_TIMES: [24, 2], // hours before appointment
        SLOT_INTERVALS: [15, 30, 45, 60] // available slot intervals in minutes
    },
    
    // Medical timeline settings
    MEDICAL_TIMELINE: {
        RECENT_PERIOD_DAYS: 30,
        CHRONIC_CONDITION_MONTHS: 6,
        LONG_TERM_YEARS: 2
    },
    
    // Date formats for different healthcare contexts
    DATE_FORMATS: {
        MEDICAL_RECORD: 'MMMM dd, yyyy \'at\' h:mm a',
        APPOINTMENT: 'EEEE, MMMM dd, yyyy \'at\' h:mm a',
        PRESCRIPTION: 'MMM dd, yyyy',
        REPORT: 'yyyy-MM-dd HH:mm:ss',
        DISPLAY: 'MMM dd, yyyy',
        API: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    }
};

/**
 * Calculate precise patient age from date of birth
 * 
 * @param {string|Date} dateOfBirth - Patient's date of birth
 * @param {string|Date} referenceDate - Reference date (default: today)
 * @returns {Object} - Age calculation result
 */
export const calculateAge = (dateOfBirth, referenceDate = new Date()) => {
    try {
        const birth = new Date(dateOfBirth);
        const reference = new Date(referenceDate);
        
        if (isNaN(birth.getTime()) || isNaN(reference.getTime())) {
            throw new Error('Invalid date provided');
        }
        
        if (birth > reference) {
            throw new Error('Date of birth cannot be in the future');
        }
        
        let years = reference.getFullYear() - birth.getFullYear();
        let months = reference.getMonth() - birth.getMonth();
        let days = reference.getDate() - birth.getDate();
        
        // Adjust for negative days
        if (days < 0) {
            months--;
            const lastDayOfPrevMonth = new Date(reference.getFullYear(), reference.getMonth(), 0).getDate();
            days += lastDayOfPrevMonth;
        }
        
        // Adjust for negative months
        if (months < 0) {
            years--;
            months += 12;
        }
        
        // Calculate total days lived
        const totalDays = Math.floor((reference - birth) / (1000 * 60 * 60 * 24));
        
        // Age category for medical purposes
        let ageCategory;
        if (years < 1) ageCategory = 'infant';
        else if (years < 3) ageCategory = 'toddler';
        else if (years < 13) ageCategory = 'child';
        else if (years < 18) ageCategory = 'adolescent';
        else if (years < 65) ageCategory = 'adult';
        else ageCategory = 'senior';
        
        return {
            years,
            months,
            days,
            totalDays,
            ageCategory,
            displayAge: years >= 2 ? `${years} years` : years === 1 ? `${years} year, ${months} months` : `${months} months`,
            isMinor: years < 18,
            isSenior: years >= 65,
            nextBirthday: getNextBirthday(birth, reference)
        };
        
    } catch (error) {
        throw new Error(`Age calculation failed: ${error.message}`);
    }
};

/**
 * Get next birthday date
 * 
 * @param {Date} birthDate - Date of birth
 * @param {Date} referenceDate - Reference date
 * @returns {Date} - Next birthday date
 */
const getNextBirthday = (birthDate, referenceDate) => {
    const nextBirthday = new Date(
        referenceDate.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
    );
    
    if (nextBirthday <= referenceDate) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }
    
    return nextBirthday;
};

/**
 * Format date for medical records with context-appropriate formatting
 * 
 * @param {string|Date} date - Date to format
 * @param {string} context - Context for formatting (medical-record, appointment, prescription, etc.)
 * @param {string} timezone - Timezone for formatting
 * @returns {string} - Formatted date string
 */
export const formatMedicalDate = (date, context = 'medical-record', timezone = 'UTC') => {
    try {
        const dateObj = new Date(date);
        
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date provided');
        }
        
        const format = DATETIME_CONFIG.DATE_FORMATS[context.toUpperCase()] || DATETIME_CONFIG.DATE_FORMATS.MEDICAL_RECORD;
        
        // Create formatter based on context and timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            ...getFormatOptions(context)
        });
        
        return formatter.format(dateObj);
        
    } catch (error) {
        throw new Error(`Date formatting failed: ${error.message}`);
    }
};

/**
 * Get format options based on context
 * 
 * @param {string} context - Formatting context
 * @returns {Object} - Format options
 */
const getFormatOptions = (context) => {
    const options = {};
    
    switch (context) {
        case 'medical-record':
            options.year = 'numeric';
            options.month = 'long';
            options.day = 'numeric';
            options.hour = 'numeric';
            options.minute = 'numeric';
            options.hour12 = true;
            break;
            
        case 'appointment':
            options.weekday = 'long';
            options.year = 'numeric';
            options.month = 'long';
            options.day = 'numeric';
            options.hour = 'numeric';
            options.minute = 'numeric';
            options.hour12 = true;
            break;
            
        case 'prescription':
            options.year = 'numeric';
            options.month = 'short';
            options.day = 'numeric';
            break;
            
        case 'report':
            options.year = 'numeric';
            options.month = '2-digit';
            options.day = '2-digit';
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.second = '2-digit';
            break;
            
        case 'display':
            options.year = 'numeric';
            options.month = 'short';
            options.day = 'numeric';
            break;
            
        default:
            options.year = 'numeric';
            options.month = 'long';
            options.day = 'numeric';
            options.hour = 'numeric';
            options.minute = 'numeric';
            options.hour12 = true;
    }
    
    return options;
};

/**
 * Generate available appointment slots for a given date range
 * 
 * @param {Date} startDate - Start date for slot generation
 * @param {Date} endDate - End date for slot generation
 * @param {Object} scheduleConfig - Schedule configuration
 * @returns {Array} - Array of available appointment slots
 */
export const generateAppointmentSlots = (startDate, endDate, scheduleConfig = {}) => {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid date range provided');
        }
        
        if (start >= end) {
            throw new Error('Start date must be before end date');
        }
        
        const config = {
            slotDuration: scheduleConfig.slotDuration || DATETIME_CONFIG.APPOINTMENT_SETTINGS.DEFAULT_DURATION,
            businessHours: scheduleConfig.businessHours || DATETIME_CONFIG.DEFAULT_BUSINESS_HOURS,
            excludeWeekends: scheduleConfig.excludeWeekends !== false,
            excludedDates: scheduleConfig.excludedDates || [],
            timezone: scheduleConfig.timezone || 'UTC'
        };
        
        const slots = [];
        let currentDate = new Date(start);
        
        while (currentDate <= end) {
            // Skip weekends if configured
            if (config.excludeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }
            
            // Skip excluded dates
            const dateString = currentDate.toISOString().split('T')[0];
            if (config.excludedDates.includes(dateString)) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }
            
            // Generate slots for business hours
            const daySlots = generateSlotsForDay(currentDate, config);
            slots.push(...daySlots);
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return slots;
        
    } catch (error) {
        throw new Error(`Slot generation failed: ${error.message}`);
    }
};

/**
 * Generate appointment slots for a single day
 * 
 * @param {Date} date - Date to generate slots for
 * @param {Object} config - Configuration object
 * @returns {Array} - Array of slots for the day
 */
const generateSlotsForDay = (date, config) => {
    const slots = [];
    const startTime = new Date(date);
    startTime.setHours(config.businessHours.start, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(config.businessHours.end, 0, 0, 0);
    
    let currentSlot = new Date(startTime);
    
    while (currentSlot < endTime) {
        const slotEnd = new Date(currentSlot);
        slotEnd.setMinutes(slotEnd.getMinutes() + config.slotDuration);
        
        if (slotEnd <= endTime) {
            slots.push({
                start: new Date(currentSlot),
                end: new Date(slotEnd),
                duration: config.slotDuration,
                available: true
            });
        }
        
        currentSlot.setMinutes(currentSlot.getMinutes() + config.slotDuration);
    }
    
    return slots;
};

/**
 * Check if a given date/time is within business hours
 * 
 * @param {Date} dateTime - Date/time to check
 * @param {Object} businessHours - Business hours configuration
 * @returns {boolean} - True if within business hours
 */
export const isWithinBusinessHours = (dateTime, businessHours = DATETIME_CONFIG.DEFAULT_BUSINESS_HOURS) => {
    try {
        const checkDate = new Date(dateTime);
        
        if (isNaN(checkDate.getTime())) {
            throw new Error('Invalid date provided');
        }
        
        const hour = checkDate.getHours();
        const dayOfWeek = checkDate.getDay();
        
        // Check if weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return false;
        }
        
        // Check business hours
        return hour >= businessHours.start && hour < businessHours.end;
        
    } catch (error) {
        throw new Error(`Business hours check failed: ${error.message}`);
    }
};

/**
 * Calculate prescription expiry date
 * 
 * @param {Date} startDate - Prescription start date
 * @param {number} durationDays - Duration in days
 * @param {Object} options - Calculation options
 * @returns {Object} - Expiry information
 */
export const calculatePrescriptionExpiry = (startDate, durationDays, options = {}) => {
    try {
        const start = new Date(startDate);
        
        if (isNaN(start.getTime())) {
            throw new Error('Invalid start date provided');
        }
        
        if (durationDays <= 0) {
            throw new Error('Duration must be positive');
        }
        
        const expiryDate = new Date(start);
        expiryDate.setDate(expiryDate.getDate() + durationDays);
        
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        return {
            startDate: start,
            expiryDate,
            durationDays,
            daysUntilExpiry,
            isExpired: daysUntilExpiry < 0,
            isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 7,
            warningLevel: getExpiryWarningLevel(daysUntilExpiry)
        };
        
    } catch (error) {
        throw new Error(`Prescription expiry calculation failed: ${error.message}`);
    }
};

/**
 * Get expiry warning level based on days until expiry
 * 
 * @param {number} daysUntilExpiry - Days until expiry
 * @returns {string} - Warning level
 */
const getExpiryWarningLevel = (daysUntilExpiry) => {
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 3) return 'critical';
    if (daysUntilExpiry <= 7) return 'warning';
    if (daysUntilExpiry <= 30) return 'notice';
    return 'normal';
};

/**
 * Calculate medical timeline periods
 * 
 * @param {Date} referenceDate - Reference date for timeline
 * @returns {Object} - Timeline period dates
 */
export const getMedicalTimelinePeriods = (referenceDate = new Date()) => {
    try {
        const reference = new Date(referenceDate);
        
        if (isNaN(reference.getTime())) {
            throw new Error('Invalid reference date provided');
        }
        
        const recentPeriod = new Date(reference);
        recentPeriod.setDate(recentPeriod.getDate() - DATETIME_CONFIG.MEDICAL_TIMELINE.RECENT_PERIOD_DAYS);
        
        const chronicPeriod = new Date(reference);
        chronicPeriod.setMonth(chronicPeriod.getMonth() - DATETIME_CONFIG.MEDICAL_TIMELINE.CHRONIC_CONDITION_MONTHS);
        
        const longTermPeriod = new Date(reference);
        longTermPeriod.setFullYear(longTermPeriod.getFullYear() - DATETIME_CONFIG.MEDICAL_TIMELINE.LONG_TERM_YEARS);
        
        return {
            recent: {
                start: recentPeriod,
                end: reference,
                description: `Last ${DATETIME_CONFIG.MEDICAL_TIMELINE.RECENT_PERIOD_DAYS} days`
            },
            chronic: {
                start: chronicPeriod,
                end: reference,
                description: `Last ${DATETIME_CONFIG.MEDICAL_TIMELINE.CHRONIC_CONDITION_MONTHS} months`
            },
            longTerm: {
                start: longTermPeriod,
                end: reference,
                description: `Last ${DATETIME_CONFIG.MEDICAL_TIMELINE.LONG_TERM_YEARS} years`
            }
        };
        
    } catch (error) {
        throw new Error(`Timeline calculation failed: ${error.message}`);
    }
};

/**
 * Calculate appointment reminder times
 * 
 * @param {Date} appointmentDate - Appointment date/time
 * @param {Array} reminderHours - Array of hours before appointment for reminders
 * @returns {Array} - Array of reminder dates/times
 */
export const calculateAppointmentReminders = (appointmentDate, reminderHours = DATETIME_CONFIG.APPOINTMENT_SETTINGS.REMINDER_TIMES) => {
    try {
        const appointment = new Date(appointmentDate);
        
        if (isNaN(appointment.getTime())) {
            throw new Error('Invalid appointment date provided');
        }
        
        return reminderHours.map(hours => {
            const reminderTime = new Date(appointment);
            reminderTime.setHours(reminderTime.getHours() - hours);
            return {
                hoursBefore: hours,
                reminderTime,
                isPast: reminderTime < new Date()
            };
        });
        
    } catch (error) {
        throw new Error(`Reminder calculation failed: ${error.message}`);
    }
};

/**
 * Validate and normalize timezone
 * 
 * @param {string} timezone - Timezone to validate
 * @returns {string} - Normalized timezone or default
 */
export const validateTimezone = (timezone) => {
    try {
        if (!timezone) {
            return DATETIME_CONFIG.DEFAULT_BUSINESS_HOURS.timezone;
        }
        
        // Basic timezone validation
        const validTimezones = [
            'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
            'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney', 'UTC'
        ];
        
        if (validTimezones.includes(timezone)) {
            return timezone;
        }
        
        // Fallback to UTC if invalid
        console.warn(`Invalid timezone "${timezone}", falling back to UTC`);
        return 'UTC';
        
    } catch (error) {
        console.error('Timezone validation failed:', error);
        return 'UTC';
    }
};

/**
 * Get current medical quarter and period information
 * 
 * @param {Date} referenceDate - Reference date
 * @returns {Object} - Quarter information
 */
export const getMedicalQuarter = (referenceDate = new Date()) => {
    try {
        const date = new Date(referenceDate);
        
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date provided');
        }
        
        const quarter = Math.floor((date.getMonth() + 3) / 3);
        const quarterStart = new Date(date.getFullYear(), (quarter - 1) * 3, 1);
        const quarterEnd = new Date(date.getFullYear(), quarter * 3, 0);
        
        return {
            quarter,
            year: date.getFullYear(),
            start: quarterStart,
            end: quarterEnd,
            display: `Q${quarter} ${date.getFullYear()}`
        };
        
    } catch (error) {
        throw new Error(`Quarter calculation failed: ${error.message}`);
    }
};

/**
 * Calculate duration between two dates in medical-friendly format
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} - Duration information
 */
export const calculateMedicalDuration = (startDate, endDate = new Date()) => {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid dates provided');
        }
        
        if (start > end) {
            throw new Error('Start date cannot be after end date');
        }
        
        const diffMs = end - start;
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        let displayDuration;
        if (days > 365) {
            const years = Math.floor(days / 365);
            displayDuration = `${years} year${years > 1 ? 's' : ''}`;
        } else if (days > 30) {
            const months = Math.floor(days / 30);
            displayDuration = `${months} month${months > 1 ? 's' : ''}`;
        } else if (days > 0) {
            displayDuration = `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            displayDuration = `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            displayDuration = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        
        return {
            days,
            hours,
            minutes,
            totalMinutes: Math.floor(diffMs / (1000 * 60)),
            totalHours: Math.floor(diffMs / (1000 * 60 * 60)),
            totalDays: days,
            displayDuration,
            isRecent: days <= 7,
            isLongTerm: days > 365
        };
        
    } catch (error) {
        throw new Error(`Duration calculation failed: ${error.message}`);
    }
};

/**
 * Check if a date is a holiday (basic implementation)
 * 
 * @param {Date} date - Date to check
 * @param {string} country - Country code for holidays
 * @returns {boolean} - True if holiday
 */
export const isHoliday = (date, country = 'US') => {
    try {
        const checkDate = new Date(date);
        
        if (isNaN(checkDate.getTime())) {
            throw new Error('Invalid date provided');
        }
        
        // Basic US holiday check (simplified)
        const holidays = getHolidaysForCountry(country, checkDate.getFullYear());
        const dateString = checkDate.toISOString().split('T')[0];
        
        return holidays.includes(dateString);
        
    } catch (error) {
        console.error('Holiday check failed:', error);
        return false;
    }
};

/**
 * Get holidays for a specific country and year
 * 
 * @param {string} country - Country code
 * @param {number} year - Year
 * @returns {Array} - Array of holiday dates
 */
const getHolidaysForCountry = (country, year) => {
    // Simplified holiday list for US
    if (country === 'US') {
        return [
            `${year}-01-01`, // New Year's Day
            `${year}-07-04`, // Independence Day
            `${year}-12-25`, // Christmas Day
            // Add more holidays as needed
        ];
    }
    
    return [];
};

// Export configuration for external use
export { DATETIME_CONFIG };

/**
 * Usage Examples:
 * 
 * // Calculate patient age
 * const age = calculateAge('1990-05-15');
 * console.log(age.displayAge); // "34 years"
 * 
 * // Format medical date
 * const formatted = formatMedicalDate(new Date(), 'appointment', 'America/New_York');
 * 
 * // Generate appointment slots
 * const slots = generateAppointmentSlots(
 *     new Date('2024-03-01'),
 *     new Date('2024-03-07'),
 *     { slotDuration: 30, excludeWeekends: true }
 * );
 * 
 * // Calculate prescription expiry
 * const expiry = calculatePrescriptionExpiry(new Date(), 30);
 * console.log(expiry.daysUntilExpiry);
 * 
 * // Get medical timeline
 * const timeline = getMedicalTimelinePeriods();
 * 
 * // Calculate appointment reminders
 * const reminders = calculateAppointmentReminders(new Date('2024-03-15T14:30:00'));
 */