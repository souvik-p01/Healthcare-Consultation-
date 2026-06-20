/**
 * Healthcare Consultation System - Google Meet Utility
 * 
 * Generates randomized Google Meet room codes following standard formats.
 */

/**
 * Generate a randomized Google Meet URL
 * Format: https://meet.google.com/abc-defg-hij
 * 
 * @returns {string} - Google Meet URL
 */
export const generateGoogleMeetLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    
    // Generate parts of the meet code: 3-4-3 chars
    const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    return `https://meet.google.com/${part1}-${part2}-${part3}`;
};
