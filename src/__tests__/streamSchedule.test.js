const fs = require('fs');
const path = require('path');

describe('Stream Schedule JSON Validation', () => {
  let streamSchedule;

  beforeAll(() => {
    const jsonPath = path.join(__dirname, '../../public/streamSchedule.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    streamSchedule = JSON.parse(jsonContent);
  });

  describe('JSON Structure', () => {
    test('should be valid JSON', () => {
      expect(streamSchedule).toBeDefined();
      expect(typeof streamSchedule).toBe('object');
    });

    test('should have required top-level properties', () => {
      expect(streamSchedule).toHaveProperty('month');
      expect(streamSchedule).toHaveProperty('year');
      expect(streamSchedule).toHaveProperty('streams');
      expect(streamSchedule).toHaveProperty('categories');
    });

    test('should not have extra properties', () => {
      const allowedProperties = ['month', 'year', 'streams', 'categories'];
      const actualProperties = Object.keys(streamSchedule);
      expect(actualProperties).toEqual(expect.arrayContaining(allowedProperties));
      expect(actualProperties).toHaveLength(allowedProperties.length);
    });
  });

  describe('Month and Year', () => {
    test('month should be a valid number between 1 and 12', () => {
      expect(typeof streamSchedule.month).toBe('number');
      expect(streamSchedule.month).toBeGreaterThanOrEqual(1);
      expect(streamSchedule.month).toBeLessThanOrEqual(12);
    });

    test('year should be a valid positive number', () => {
      expect(typeof streamSchedule.year).toBe('number');
      expect(streamSchedule.year).toBeGreaterThan(0);
      expect(Number.isInteger(streamSchedule.year)).toBe(true);
    });
  });

  describe('Streams Object', () => {
    test('streams should be an object', () => {
      expect(typeof streamSchedule.streams).toBe('object');
      expect(streamSchedule.streams).not.toBeNull();
    });

    test('each stream should have required properties', () => {
      Object.entries(streamSchedule.streams).forEach(([id, stream]) => {
        expect(stream).toHaveProperty('category');
        expect(stream).toHaveProperty('subject');
        expect(stream).toHaveProperty('time');
      });
    });

    test('stream properties should be non-empty strings', () => {
      Object.entries(streamSchedule.streams).forEach(([id, stream]) => {
        expect(typeof stream.category).toBe('string');
        expect(stream.category.trim()).not.toBe('');
        
        expect(typeof stream.subject).toBe('string');
        expect(stream.subject.trim()).not.toBe('');
        
        expect(typeof stream.time).toBe('string');
        expect(stream.time.trim()).not.toBe('');
      });
    });

    test('stream IDs should be unique', () => {
      const streamIds = Object.keys(streamSchedule.streams);
      const uniqueIds = new Set(streamIds);
      expect(uniqueIds.size).toBe(streamIds.length);
    });

    test('stream categories should reference existing categories', () => {
      const categoryNames = Object.keys(streamSchedule.categories);
      Object.values(streamSchedule.streams).forEach(stream => {
        expect(categoryNames).toContain(stream.category);
      });
    });
  });

  describe('Categories Object', () => {
    test('categories should be an object', () => {
      expect(typeof streamSchedule.categories).toBe('object');
      expect(streamSchedule.categories).not.toBeNull();
    });

    test('should have at least one category', () => {
      const categoryCount = Object.keys(streamSchedule.categories).length;
      expect(categoryCount).toBeGreaterThan(0);
    });

    test('each category should have required color properties', () => {
      Object.entries(streamSchedule.categories).forEach(([name, colors]) => {
        expect(colors).toHaveProperty('bg');
        expect(colors).toHaveProperty('border');
        expect(colors).toHaveProperty('text');
        expect(colors).toHaveProperty('dot');
      });
    });

    test('category color properties should be valid Tailwind CSS classes', () => {
      // const validColorNames = ['purple', 'pink', 'blue', 'green', 'orange', 'red', 'yellow', 'indigo', 'gray'];
      
      Object.entries(streamSchedule.categories).forEach(([name, colors]) => {
        // Check bg class format: bg-{color}-100
        expect(colors.bg).toMatch(/^bg-(purple|pink|blue|green|orange|red|yellow|indigo|gray)-100$/);
        
        // Check border class format: border-{color}-400
        expect(colors.border).toMatch(/^border-(purple|pink|blue|green|orange|red|yellow|indigo|gray)-400$/);
        
        // Check text class format: text-{color}-800
        expect(colors.text).toMatch(/^text-(purple|pink|blue|green|orange|red|yellow|indigo|gray)-800$/);
        
        // Check dot class format: bg-{color}-500
        expect(colors.dot).toMatch(/^bg-(purple|pink|blue|green|orange|red|yellow|indigo|gray)-500$/);
      });
    });

    test('category names should be non-empty strings', () => {
      Object.keys(streamSchedule.categories).forEach(name => {
        expect(typeof name).toBe('string');
        expect(name.trim()).not.toBe('');
      });
    });

    test('category names should be unique', () => {
      const categoryNames = Object.keys(streamSchedule.categories);
      const uniqueNames = new Set(categoryNames);
      expect(uniqueNames.size).toBe(categoryNames.length);
    });
  });

  describe('Data Consistency', () => {
    test('all stream categories should exist in categories object', () => {
      const categoryNames = Object.keys(streamSchedule.categories);
      const streamCategories = [...new Set(Object.values(streamSchedule.streams).map(s => s.category))];
      
      streamCategories.forEach(category => {
        expect(categoryNames).toContain(category);
      });
    });

    test('time format should be reasonable', () => {
      Object.values(streamSchedule.streams).forEach(stream => {
        // Basic time format validation - should contain time indicators
        expect(stream.time).toMatch(/\d{1,2}:\d{2}(am|pm)/i);
        expect(stream.time).toMatch(/-/); // Should contain dash for time range
        // Time format should be "startTime - endTime" (no timezone suffix)
        expect(stream.time).toMatch(/^\d{1,2}:\d{2}(am|pm)\s*-\s*\d{1,2}:\d{2}(am|pm)$/i);
      });
    });
  });

  describe('JSON File Integrity', () => {
    test('JSON file should be properly formatted', () => {
      const jsonPath = path.join(__dirname, '../../public/streamSchedule.json');
      const jsonContent = fs.readFileSync(jsonPath, 'utf8');
      
      // Should not have any syntax errors
      expect(() => JSON.parse(jsonContent)).not.toThrow();
      
      // Should be valid JSON structure
      const parsed = JSON.parse(jsonContent);
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
    });
  });
});
