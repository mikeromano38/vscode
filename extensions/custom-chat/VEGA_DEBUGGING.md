# Vega Chart Debugging Guide

This guide helps you troubleshoot common issues with Vega chart rendering in the custom chat extension.

## Common Errors and Solutions

### 1. "Unrecognized data set: source" Error

**Problem**: The chart is trying to reference a data source that doesn't exist.

**Solution**: The component now automatically detects and uses the correct data source name. Check the console logs for:
- `[VegaChartComponent] Available data sources:` - Shows all available data sources
- `[VegaChartComponent] Expected data source name:` - Shows the name used during preparation
- `[VegaChartComponent] Found data source:` - Shows which data source was successfully found

### 2. "r.data.find is not a function" Error

**Problem**: The specification's data property is not an array.

**Solution**: The component now handles this automatically by:
- Converting non-array data to arrays
- Adding proper type checking
- Providing detailed error messages

### 3. Chart Not Rendering

**Problem**: Chart appears blank or shows an error.

**Debugging Steps**:
1. Check browser console for error messages
2. Look for `[VegaChartComponent]` log messages
3. Verify the Vega-Lite specification syntax
4. Check if data is properly formatted

## Console Logging

The VegaChartComponent provides detailed logging. Look for these messages:

### Initialization
```
[VegaChartComponent] Starting chart render: {spec: {...}, dataLength: 3, container: ...}
[VegaChartComponent] Prepared spec: {...}
[VegaChartComponent] Chart rendered successfully
```

### Data Source Detection
```
[VegaChartComponent] Available data sources: ['data', 'source']
[VegaChartComponent] Expected data source name: data
[VegaChartComponent] Found expected data source: data
[VegaChartComponent] Data updated successfully
```

### Error Messages
```
[VegaChartComponent] Error rendering Vega chart: Error message
[VegaChartComponent] Error details: {spec: {...}, data: [...], error: "...", stack: "..."}
```

## Testing Your Charts

### 1. Use the Test Component

Add the test component to your app to verify basic functionality:

```html
<app-vega-test></app-vega-test>
```

This will show 4 different chart scenarios:
- Simple bar chart with external data
- Chart with data embedded in specification
- Chart with external data and no spec data
- Visualization message format

### 2. Test Different Data Formats

Try these different message formats:

#### Format 1: External Data
```typescript
{
  type: 'visualization',
  data: {
    title: 'Test Chart',
    description: 'Test description',
    vegaLiteSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 400,
      height: 300,
      mark: 'bar',
      encoding: {
        x: { field: 'category', type: 'nominal' },
        y: { field: 'value', type: 'quantitative' }
      }
    }
  }
}
```

#### Format 2: Embedded Data
```typescript
{
  type: 'visualization',
  data: {
    title: 'Test Chart',
    description: 'Test description',
    vegaLiteSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 400,
      height: 300,
      data: {
        values: [
          { category: 'A', value: 10 },
          { category: 'B', value: 20 }
        ]
      },
      mark: 'bar',
      encoding: {
        x: { field: 'category', type: 'nominal' },
        y: { field: 'value', type: 'quantitative' }
      }
    }
  }
}
```

## Data Source Naming

The component now uses consistent data source naming:

1. **Primary**: `data` (default)
2. **Fallback**: `source`, `values`, `table`
3. **Auto-detection**: Uses the first available data source if none match

## Error Display

When errors occur, the component displays a user-friendly error message with:
- Error description
- Technical details (expandable)
- Stack trace for debugging

## Performance Monitoring

Monitor these metrics:
- **Bundle size**: Should be ~229KB initial + ~834KB lazy-loaded
- **Load time**: Vega libraries load on-demand
- **Memory usage**: Charts are properly cleaned up

## Common Issues Checklist

- [ ] Vega-Lite specification is valid JSON
- [ ] Data format matches field names in encoding
- [ ] Chart dimensions are reasonable (not too large)
- [ ] Data source names are consistent
- [ ] No circular references in data
- [ ] Field types match data types (nominal vs quantitative)

## Getting Help

If you're still having issues:

1. **Check the console logs** for detailed error information
2. **Test with the Vega-Lite online editor** to verify your specification
3. **Use the test component** to isolate the issue
4. **Check the browser's Network tab** to ensure Vega libraries loaded
5. **Verify data format** matches the specification requirements

## Example Debugging Session

```javascript
// 1. Check console for initialization
[VegaChartComponent] Starting chart render: {spec: {...}, dataLength: 3}

// 2. Verify specification preparation
[VegaChartComponent] Prepared spec: {data: [{name: 'data', values: [...]}]}

// 3. Check data source detection
[VegaChartComponent] Available data sources: ['data']
[VegaChartComponent] Expected data source name: data
[VegaChartComponent] Found expected data source: data

// 4. Confirm successful rendering
[VegaChartComponent] Chart rendered successfully
``` 