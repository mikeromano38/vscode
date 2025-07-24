# Vega Visualization in Custom Chat Extension

This document describes how to use Vega visualization capabilities in the custom chat extension for creating interactive charts and graphs.

## Overview

The custom chat extension now includes Vega and Vega-Lite for data visualization. This allows you to create interactive charts from BigQuery data and other data sources.

## Dependencies

The following Vega packages have been installed:

- `vega`: Core Vega visualization library
- `vega-lite`: High-level grammar for creating Vega specifications
- `vega-embed`: Utility for embedding Vega charts in web applications

## Components

### VegaChartComponent

A reusable Angular component for displaying Vega charts:

```typescript
import { VegaChartComponent } from './components/vega-chart/vega-chart.component';

// Usage in template
<app-vega-chart 
  [spec]="chartSpec" 
  [data]="chartData"
  [width]="400"
  [height]="300"
  [theme]="'dark'">
</app-vega-chart>
```

**Input Properties:**
- `spec`: Vega or Vega-Lite specification object
- `data`: Array of data objects
- `width`: Chart width in pixels
- `height`: Chart height in pixels
- `theme`: Vega theme (optional)

### VegaChartService

A service for creating common chart specifications:

```typescript
import { VegaChartService, ChartData, ChartOptions } from './services/vega-chart.service';

// Create a bar chart
const barChartSpec = VegaChartService.createBarChart(data, {
  title: 'My Chart',
  xField: 'category',
  yField: 'value',
  width: 400,
  height: 300
});

// Create a line chart
const lineChartSpec = VegaChartService.createLineChart(data, {
  title: 'Time Series',
  xField: 'date',
  yField: 'value'
});

// Auto-detect chart type
const chartType = VegaChartService.autoDetectChartType(data);
const spec = VegaChartService.createChart(data, { chartType });
```

## Chart Types

The service supports the following chart types:

1. **Bar Chart** (`bar`): Categorical data with quantitative values
2. **Line Chart** (`line`): Time series or continuous data
3. **Scatter Plot** (`scatter`): Two quantitative variables
4. **Area Chart** (`area`): Time series with filled areas
5. **Pie Chart** (`pie`): Proportional data
6. **Histogram** (`histogram`): Distribution of quantitative data

## Working with BigQuery Data

### Converting BigQuery Results

```typescript
// Convert BigQuery results to chart format
const chartData = VegaChartService.convertBigQueryResults(bigQueryResults);

// Create chart from BigQuery results
const spec = VegaChartService.createChart(chartData, {
  title: 'BigQuery Results',
  chartType: 'bar'
});
```

### Example with BigQuery Table Service

```typescript
import { BigQueryTableService } from '../bigqueryTableService';
import { VegaChartService } from './services/vega-chart.service';

// Get open BigQuery tables
const tableService = BigQueryTableService.getInstance();
const openTabs = await tableService.getOpenTableTabs();

// Create chart from table data
if (openTabs.length > 0) {
  const tableData = await getTableData(openTabs[0]); // Your data fetching logic
  const chartSpec = VegaChartService.createChart(tableData, {
    title: `Data from ${openTabs[0].tableId}`,
    chartType: 'bar'
  });
}
```

## Themes

Vega supports various themes for different visual styles:

- `dark`: Dark theme
- `excel`: Excel-like styling
- `fivethirtyeight`: FiveThirtyEight style
- `ggplot2`: R ggplot2 style
- `latimes`: Los Angeles Times style
- `quartz`: Quartz style
- `vox`: Vox style
- `urbaninstitute`: Urban Institute style
- `googlecharts`: Google Charts style
- `powerbi`: Power BI style
- `carbonwhite`: Carbon white theme
- `carbong10`: Carbon gray 10 theme
- `carbong90`: Carbon gray 90 theme
- `carbong100`: Carbon gray 100 theme

## Example Usage in Chat Messages

```typescript
// In your message content component
export class MessageContentComponent {
  chartSpec: any;
  chartData: ChartData[] = [];

  displayChart(data: any[]) {
    this.chartData = VegaChartService.convertBigQueryResults(data);
    this.chartSpec = VegaChartService.createChart(this.chartData, {
      title: 'Query Results',
      chartType: 'bar'
    });
  }
}
```

```html
<!-- In your template -->
<div *ngIf="chartSpec">
  <app-vega-chart 
    [spec]="chartSpec" 
    [data]="chartData"
    [width]="600"
    [height]="400">
  </app-vega-chart>
</div>
```

## Custom Vega Specifications

For advanced use cases, you can create custom Vega or Vega-Lite specifications:

```typescript
// Custom Vega-Lite specification
const customSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  width: 400,
  height: 300,
  title: 'Custom Chart',
  data: { values: data },
  mark: 'bar',
  encoding: {
    x: { field: 'category', type: 'nominal' },
    y: { field: 'value', type: 'quantitative' },
    color: { field: 'group', type: 'nominal' }
  }
};
```

## Integration with Conversational Analytics

The Vega visualization can be integrated with Google Cloud's Conversational Analytics API responses:

```typescript
// When receiving a response from Conversational Analytics API
async handleAnalyticsResponse(response: any) {
  if (response.visualization) {
    // The API might return visualization suggestions
    const chartSpec = response.visualization.spec;
    const chartData = response.visualization.data;
    
    // Display the chart
    this.displayChart(chartData, chartSpec);
  }
}
```

## Performance Considerations

- Vega charts are loaded as lazy chunks to reduce initial bundle size
- Large datasets should be sampled or aggregated before visualization
- Consider using Vega-Lite for simpler charts as it's more performant
- Use appropriate chart types for your data (e.g., line charts for time series)

## Troubleshooting

### Common Issues

1. **TypeScript errors with fast-json-patch**: A type declaration file has been created to resolve this
2. **Chart not rendering**: Ensure the data format matches the specification
3. **Performance issues**: Consider reducing data size or using simpler chart types

### Debug Tips

- Check browser console for Vega error messages
- Verify data format matches chart specification
- Use Vega-Lite's online editor to test specifications
- Ensure all required fields are present in the data

## Resources

- [Vega Documentation](https://vega.github.io/vega/)
- [Vega-Lite Documentation](https://vega.github.io/vega-lite/)
- [Vega-Lite Online Editor](https://vega.github.io/editor/)
- [Vega Themes](https://vega.github.io/vega-themes/) 