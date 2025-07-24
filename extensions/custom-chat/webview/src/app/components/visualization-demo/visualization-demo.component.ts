import { Component, OnInit } from '@angular/core';
import { VegaChartService, ChartData } from '../../services/vega-chart.service';

@Component({
  selector: 'app-visualization-demo',
  template: `
    <div class="visualization-demo">
      <h2>Visualization Demo</h2>
      
      <div class="demo-section">
        <h3>Sample Visualization Messages</h3>
        
        <div class="message-example">
          <h4>1. Bar Chart Example</h4>
          <div class="message-content">
            <app-message-content 
              [type]="'visualization'" 
              [data]="barChartMessage">
            </app-message-content>
          </div>
        </div>

        <div class="message-example">
          <h4>2. Line Chart Example</h4>
          <div class="message-content">
            <app-message-content 
              [type]="'visualization'" 
              [data]="lineChartMessage">
            </app-message-content>
          </div>
        </div>

        <div class="message-example">
          <h4>3. Scatter Plot Example</h4>
          <div class="message-content">
            <app-message-content 
              [type]="'visualization'" 
              [data]="scatterChartMessage">
            </app-message-content>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visualization-demo {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .demo-section {
      margin-top: 20px;
    }

    .message-example {
      margin-bottom: 40px;
      border: 1px solid var(--vscode-input-border);
      border-radius: 8px;
      padding: 20px;
      background-color: var(--vscode-editor-background);
    }

    .message-example h4 {
      margin-top: 0;
      margin-bottom: 15px;
      color: var(--vscode-editor-foreground);
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 8px;
    }

    .message-content {
      margin-top: 15px;
    }
  `]
})
export class VisualizationDemoComponent implements OnInit {
  
  barChartMessage = {
    title: 'Sales by Category',
    description: 'A bar chart showing sales performance across different product categories.',
    vegaLiteSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 600,
      height: 400,
      title: 'Sales by Category',
      data: {
        values: [
          { category: 'Electronics', sales: 1200 },
          { category: 'Clothing', sales: 800 },
          { category: 'Books', sales: 600 },
          { category: 'Home & Garden', sales: 900 },
          { category: 'Sports', sales: 500 }
        ]
      },
      mark: 'bar',
      encoding: {
        x: { field: 'category', type: 'nominal', title: 'Product Category' },
        y: { field: 'sales', type: 'quantitative', title: 'Sales ($)' }
      }
    }
  };

  lineChartMessage = {
    title: 'Monthly Revenue Trend',
    description: 'A line chart showing revenue trends over the past 12 months.',
    vegaLiteSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 600,
      height: 400,
      title: 'Monthly Revenue Trend',
      data: {
        values: [
          { month: 'Jan', revenue: 5000 },
          { month: 'Feb', revenue: 5500 },
          { month: 'Mar', revenue: 4800 },
          { month: 'Apr', revenue: 6200 },
          { month: 'May', revenue: 5800 },
          { month: 'Jun', revenue: 7000 },
          { month: 'Jul', revenue: 6500 },
          { month: 'Aug', revenue: 7200 },
          { month: 'Sep', revenue: 6800 },
          { month: 'Oct', revenue: 7500 },
          { month: 'Nov', revenue: 8000 },
          { month: 'Dec', revenue: 8500 }
        ]
      },
      mark: 'line',
      encoding: {
        x: { field: 'month', type: 'nominal', title: 'Month' },
        y: { field: 'revenue', type: 'quantitative', title: 'Revenue ($)' }
      }
    }
  };

  scatterChartMessage = {
    title: 'Customer Age vs Spending',
    description: 'A scatter plot showing the relationship between customer age and spending amount.',
    vegaLiteSpec: {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 600,
      height: 400,
      title: 'Customer Age vs Spending',
      data: {
        values: [
          { age: 25, spending: 120, segment: 'Young' },
          { age: 30, spending: 180, segment: 'Young' },
          { age: 35, spending: 220, segment: 'Middle' },
          { age: 40, spending: 280, segment: 'Middle' },
          { age: 45, spending: 320, segment: 'Middle' },
          { age: 50, spending: 350, segment: 'Senior' },
          { age: 55, spending: 380, segment: 'Senior' },
          { age: 60, spending: 420, segment: 'Senior' },
          { age: 65, spending: 450, segment: 'Senior' }
        ]
      },
      mark: 'circle',
      encoding: {
        x: { field: 'age', type: 'quantitative', title: 'Age' },
        y: { field: 'spending', type: 'quantitative', title: 'Spending ($)' },
        color: { field: 'segment', type: 'nominal', title: 'Customer Segment' },
        size: { value: 60 }
      }
    }
  };

  ngOnInit() {
    console.log('[VisualizationDemoComponent] Demo component initialized');
  }

  // Example method to create a visualization message from BigQuery results
  createVisualizationFromBigQuery(results: any[], chartType: 'bar' | 'line' | 'scatter' | 'area' | 'pie' | 'histogram' = 'bar') {
    const chartData = VegaChartService.convertBigQueryResults(results);
    const detectedType = VegaChartService.autoDetectChartType(chartData);
    const finalChartType = chartType || detectedType;
    
    const spec = VegaChartService.createChart(chartData, {
      title: `BigQuery Results - ${finalChartType} Chart`,
      chartType: finalChartType,
      width: 600,
      height: 400
    });

    return {
      title: `Data Visualization`,
      description: `Generated ${finalChartType} chart from BigQuery results.`,
      vegaLiteSpec: spec
    };
  }
} 