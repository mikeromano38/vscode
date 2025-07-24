export interface ChartData {
  [key: string]: any;
}

export interface ChartOptions {
  width?: number;
  height?: number;
  title?: string;
  xField?: string;
  yField?: string;
  colorField?: string;
  sizeField?: string;
  chartType?: 'bar' | 'line' | 'scatter' | 'area' | 'pie' | 'histogram';
}

export class VegaChartService {
  
  /**
   * Create a bar chart specification
   */
  static createBarChart(data: ChartData[], options: ChartOptions = {}): any {
    const { width = 400, height = 300, title, xField = 'x', yField = 'y', colorField } = options;
    
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width,
      height,
      title,
      data: { values: data },
      mark: 'bar',
      encoding: {
        x: { field: xField, type: 'nominal' },
        y: { field: yField, type: 'quantitative' },
        ...(colorField && { color: { field: colorField, type: 'nominal' } })
      }
    };
  }

  /**
   * Create a line chart specification
   */
  static createLineChart(data: ChartData[], options: ChartOptions = {}): any {
    const { width = 400, height = 300, title, xField = 'x', yField = 'y', colorField } = options;
    
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width,
      height,
      title,
      data: { values: data },
      mark: 'line',
      encoding: {
        x: { field: xField, type: 'temporal' },
        y: { field: yField, type: 'quantitative' },
        ...(colorField && { color: { field: colorField, type: 'nominal' } })
      }
    };
  }

  /**
   * Create a scatter plot specification
   */
  static createScatterPlot(data: ChartData[], options: ChartOptions = {}): any {
    const { width = 400, height = 300, title, xField = 'x', yField = 'y', colorField, sizeField } = options;
    
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width,
      height,
      title,
      data: { values: data },
      mark: 'circle',
      encoding: {
        x: { field: xField, type: 'quantitative' },
        y: { field: yField, type: 'quantitative' },
        ...(colorField && { color: { field: colorField, type: 'nominal' } }),
        ...(sizeField && { size: { field: sizeField, type: 'quantitative' } })
      }
    };
  }

  /**
   * Create an area chart specification
   */
  static createAreaChart(data: ChartData[], options: ChartOptions = {}): any {
    const { width = 400, height = 300, title, xField = 'x', yField = 'y', colorField } = options;
    
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width,
      height,
      title,
      data: { values: data },
      mark: 'area',
      encoding: {
        x: { field: xField, type: 'temporal' },
        y: { field: yField, type: 'quantitative' },
        ...(colorField && { color: { field: colorField, type: 'nominal' } })
      }
    };
  }

  /**
   * Create a pie chart specification
   */
  static createPieChart(data: ChartData[], options: ChartOptions = {}): any {
    const { width = 400, height = 300, title, xField = 'category', yField = 'value', colorField } = options;
    
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width,
      height,
      title,
      data: { values: data },
      mark: 'arc',
      encoding: {
        theta: { field: yField, type: 'quantitative' },
        color: { field: colorField || xField, type: 'nominal' }
      }
    };
  }

  /**
   * Create a histogram specification
   */
  static createHistogram(data: ChartData[], options: ChartOptions = {}): any {
    const { width = 400, height = 300, title, xField = 'value', colorField } = options;
    
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width,
      height,
      title,
      data: { values: data },
      mark: 'bar',
      encoding: {
        x: { field: xField, type: 'quantitative', bin: true },
        y: { aggregate: 'count', type: 'quantitative' },
        ...(colorField && { color: { field: colorField, type: 'nominal' } })
      }
    };
  }

  /**
   * Create a chart based on chart type
   */
  static createChart(data: ChartData[], options: ChartOptions = {}): any {
    const { chartType = 'bar' } = options;
    
    switch (chartType) {
      case 'bar':
        return this.createBarChart(data, options);
      case 'line':
        return this.createLineChart(data, options);
      case 'scatter':
        return this.createScatterPlot(data, options);
      case 'area':
        return this.createAreaChart(data, options);
      case 'pie':
        return this.createPieChart(data, options);
      case 'histogram':
        return this.createHistogram(data, options);
      default:
        return this.createBarChart(data, options);
    }
  }

  /**
   * Convert BigQuery results to chart data format
   */
  static convertBigQueryResults(results: any[]): ChartData[] {
    if (!results || results.length === 0) {
      return [];
    }

    // If results are already in the right format, return as is
    if (typeof results[0] === 'object' && results[0] !== null) {
      return results;
    }

    // If results are arrays, convert to objects
    if (Array.isArray(results[0])) {
      return results.map((row, index) => {
        const obj: ChartData = { index };
        row.forEach((value: any, colIndex: number) => {
          obj[`col${colIndex}`] = value;
        });
        return obj;
      });
    }

    return results;
  }

  /**
   * Auto-detect chart type based on data
   */
  static autoDetectChartType(data: ChartData[]): 'bar' | 'line' | 'scatter' | 'area' | 'pie' | 'histogram' {
    if (!data || data.length === 0) {
      return 'bar';
    }

    const sample = data[0];
    const keys = Object.keys(sample);
    
    // Check for temporal data (dates/timestamps)
    const hasTemporalData = keys.some(key => {
      const value = sample[key];
      return typeof value === 'string' && (
        value.includes('-') || value.includes('/') || 
        value.includes('T') || value.includes('Z')
      );
    });

    if (hasTemporalData) {
      return 'line';
    }

    // Check for categorical vs numerical data
    const numericalKeys = keys.filter(key => typeof sample[key] === 'number');
    const categoricalKeys = keys.filter(key => typeof sample[key] === 'string');

    if (categoricalKeys.length >= 1 && numericalKeys.length >= 1) {
      return 'bar';
    }

    if (numericalKeys.length >= 2) {
      return 'scatter';
    }

    return 'bar';
  }
} 