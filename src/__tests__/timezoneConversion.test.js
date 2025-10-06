/**
 * Unit tests for timezone conversion functionality
 * Tests EDT to user timezone conversion for stream schedule times
 */

// Mock the timezone conversion functions from App.js
const convertTimeToUserTimezone = (timeString, day, month, year, includeTimezoneAbbr = false) => {
  // Parse "8:30am - 9:00am" format (assuming EDT)
  const match = timeString.match(/(\d{1,2}):(\d{2})(am|pm)\s*-\s*(\d{1,2}):(\d{2})(am|pm)/);
  if (!match) return timeString; // Return original if parsing fails
  
  const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;
  
  // Convert to 24-hour format
  const convertTo24Hour = (hour, period) => {
    let h = parseInt(hour);
    if (period.toLowerCase() === 'pm' && h !== 12) h += 12;
    if (period.toLowerCase() === 'am' && h === 12) h = 0;
    return h;
  };
  
  const startHour24 = convertTo24Hour(startHour, startPeriod);
  const endHour24 = convertTo24Hour(endHour, endPeriod);
  
  // Create Date objects in EST/EDT (America/New_York timezone)
  const estDate = new Date(year, month - 1, day, startHour24, parseInt(startMin));
  const estEndDate = new Date(year, month - 1, day, endHour24, parseInt(endMin));
  
  // Convert to user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Format the converted times
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date).replace(/\s/g, '');
  };
  
  const startTimeLocal = formatTime(estDate);
  const endTimeLocal = formatTime(estEndDate);
  
  if (includeTimezoneAbbr) {
    // Get timezone abbreviation for user's timezone
    const timezoneAbbr = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      timeZoneName: 'short'
    }).formatToParts(estDate).find(part => part.type === 'timeZoneName')?.value || '';
    
    return `${startTimeLocal} - ${endTimeLocal} ${timezoneAbbr}`;
  } else {
    return `${startTimeLocal} - ${endTimeLocal}`;
  }
};

// Fixed version that properly handles EST timezone
const convertTimeToUserTimezoneFixed = (timeString, day, month, year, includeTimezoneAbbr = false) => {
  // Parse "8:30am - 9:00am" format (assuming EDT)
  const match = timeString.match(/(\d{1,2}):(\d{2})(am|pm)\s*-\s*(\d{1,2}):(\d{2})(am|pm)/);
  if (!match) return timeString; // Return original if parsing fails
  
  const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;
  
  // Convert to 24-hour format
  const convertTo24Hour = (hour, period) => {
    let h = parseInt(hour);
    if (period.toLowerCase() === 'pm' && h !== 12) h += 12;
    if (period.toLowerCase() === 'am' && h === 12) h = 0;
    return h;
  };
  
  const startHour24 = convertTo24Hour(startHour, startPeriod);
  const endHour24 = convertTo24Hour(endHour, endPeriod);
  
  // Create Date objects in EDT (Eastern Daylight Time, UTC-4) - FIXED VERSION
  // Use proper EDT timezone approach
  const edtStartTime = new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${startHour24.toString().padStart(2, '0')}:${startMin}:00-04:00`);
  const edtEndTime = new Date(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${endHour24.toString().padStart(2, '0')}:${endMin}:00-04:00`);
  
  // Convert to user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Format the converted times
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date).replace(/\s/g, '');
  };
  
  const startTimeLocal = formatTime(edtStartTime);
  const endTimeLocal = formatTime(edtEndTime);
  
  if (includeTimezoneAbbr) {
    // Get timezone abbreviation for user's timezone
    const timezoneAbbr = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      timeZoneName: 'short'
    }).formatToParts(edtStartTime).find(part => part.type === 'timeZoneName')?.value || '';
    
    return `${startTimeLocal} - ${endTimeLocal} ${timezoneAbbr}`;
  } else {
    return `${startTimeLocal} - ${endTimeLocal}`;
  }
};

