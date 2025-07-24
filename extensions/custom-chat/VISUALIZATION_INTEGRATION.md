# Vega Visualization Integration

This document explains how Vega visualization has been integrated into the custom chat extension to render interactive charts from visualization messages.

## Overview

The custom chat extension now supports rendering Vega-Lite visualizations when messages contain chart specifications. Instead of displaying raw JSON, the extension renders interactive charts using the VegaChartComponent.

## Message Types

### Chart Messages (`type: 'chart'`)
- Uses `data.vegaConfig` for the Vega specification
- Legacy format for backward compatibility

### Visualization Messages (`type: 'visualization'`)
- Uses `data.vegaLiteSpec` for the Vega-Lite specification
- New format with additional metadata
- Supports `data.title` and `data.description` for better UX

## Message Structure

### Visualization Message Format
```typescript
{
  type: 'visualization',
  data: {
    title: 'Chart Title',
    description: 'Chart description',
    vegaLiteSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 600,
      height: 400,
      title: 'Chart Title',
      data: {
        values: [
          { x: 'A', y: 10 },
          { x: 'B', y: 20 },
          // ... more data
        ]
      },
      mark: 'bar',
      encoding: {
        x: { field: 'x', type: 'nominal' },
        y: { field: 'y', type: 'quantitative' }
      }
    }
  }
}
```

## Components

### VegaChartComponent
- Reusable Angular component for rendering Vega charts
- Supports both Vega and Vega-Lite specifications
- Uses dynamic imports for lazy loading
- Handles data updates and resizing

### MessageContentComponent
- Updated to handle both `chart` and `visualization` message types
- Extracts data from Vega specifications
- Renders charts using VegaChartComponent
- Shows JSON specification in collapsible debug section

## Integration with Conversational Analytics

When the Conversational Analytics API returns visualization data, it can be processed as follows:

```typescript
// Example: Processing API response with visualization
async handleAnalyticsResponse(response: any) {
  if (response.visualization) {
    const visualizationMessage = {
      type: 'visualization' as MessageContentType,
      data: {
        title: response.visualization.title || 'Data Visualization',
        description: response.visualization.description || 'Generated chart from query results',
        vegaLiteSpec: response.visualization.spec
      }
    };
    
    // Add to chat messages
    this.messages.push(visualizationMessage);
  }
}
```

## BigQuery Integration

The VegaChartService provides utilities for creating charts from BigQuery results:

```typescript
import { VegaChartService } from './services/vega-chart.service';

// Convert BigQuery results to chart
const chartData = VegaChartService.convertBigQueryResults(bigQueryResults);
const chartType = VegaChartService.autoDetectChartType(chartData);
const spec = VegaChartService.createChart(chartData, {
  title: 'BigQuery Results',
  chartType: chartType
});

// Create visualization message
const visualizationMessage = {
  type: 'visualization' as MessageContentType,
  data: {
    title: 'Query Results',
    description: `Generated ${chartType} chart from BigQuery data`,
    vegaLiteSpec: spec
  }
};
```

## Performance Optimizations

### Lazy Loading
- Vega libraries are loaded dynamically when needed
- Reduces initial bundle size from ~1MB to ~227KB
- Libraries are split into separate chunks

### Bundle Configuration
- Increased budget limits to accommodate Vega libraries
- Initial bundle: 2MB max (was 1MB)
- Component styles: 8KB max (was 4KB)

## Usage Examples

### 1. Simple Bar Chart
```typescript
const barChartMessage = {
  type: 'visualization' as MessageContentType,
  data: {
    title: 'Sales by Category',
    description: 'Bar chart showing sales performance',
    vegaLiteSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 600,
      height: 400,
      data: { values: salesData },
      mark: 'bar',
      encoding: {
        x: { field: 'category', type: 'nominal' },
        y: { field: 'sales', type: 'quantitative' }
      }
    }
  }
};
```

### 2. Line Chart with Time Series
```typescript
const lineChartMessage = {
  type: 'visualization' as MessageContentType,
  data: {
    title: 'Revenue Trend',
    description: 'Monthly revenue over time',
    vegaLiteSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 600,
      height: 400,
      data: { values: timeSeriesData },
      mark: 'line',
      encoding: {
        x: { field: 'date', type: 'temporal' },
        y: { field: 'revenue', type: 'quantitative' }
      }
    }
  }
};
```

### 3. Scatter Plot with Color Encoding
```typescript
const scatterChartMessage = {
  type: 'visualization' as MessageContentType,
  data: {
    title: 'Customer Analysis',
    description: 'Age vs spending with segment colors',
    vegaLiteSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 600,
      height: 400,
      data: { values: customerData },
      mark: 'circle',
      encoding: {
        x: { field: 'age', type: 'quantitative' },
        y: { field: 'spending', type: 'quantitative' },
        color: { field: 'segment', type: 'nominal' }
      }
    }
  }
};
```

## Debugging

### Viewing Specifications
- Each chart includes a collapsible "View Vega-Lite Specification" section
- Shows the raw JSON specification for debugging
- Useful for understanding chart structure and troubleshooting

### Console Logging
- Chart initialization is logged to console
- Includes data length and specification details
- Error handling for malformed specifications

## Future Enhancements

1. **Theme Support**: Add VS Code theme-aware chart styling
2. **Interactive Features**: Add zoom, pan, and selection capabilities
3. **Export Options**: Allow exporting charts as PNG/SVG
4. **Custom Themes**: Support for custom chart themes
5. **Animation**: Add smooth transitions for data updates

## Troubleshooting

### Common Issues

1. **Chart not rendering**: Check console for Vega errors
2. **Data not showing**: Verify data format matches specification
3. **Performance issues**: Consider reducing data size or using simpler charts
4. **Bundle size warnings**: Vega libraries are lazy-loaded to minimize impact

### Debug Steps

1. Check browser console for error messages
2. Verify Vega-Lite specification syntax
3. Ensure data format is correct
4. Test specification in Vega-Lite online editor
5. Check network tab for lazy-loaded chunks 