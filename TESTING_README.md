# JSON Validation Testing

This project includes comprehensive testing for the `streamSchedule.json` file to ensure data integrity and prevent issues.

## Test Files

- **`src/__tests__/streamSchedule.test.js`** - Comprehensive Jest test suite
- **`.github/workflows/test-json.yml`** - GitHub Actions CI/CD workflow

## Running Tests

### Local Testing

```bash
# Run all tests
npm test

# Run only JSON validation tests
npm run test:json

# Run tests with coverage
npm run test:ci
```

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- When `streamSchedule.json` or test files are modified

## Test Coverage

The test suite validates:

### ✅ JSON Structure
- Valid JSON syntax
- Required properties (month, year, streams, categories)
- No extra properties
- Proper object types

### ✅ Month and Year
- Month between 1-12
- Year as positive integer
- Proper data types

### ✅ Streams Object
- All streams have required properties (category, subject, time)
- Non-empty string values
- Unique stream IDs
- Categories reference existing categories

### ✅ Categories Object
- Valid Tailwind CSS color classes
- Required color properties (bg, border, text, dot)
- Unique category names
- Non-empty category names

### ✅ Data Consistency
- All stream categories exist in categories object
- Reasonable time format validation
- No orphaned references

### ✅ File Integrity
- Valid JSON syntax
- Proper file structure

## Validation Features

### Jest Test Suite
- **19 comprehensive tests**
- Covers all data validation scenarios
- Runs in CI/CD pipeline
- Provides detailed error messages
- Professional testing framework

### GitHub Actions
- **Multi-Node.js version testing** (18.x, 20.x)
- **Automatic validation** on file changes
- **JSON syntax checking**
- **Format validation**

## Error Prevention

The tests catch common issues like:
- ❌ Invalid JSON syntax
- ❌ Missing required properties
- ❌ Invalid month/year values
- ❌ Empty or missing string values
- ❌ Orphaned category references
- ❌ Invalid Tailwind CSS classes
- ❌ Duplicate IDs or names

## Integration with JSON Update Tool

The validation works seamlessly with the `json-update-tool.js`:
- Tool maintains data integrity during updates
- Tests verify changes don't break structure
- CI/CD ensures all changes are validated

## Usage in Development

1. **Before committing**: Run `npm run test:json`
2. **Full testing**: Run `npm test`
3. **CI/CD**: Tests run automatically on push/PR

## Troubleshooting

### Common Issues

**"JSON syntax error"**
- Check for trailing commas
- Verify all braces are closed
- Remove extra whitespace

**"Missing required properties"**
- Ensure month, year, streams, categories exist
- Check property names are exact

**"Invalid month/year"**
- Month must be 1-12
- Year must be positive integer

**"Orphaned category references"**
- All stream categories must exist in categories object
- Use the JSON update tool to manage categories

**"Invalid Tailwind CSS classes"**
- Use only supported colors: purple, pink, blue, green, orange, red, yellow, indigo, gray
- Follow format: bg-{color}-100, border-{color}-400, text-{color}-800, bg-{color}-500

## Benefits

- 🛡️ **Prevents data corruption**
- 🚀 **Catches issues early**
- 🔄 **Automated validation**
- 📊 **Comprehensive coverage**
- 🎯 **Clear error messages**
- 🔧 **Easy integration**

