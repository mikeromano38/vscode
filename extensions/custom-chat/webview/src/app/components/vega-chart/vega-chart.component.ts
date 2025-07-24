import { Component, Input, OnInit, ElementRef, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-vega-chart',
  template: `
    <div class="vega-chart-container">
      <div #chartContainer class="chart-container"></div>
    </div>
  `,
  styles: [`
    .vega-chart-container {
      width: 100%;
      min-height: 300px;
      max-width: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .chart-container {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      flex: 1;
      box-sizing: border-box;
      position: relative;
    }
    .chart-container svg {
      max-width: 100%;
      height: auto;
    }
  `]
})
export class VegaChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() spec: any;
  @Input() data: any[] = [];
  @Input() width: number = 400;
  @Input() height: number = 300;
  @Input() theme: 'dark' | 'excel' | 'fivethirtyeight' | 'ggplot2' | 'latimes' | 'quartz' | 'vox' | 'urbaninstitute' | 'googlecharts' | 'powerbi' | 'carbonwhite' | 'carbong10' | 'carbong90' | 'carbong100' | undefined = undefined;
  
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  
  private view: any;
  private dataSourceName: string = 'table';
  private resizeTimeout: any;

  ngOnInit() {
    this.renderChart();
    
    // Add resize listener for responsive behavior
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  ngAfterViewInit() {
    // If the chart wasn't rendered in ngOnInit (e.g., container was hidden),
    // try to render it now
    if (!this.view && this.chartContainer) {
      setTimeout(() => {
        this.renderChart();
      }, 100);
    }
  }

  ngOnChanges() {
    if (this.chartContainer) {
      this.renderChart();
    }
  }

  ngOnDestroy() {
    // Clean up resize listener
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    if (this.view) {
      this.view.remove();
    }
  }

  private handleResize() {
    // Debounce resize events
    // if (this.resizeTimeout) {
    //   clearTimeout(this.resizeTimeout);
    // }
    // this.resizeTimeout = setTimeout(() => {
    //   if (this.view && this.chartContainer) {
    //     const { width: chartWidth, height: chartHeight } = this.calculateChartDimensions();
    //     console.log('[VegaChartComponent] Resizing chart to:', { chartWidth, chartHeight });
    //     this.view.resize(chartWidth, chartHeight);
    //   }
    // }, 250);
  }

  public forceResize() {
    // Force a re-render with current container dimensions
    if (this.chartContainer) {
      this.renderChart();
    }
  }

  private async renderChart() {
    if (!this.spec || !this.chartContainer) {
      console.warn('[VegaChartComponent] Missing spec or chartContainer');
      return;
    }

    try {
      console.log('[VegaChartComponent] Starting chart render:', {
        spec: this.spec,
        dataLength: this.data?.length,
        container: this.chartContainer.nativeElement,
        containerWidth: this.chartContainer.nativeElement.offsetWidth
      });

      // Dynamically import vega-embed
      const { default: embed } = await import('vega-embed');
      
      // Prepare the specification
      const finalSpec = await this.prepareSpec();
      
      console.log('[VegaChartComponent] Prepared spec:', finalSpec);
      console.log('[VegaChartComponent] Data source name set to:', this.dataSourceName);
      
      // Calculate proper chart dimensions that maintain aspect ratio
      const { width: chartWidth, height: chartHeight } = this.calculateChartDimensions();
      
      console.log('[VegaChartComponent] Chart dimensions:', { chartWidth, chartHeight });
      
      // set Width to container
      finalSpec.width = 'container';
      
      // Ensure the spec has proper sizing for responsive behavior
      if (finalSpec.height) {
        delete finalSpec.height;
      }
      
      // Embed the chart with responsive sizing
      const result = await embed(this.chartContainer.nativeElement, finalSpec, {
        actions: false,
        theme: this.theme,
      });

      this.view = result.view;
      
      // Update data if provided (but only if we have a valid data source name)
      if (this.data && this.data.length > 0 && this.dataSourceName) {
        console.log('[VegaChartComponent] Updating data with source name:', this.dataSourceName);
        this.updateData();
      } else if (this.data && this.data.length > 0) {
        console.warn('[VegaChartComponent] Data provided but no data source name set, skipping update');
      }
      
      console.log('[VegaChartComponent] Chart rendered successfully');
    } catch (error: any) {
      console.error('[VegaChartComponent] Error rendering Vega chart:', error);
      console.error('[VegaChartComponent] Error details:', {
        spec: this.spec,
        data: this.data,
        dataSourceName: this.dataSourceName,
        error: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace'
      });
      
      // Show error message in the container
      if (this.chartContainer) {
        this.chartContainer.nativeElement.innerHTML = `
          <div style="color: red; padding: 20px; text-align: center; border: 1px solid red; border-radius: 4px;">
            <h4>Chart Rendering Error</h4>
            <p>${error?.message || 'Unknown error'}</p>
            <details>
              <summary>Technical Details</summary>
              <pre style="text-align: left; font-size: 12px;">${error?.stack || 'No stack trace'}</pre>
            </details>
          </div>
        `;
      }
    }
  }

  private async prepareSpec(): Promise<any> {
    let spec = { ...this.spec };
    let isVegaLite = false;
    
    // Check if it's a Vega-Lite spec
    if (spec.$schema && spec.$schema.includes('vega-lite')) {
      isVegaLite = true;
      console.log('[VegaChartComponent] Processing Vega-Lite specification');
    } else if (spec.mark && spec.encoding) {
      // If it has mark and encoding but no $schema, it's likely Vega-Lite
      isVegaLite = true;
      spec.$schema = 'https://vega.github.io/schema/vega-lite/v5.json';
      console.log('[VegaChartComponent] Detected Vega-Lite spec without $schema, added it');
    } else {
      console.log('[VegaChartComponent] Processing Vega specification');
    }
    
    // Only modify data if explicitly provided via the data input
    if (this.data && this.data.length > 0) {
      console.log('[VegaChartComponent] Using provided data:', this.data);
      
      if (isVegaLite) {
        // For Vega-Lite, replace the data with provided data
        spec.data = {
          values: this.data
        };
        this.dataSourceName = 'data';
        console.log('[VegaChartComponent] Updated Vega-Lite data:', spec.data);
      } else {
        // For Vega, use named datasets
        if (!spec.data) {
          spec.data = [];
        } else if (!Array.isArray(spec.data)) {
          spec.data = [spec.data];
        }
        
        // Find or create main data source
        let mainDataSource: any = spec.data.find((d: any) => d && d.name === 'table') || 
                                 spec.data.find((d: any) => d && d.name === 'data') || 
                                 spec.data.find((d: any) => d && d.name === 'source') || 
                                 { name: 'table' };
        
        mainDataSource.values = this.data;
        this.dataSourceName = mainDataSource.name || 'table';
        
        // Update or add the data source
        const existingIndex = spec.data.findIndex((d: any) => d && d.name === mainDataSource.name);
        if (existingIndex >= 0) {
          spec.data[existingIndex] = mainDataSource;
        } else {
          spec.data.unshift(mainDataSource);
        }
        
        console.log('[VegaChartComponent] Updated Vega data source:', mainDataSource);
      }
    } else {
      // No explicit data provided, preserve the original spec structure
      console.log('[VegaChartComponent] No explicit data provided, preserving original spec structure');
      
      if (isVegaLite) {
        // For Vega-Lite, ensure data is properly structured if it exists
        if (spec.data && !spec.data.values && !Array.isArray(spec.data)) {
          spec.data = {
            values: [spec.data]
          };
        } else if (Array.isArray(spec.data)) {
          spec.data = {
            values: spec.data
          };
        }
      } else {
        // For Vega, ensure data is an array
        if (spec.data && !Array.isArray(spec.data)) {
          spec.data = [spec.data];
        }
      }
    }
    
    // Don't convert Vega-Lite to Vega - let vega-embed handle it directly
    // This preserves the original Vega-Lite specification structure
    console.log('[VegaChartComponent] Final spec prepared:', spec);
    return spec;
  }

  private updateData() {
    if (this.view && this.data) {
      // Try to find the correct data source name
      const dataSourceNames = this.view.data();
      console.log('[VegaChartComponent] Available data sources:', dataSourceNames);
      console.log('[VegaChartComponent] Expected data source name:', this.dataSourceName);
      
      let dataSource = null;
      
      // First try the data source name we used during preparation
      if (this.dataSourceName) {
        try {
          dataSource = this.view.data(this.dataSourceName);
          if (dataSource) {
            console.log('[VegaChartComponent] Found expected data source:', this.dataSourceName);
          }
        } catch (error) {
          console.log('[VegaChartComponent] Expected data source not found:', this.dataSourceName);
        }
      } else {
        console.warn('[VegaChartComponent] No data source name set, trying fallback options');
      }
      
      // If not found, try common data source names
      if (!dataSource) {
        const possibleNames = ['table', 'data', 'source', 'values'];
        for (const name of possibleNames) {
          try {
            dataSource = this.view.data(name);
            if (dataSource) {
              console.log('[VegaChartComponent] Found data source:', name);
              // Update our stored data source name for future updates
              this.dataSourceName = name;
              break;
            }
          } catch (error) {
            console.log('[VegaChartComponent] Data source not found:', name);
          }
        }
      }
      
      // If no common names found, try the first available data source
      if (!dataSource && dataSourceNames.length > 0) {
        try {
          const firstDataSourceName = dataSourceNames[0];
          dataSource = this.view.data(firstDataSourceName);
          console.log('[VegaChartComponent] Using first available data source:', firstDataSourceName);
          // Update our stored data source name for future updates
          this.dataSourceName = firstDataSourceName;
        } catch (error) {
          console.error('[VegaChartComponent] Error accessing data source:', dataSourceNames[0], error);
        }
      }
      
      if (dataSource) {
        try {
          dataSource.remove(() => true);
          dataSource.insert(this.data);
          console.log('[VegaChartComponent] Data updated successfully');
        } catch (error) {
          console.error('[VegaChartComponent] Error updating data:', error);
        }
      } else {
        console.warn('[VegaChartComponent] No suitable data source found for updating');
      }
    }
  }

  // Public method to update chart data
  public updateChartData(newData: any[]) {
    this.data = newData;
    this.updateData();
  }

  // Public method to resize chart
  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.renderChart();
  }

  // Public method to set data source name
  public setDataSourceName(name: string) {
    this.dataSourceName = name;
    console.log('[VegaChartComponent] Data source name set to:', name);
  }

  // Public method to get current data source name
  public getDataSourceName(): string {
    return this.dataSourceName;
  }

  private calculateChartDimensions(): { width: number; height: number } {
    if (!this.chartContainer) {
      return { width: this.width, height: this.height };
    }

    const containerWidth = this.chartContainer.nativeElement.offsetWidth;
    const containerHeight = this.height || 400;
    
    // Calculate aspect ratio from original spec if available
    let aspectRatio = 4/3; // Default aspect ratio
    if (this.spec && this.spec.width && this.spec.height) {
      aspectRatio = this.spec.width / this.spec.height;
    }
    
    // Calculate height based on width and aspect ratio
    const calculatedHeight = containerWidth / aspectRatio;
    
    // Use the smaller of calculated height or container height
    const finalHeight = Math.min(calculatedHeight, containerHeight);
    
    console.log('[VegaChartComponent] Calculated dimensions:', {
      containerWidth,
      containerHeight,
      aspectRatio,
      calculatedHeight,
      finalHeight
    });
    
    return { width: containerWidth, height: finalHeight };
  }
} 