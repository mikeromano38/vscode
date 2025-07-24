import { Component, OnInit } from '@angular/core';
import { VegaChartService, ChartData, ChartOptions } from '../../services/vega-chart.service';

@Component({
  selector: 'app-vega-chart-example',
  template: `
    <div class="vega-example-container">
      <h3>Vega Chart Examples</h3>
      
      <div class="chart-section">
        <h4>Bar Chart</h4>
        <app-vega-chart 
          [spec]="barChartSpec" 
          [data]="barChartData"
          [width]="400"
          [height]="300">
        </app-vega-chart>
      </div>

      <div class="chart-section">
        <h4>Line Chart</h4>
        <app-vega-chart 
          [spec]="lineChartSpec" 
          [data]="lineChartData"
          [width]="400"
          [height]="300">
        </app-vega-chart>
      </div>

      <div class="chart-section">
        <h4>Scatter Plot</h4>
        <app-vega-chart 
          [spec]="scatterChartSpec" 
          [data]="scatterChartData"
          [width]="400"
          [height]="300">
        </app-vega-chart>
      </div>

      <div class="chart-section">
        <h4>Pie Chart</h4>
        <app-vega-chart 
          [spec]="pieChartSpec" 
          [data]="pieChartData"
          [width]="400"
          [height]="300">
        </app-vega-chart>
      </div>
    </div>
  `,
  styles: [`
    .vega-example-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .chart-section {
      margin-bottom: 40px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      background-color: #fafafa;
    }
    
    .chart-section h4 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333;
    }
  `]
})
export class VegaChartExampleComponent implements OnInit {
  barChartSpec: any;
  lineChartSpec: any;
  scatterChartSpec: any;
  pieChartSpec: any;

  barChartData: ChartData[] = [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'C', value: 15 },
    { category: 'D', value: 25 },
    { category: 'E', value: 30 }
  ];

  lineChartData: ChartData[] = [
    { date: '2023-01-01', value: 10 },
    { date: '2023-02-01', value: 15 },
    { date: '2023-03-01', value: 12 },
    { date: '2023-04-01', value: 20 },
    { date: '2023-05-01', value: 18 },
    { date: '2023-06-01', value: 25 }
  ];

  scatterChartData: ChartData[] = [
    { x: 1, y: 5, size: 10 },
    { x: 2, y: 8, size: 15 },
    { x: 3, y: 12, size: 20 },
    { x: 4, y: 10, size: 12 },
    { x: 5, y: 15, size: 25 },
    { x: 6, y: 18, size: 30 }
  ];

  pieChartData: ChartData[] = [
    { category: 'Category A', value: 30 },
    { category: 'Category B', value: 25 },
    { category: 'Category C', value: 20 },
    { category: 'Category D', value: 15 },
    { category: 'Category E', value: 10 }
  ];

  ngOnInit() {
    this.initializeCharts();
  }

  private initializeCharts() {
    // Bar Chart
    this.barChartSpec = VegaChartService.createBarChart(this.barChartData, {
      title: 'Sample Bar Chart',
      xField: 'category',
      yField: 'value',
      width: 400,
      height: 300
    });

    // Line Chart
    this.lineChartSpec = VegaChartService.createLineChart(this.lineChartData, {
      title: 'Sample Line Chart',
      xField: 'date',
      yField: 'value',
      width: 400,
      height: 300
    });

    // Scatter Plot
    this.scatterChartSpec = VegaChartService.createScatterPlot(this.scatterChartData, {
      title: 'Sample Scatter Plot',
      xField: 'x',
      yField: 'y',
      sizeField: 'size',
      width: 400,
      height: 300
    });

    // Pie Chart
    this.pieChartSpec = VegaChartService.createPieChart(this.pieChartData, {
      title: 'Sample Pie Chart',
      xField: 'category',
      yField: 'value',
      width: 400,
      height: 300
    });
  }

  // Example method to update chart data dynamically
  updateBarChartData(newData: ChartData[]) {
    this.barChartData = newData;
    this.barChartSpec = VegaChartService.createBarChart(this.barChartData, {
      title: 'Updated Bar Chart',
      xField: 'category',
      yField: 'value',
      width: 400,
      height: 300
    });
  }

  // Example method to create a chart from BigQuery results
  createChartFromBigQueryResults(results: any[], chartType: 'bar' | 'line' | 'scatter' | 'area' | 'pie' | 'histogram' = 'bar') {
    const chartData = VegaChartService.convertBigQueryResults(results);
    const detectedType = VegaChartService.autoDetectChartType(chartData);
    const finalChartType = chartType || detectedType;
    
    return VegaChartService.createChart(chartData, {
      title: `BigQuery Results - ${finalChartType} Chart`,
      chartType: finalChartType,
      width: 400,
      height: 300
    });
  }
} 