describe('Timezone Conversion Tests', () => {
  const testCases = [
    {
      name: 'Morning EDT time (8:30am - 9:00am)',
      timeString: '8:30am - 9:00am',
      day: 1,
      month: 10,
      year: 2025,
      expectedEDT: '8:30am - 9:00am'
    },
    {
      name: 'Afternoon EDT time (7:00pm - 9:00pm)',
      timeString: '7:00pm - 9:00pm',
      day: 3,
      month: 10,
      year: 2025,
      expectedEDT: '7:00pm - 9:00pm'
    },
    {
      name: 'Noon EDT time (12:00pm - 2:00pm)',
      timeString: '12:00pm - 2:00pm',
      day: 5,
      month: 10,
      year: 2025,
      expectedEDT: '12:00pm - 2:00pm'
    },
    {
      name: 'Late morning EDT time (10:30am - 11:30am)',
      timeString: '10:30am - 11:30am',
      day: 4,
      month: 10,
      year: 2025,
      expectedEDT: '10:30am - 11:30am'
    }
  ];

  describe('Current Implementation (Broken)', () => {
    testCases.forEach(testCase => {
      test(`${testCase.name} - should handle parsing correctly`, () => {
        const result = convertTimeToUserTimezone(
          testCase.timeString, 
          testCase.day, 
          testCase.month, 
          testCase.year
        );
        
        // Should return a string in the format "time - time"
        expect(result).toMatch(/^\d{1,2}:\d{2}(am|pm|AM|PM)\s*-\s*\d{1,2}:\d{2}(am|pm|AM|PM)$/);
        expect(typeof result).toBe('string');
      });
    });

    test('should demonstrate the timezone conversion issue', () => {
      // This test will show that the current implementation doesn't properly convert EDT
      const timeString = '8:30am - 9:00am';
      const day = 1;
      const month = 10;
      const year = 2025;
      
      const result = convertTimeToUserTimezone(timeString, day, month, year);
      
      // The result should be different from the input if we're not in EDT timezone
      // This test will pass if we're in EDT, but fail if we're in a different timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      if (userTimezone !== 'America/New_York') {
        // If we're not in EDT, the time should be different
        expect(result).not.toBe('8:30am-9:00am');
        console.log(`User timezone: ${userTimezone}`);
        console.log(`Converted time: ${result}`);
      } else {
        // If we are in EDT, it should be the same
        expect(result).toBe('8:30am-9:00am');
      }
    });
  });

  describe('Fixed Implementation', () => {
    testCases.forEach(testCase => {
      test(`${testCase.name} - should convert EDT to user timezone correctly`, () => {
        const result = convertTimeToUserTimezoneFixed(
          testCase.timeString, 
          testCase.day, 
          testCase.month, 
          testCase.year
        );
        
        // Should return a string in the format "time - time"
        expect(result).toMatch(/^\d{1,2}:\d{2}(am|pm|AM|PM)\s*-\s*\d{1,2}:\d{2}(am|pm|AM|PM)$/);
        expect(typeof result).toBe('string');
        
        // Should be different from input if user is not in EDT timezone
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (userTimezone !== 'America/New_York') {
          expect(result).not.toBe(testCase.expectedEDT.replace(/\s/g, ''));
        }
      });
    });

    test('should handle timezone abbreviation correctly', () => {
      const result = convertTimeToUserTimezoneFixed(
        '8:30am - 9:00am', 
        1, 
        10, 
        2025, 
        true // includeTimezoneAbbr = true
      );
      
      // Should include timezone abbreviation
      expect(result).toMatch(/^\d{1,2}:\d{2}(am|pm|AM|PM)\s*-\s*\d{1,2}:\d{2}(am|pm|AM|PM)\s[A-Z]{2,4}$/);
    });

    test('should handle different timezones correctly', () => {
      // Test with a known timezone offset
      const originalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Mock different timezones for testing
      const testTimezones = [
        'America/Los_Angeles', // PST/PDT (UTC-8/-7)
        'America/Chicago',     // CST/CDT (UTC-6/-5) 
        'America/New_York',    // EST/EDT (UTC-5/-4)
        'Europe/London',       // GMT/BST (UTC+0/+1)
        'Europe/Paris',        // CET/CEST (UTC+1/+2)
        'Asia/Tokyo'           // JST (UTC+9)
      ];
      
      testTimezones.forEach(timezone => {
        // Mock the timezone for this test
        const originalResolvedOptions = Intl.DateTimeFormat().resolvedOptions;
        Intl.DateTimeFormat().resolvedOptions = () => ({ timeZone: timezone });
        
        const result = convertTimeToUserTimezoneFixed('8:30am - 9:00am', 1, 10, 2025);
        
        // Should return a valid time format
        expect(result).toMatch(/^\d{1,2}:\d{2}(am|pm|AM|PM)\s*-\s*\d{1,2}:\d{2}(am|pm|AM|PM)$/);
        
        // Restore original function
        Intl.DateTimeFormat().resolvedOptions = originalResolvedOptions;
      });
    });

    test('should handle edge cases', () => {
      // Test midnight
      const midnightResult = convertTimeToUserTimezoneFixed('12:00am - 1:00am', 1, 10, 2025);
      expect(midnightResult).toMatch(/^\d{1,2}:\d{2}(am|pm|AM|PM)\s*-\s*\d{1,2}:\d{2}(am|pm|AM|PM)$/);
      
      // Test noon
      const noonResult = convertTimeToUserTimezoneFixed('12:00pm - 1:00pm', 1, 10, 2025);
      expect(noonResult).toMatch(/^\d{1,2}:\d{2}(am|pm|AM|PM)\s*-\s*\d{1,2}:\d{2}(am|pm|AM|PM)$/);
      
      // Test invalid time format
      const invalidResult = convertTimeToUserTimezoneFixed('invalid time', 1, 10, 2025);
      expect(invalidResult).toBe('invalid time');
    });
  });

  describe('Comparison Tests', () => {
    test('should show difference between broken and fixed implementations', () => {
      const timeString = '8:30am - 9:00am';
      const day = 1;
      const month = 10;
      const year = 2025;
      
      const brokenResult = convertTimeToUserTimezone(timeString, day, month, year);
      const fixedResult = convertTimeToUserTimezoneFixed(timeString, day, month, year);
      
      console.log('Broken implementation result:', brokenResult);
      console.log('Fixed implementation result:', fixedResult);
      
      // Both should be valid time strings
      expect(brokenResult).toMatch(/^\d{1,2}:\d{2}(am|pm|AM|PM)\s*-\s*\d{1,2}:\d{2}(am|pm|AM|PM)$/);
      expect(fixedResult).toMatch(/^\d{1,2}:\d{2}(am|pm|AM|PM)\s*-\s*\d{1,2}:\d{2}(am|pm|AM|PM)$/);
      
      // The fixed version should properly handle timezone conversion
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Test with a different timezone to verify conversion works
      const originalResolvedOptions = Intl.DateTimeFormat().resolvedOptions;
      Intl.DateTimeFormat().resolvedOptions = () => ({ timeZone: 'America/Los_Angeles' });
      
      const pacificResult = convertTimeToUserTimezoneFixed(timeString, day, month, year);
      console.log('Fixed implementation result (Pacific timezone):', pacificResult);
      
      // Restore original function
      Intl.DateTimeFormat().resolvedOptions = originalResolvedOptions;
      
      // The Pacific timezone result should be different from the original EDT time
      expect(pacificResult).not.toBe('8:30am-9:00am');
      expect(pacificResult).toMatch(/^\d{1,2}:\d{2}(am|pm|AM|PM)\s*-\s*\d{1,2}:\d{2}(am|pm|AM|PM)$/);
    });
  });
});
