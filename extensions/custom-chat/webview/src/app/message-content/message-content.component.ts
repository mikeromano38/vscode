import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { MessageContentType } from '../../types/responseTypes';
import { VegaChartService, ChartData } from '../services/vega-chart.service';
import { VscodeApiService } from '../services/vscode-api.service';

@Component({
  selector: 'app-message-content',
  template: `
    <div class="message-content" [ngSwitch]="type">
      
      <!-- Text Content -->
      <div *ngSwitchCase="'text'" class="text-content">
        <div [innerHTML]="formatMarkdown(data.content)"></div>
      </div>

      <!-- Schema Content -->
      <div *ngSwitchCase="'schema'" class="schema-content">
        <div *ngIf="data.question" class="question">
          <h3>Question</h3>
          <p>{{ data.question }}</p>
        </div>
        
        <div *ngIf="data.datasources" class="datasources">
          <h3>Schema Resolved</h3>
          <div *ngFor="let datasource of data.datasources" class="datasource">
            <h4>{{ datasource.name }}</h4>
            <div *ngIf="datasource.schema" class="schema-table">
              <table>
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let field of datasource.schema.fields">
                    <td>{{ field.name }}</td>
                    <td>{{ field.type }}</td>
                    <td>{{ field.description }}</td>
                    <td>{{ field.mode }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Content -->
      <div *ngSwitchCase="'data'" class="data-content">
        <div *ngIf="data.bigQueryJob" class="bigquery-job-info">
          <h3>🔄 Running Query</h3>
          <p><strong>Job ID:</strong> {{ data.bigQueryJob.id }}</p>
          <div *ngIf="data.bigQueryJob.destinationTable" class="destination-table">
            <strong>Destination Table:</strong>
            <p>{{ data.bigQueryJob.destinationTable.projectId }}.{{ data.bigQueryJob.destinationTable.datasetId }}.{{ data.bigQueryJob.destinationTable.tableId }}</p>
          </div>
        </div>

        <div *ngIf="data.query" class="query-info">
          <h3>Retrieval Query</h3>
          <p><strong>Query name:</strong> {{ data.query.name }}</p>
          <p><strong>Question:</strong> {{ data.query.question }}</p>
          <div *ngIf="data.query.datasources" class="datasources">
            <strong>Data sources:</strong>
            <ul>
              <li *ngFor="let ds of data.query.datasources">{{ ds.name }}</li>
            </ul>
          </div>
        </div>

        <div *ngIf="data.generatedSql" class="sql-content">
          <h3>SQL Generated</h3>
          <div class="sql-header">
            <button class="open-sql-button" (click)="openSqlInEditor(data.generatedSql)">
              📄 Open in SQL Editor
            </button>
          </div>
          <pre><code class="sql">{{ data.generatedSql }}</code></pre>
        </div>

        <div *ngIf="data.data" class="data-table">
          <h3>Data Retrieved</h3>
          <div *ngIf="data.data.error" class="error">
            {{ data.data.error }}
          </div>
          <div *ngIf="!data.data.error && data.data.columns" class="table-container">
            <table>
              <thead>
                <tr>
                  <th *ngFor="let column of data.data.columns">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of getDisplayRows()">
                  <td *ngFor="let cell of row">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
            
            <!-- Truncation message -->
            <div *ngIf="!showFullTable && totalRows > MAX_ROWS_DISPLAY" class="truncation-message">
              <p>
                Showing {{ MAX_ROWS_DISPLAY }} of {{ totalRows }} rows. 
                <a href="#" (click)="showFullResults($event)" class="view-full-link">
                  Click here to view all {{ totalRows }} rows
                </a>
              </p>
            </div>
            
            <!-- Show less link -->
            <div *ngIf="showFullTable && totalRows > MAX_ROWS_DISPLAY" class="truncation-message">
              <p>
                <a href="#" (click)="showLimitedResults($event)" class="view-full-link">
                  Click here to show only first {{ MAX_ROWS_DISPLAY }} rows
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart Content -->
      <div *ngSwitchCase="'chart'" class="chart-content">
        <div *ngIf="data.instructions" class="instructions">
          <h3>Chart Instructions</h3>
          <p>{{ data.instructions }}</p>
        </div>
        
        <div *ngIf="data.vegaConfig" class="chart-container">
          <h3>Chart Generated</h3>
          
          <!-- Show JSON config in collapsible section for debugging -->
          <details class="vega-config-details">
            <summary>View Vega-Lite Specification</summary>
            <div class="vega-config">
              <pre><code class="json">{{ formatJson(data.vegaConfig) }}</code></pre>
            </div>
          </details>
          
          <!-- Render the chart using our VegaChartComponent -->
          <div class="chart-visualization">
            <app-vega-chart 
              [spec]="chartSpec" 
              [data]="chartData"
              [width]="800"
              [height]="500"
              [theme]="undefined">
            </app-vega-chart>
          </div>
        </div>
      </div>

      <!-- Visualization Content -->
      <div *ngSwitchCase="'visualization'" class="visualization-content">
        <div *ngIf="data.title" class="visualization-title">
          <h3>{{ data.title }}</h3>
        </div>
        
        <div *ngIf="data.description" class="visualization-description">
          <p>{{ data.description }}</p>
        </div>
        
        <div *ngIf="data.vegaLiteSpec" class="visualization-container">
          <!-- Show JSON spec in collapsible section for debugging -->
          <details class="vega-config-details">
            <summary>View Vega-Lite Specification</summary>
            <div class="vega-config">
              <pre><code class="json">{{ formatJson(data.vegaLiteSpec) }}</code></pre>
            </div>
          </details>
          
          <!-- Render the visualization using our VegaChartComponent -->
          <div class="chart-visualization">
            <app-vega-chart 
              [spec]="chartSpec" 
              [data]="chartData"
              [width]="800"
              [height]="500"
              [theme]="undefined">
            </app-vega-chart>
          </div>
        </div>
      </div>

      <!-- Error Content -->
      <div *ngSwitchCase="'error'" class="error-content">
        <div class="error-message">
          <h3>Error</h3>
          <p><strong>Code:</strong> {{ data.code }}</p>
          <p><strong>Message:</strong> {{ data.message }}</p>
        </div>
      </div>

      <!-- Code Content -->
      <div *ngSwitchCase="'code'" class="code-content">
        <pre><code [class]="data.language">{{ data.code }}</code></pre>
      </div>

      <!-- Markdown Content -->
      <div *ngSwitchCase="'markdown'" class="markdown-content">
        <div [innerHTML]="formatMarkdown(data.content)"></div>
      </div>

      <!-- Default fallback -->
      <div *ngSwitchDefault class="unknown-content">
        <pre>{{ formatJson(data) }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .message-content {
      margin: 10px 0;
    }

    .text-content, .markdown-content {
      line-height: 1.6;
    }

    .text-content p, .markdown-content p {
      margin: 8px 0;
    }

    .text-content h1, .text-content h2, .text-content h3, .text-content h4,
    .markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4 {
      margin: 16px 0 8px 0;
      color: var(--vscode-editor-foreground);
    }

    .text-content code, .markdown-content code {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 2px 4px;
      border-radius: 2px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }

    .text-content pre, .markdown-content pre {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 10px 0;
    }

    .text-content pre code, .markdown-content pre code {
      background: none;
      padding: 0;
    }

    .schema-content h3, .data-content h3, .chart-content h3 {
      color: var(--vscode-editor-foreground);
      margin: 16px 0 8px 0;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 4px;
    }

    .schema-content h4, .data-content h4 {
      color: var(--vscode-editor-foreground);
      margin: 12px 0 6px 0;
    }

    .schema-table table, .data-table table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
    }

    .schema-table th, .schema-table td,
    .data-table th, .data-table td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid var(--vscode-input-border);
    }

    .schema-table th, .data-table th {
      background-color: var(--vscode-textBlockQuote-background);
      font-weight: bold;
    }

    .sql-content pre, .code-content pre, .vega-config pre {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 10px 0;
      border: 1px solid var(--vscode-input-border);
    }

    .sql-content code, .code-content code, .vega-config code {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.4;
    }

    .error-content {
      background-color: var(--vscode-errorBackground);
      color: var(--vscode-errorForeground);
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid var(--vscode-errorForeground);
    }

    .error-content h3 {
      margin: 0 0 8px 0;
      color: var(--vscode-errorForeground);
    }

    .error-content p {
      margin: 4px 0;
    }

    .chart-visualization {
      margin: 10px 0;
      padding: 10px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      min-height: 200px;
      max-width: 100%;
      overflow: hidden;
      width: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .chart-error {
      color: var(--vscode-errorForeground);
      text-align: center;
      padding: 20px;
      background-color: var(--vscode-errorBackground);
      border-radius: 4px;
    }

    .table-container {
      overflow-x: auto;
      max-width: 100%;
    }

    .unknown-content pre {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }

    .question {
      margin-bottom: 16px;
    }

    .question h3 {
      margin: 0 0 8px 0;
    }

    .datasources {
      margin-top: 16px;
    }

    .datasource {
      margin-bottom: 20px;
    }

    .query-info {
      margin-bottom: 16px;
    }

    .query-info p {
      margin: 4px 0;
    }

    .query-info ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    .query-info li {
      margin: 2px 0;
    }

    .instructions {
      margin-bottom: 16px;
    }

    .instructions h3 {
      margin: 0 0 8px 0;
    }

    .vega-config-details {
      margin: 10px 0;
    }

    .vega-config-details summary {
      cursor: pointer;
      padding: 8px;
      background-color: var(--vscode-textBlockQuote-background);
      border-radius: 4px;
      font-weight: bold;
      color: var(--vscode-editor-foreground);
    }

    .vega-config-details summary:hover {
      background-color: var(--vscode-input-background);
    }

    .vega-config-details[open] summary {
      border-bottom: 1px solid var(--vscode-input-border);
      border-radius: 4px 4px 0 0;
    }

    .vega-config-details .vega-config {
      border-radius: 0 0 4px 4px;
      margin-top: 0;
    }

    .visualization-content h3 {
      color: var(--vscode-editor-foreground);
      margin: 16px 0 8px 0;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 4px;
    }

    .visualization-description {
      margin-bottom: 16px;
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }

    .visualization-container {
      margin-top: 16px;
    }

    .truncation-message {
      margin-top: 10px;
      padding: 8px 12px;
      background-color: var(--vscode-textBlockQuote-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-size: 13px;
      color: var(--vscode-descriptionForeground);
      text-align: center;
    }

    .truncation-message p {
      margin: 0;
    }

    .view-full-link {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      font-weight: 500;
    }

    .view-full-link:hover {
      text-decoration: underline;
      color: var(--vscode-textLink-activeForeground);
    }

    .bigquery-job-info {
      background-color: var(--vscode-textBlockQuote-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
    }

    .bigquery-job-info h3 {
      margin: 0 0 8px 0;
      color: var(--vscode-editor-foreground);
      font-size: 14px;
    }

    .bigquery-job-info p {
      margin: 4px 0;
      font-size: 13px;
    }

    .destination-table {
      margin-top: 8px;
    }

    .destination-table p {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      background-color: var(--vscode-input-background);
      padding: 4px 8px;
      border-radius: 2px;
      margin: 4px 0;
    }

    .sql-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
    }

    .open-sql-button {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: 1px solid var(--vscode-button-border);
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .open-sql-button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .open-sql-button:active {
      background-color: var(--vscode-button-activeBackground);
    }
  `]
})
export class MessageContentComponent implements OnInit, AfterViewInit {
  @Input() type!: MessageContentType;
  @Input() data!: any;
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  chartSpec: any;
  chartData: ChartData[] = [];
  
  // Table display properties
  readonly MAX_ROWS_DISPLAY = 20;
  showFullTable = false;
  truncatedRows: any[] = [];
  totalRows = 0;

  constructor(private vscodeApiService: VscodeApiService) {}

  async ngOnInit() {
    // Initialize chart data when component loads
    if ((this.type === 'chart' && this.data?.vegaConfig) || 
        (this.type === 'visualization' && this.data?.vegaLiteSpec)) {
      this.initializeChart();
    }
    
    // Initialize table display properties for data content
    if (this.type === 'data' && this.data?.data?.rows) {
      this.totalRows = this.data.data.rows.length;
      this.showFullTable = false;
    }
  }

  ngAfterViewInit() {
    // Chart will be rendered by the VegaChartComponent
  }

  ngOnChanges() {
    // Update table display properties when data changes
    if (this.type === 'data' && this.data?.data?.rows) {
      this.totalRows = this.data.data.rows.length;
      // Reset to limited view when data changes
      this.showFullTable = false;
    }
  }

  private initializeChart() {
    try {
      // Handle both chart and visualization types
      let spec: any;
      if (this.type === 'chart' && this.data?.vegaConfig) {
        spec = this.data.vegaConfig;
      } else if (this.type === 'visualization' && this.data?.vegaLiteSpec) {
        spec = this.data.vegaLiteSpec;
      } else {
        console.warn('[MessageContentComponent] No valid chart specification found');
        return;
      }

      // Use the spec as-is - don't extract data separately
      // The Vega-Lite spec already contains the data in the correct format
      this.chartSpec = spec;
      
      // Don't extract data - let the VegaChartComponent handle the spec directly
      this.chartData = [];
      
      console.log('[MessageContentComponent] Chart initialized:', {
        type: this.type,
        spec: this.chartSpec,
        hasDataInSpec: !!(spec.data && spec.data.values)
      });
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }

  formatMarkdown(text: string): string {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>');
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  getDisplayRows(): any[] {
    if (!this.data?.data?.rows) {
      return [];
    }
    
    if (this.showFullTable) {
      return this.data.data.rows;
    } else {
      return this.data.data.rows.slice(0, this.MAX_ROWS_DISPLAY);
    }
  }

  showFullResults(event: Event) {
    event.preventDefault();
    this.showFullTable = true;
  }

  showLimitedResults(event: Event) {
    event.preventDefault();
    this.showFullTable = false;
  }

  openSqlInEditor(sql: string) {
    console.log('=== openSqlInEditor called ===');
    console.log('SQL:', sql);
    console.log('VS Code API available:', this.vscodeApiService.isAvailable());
    
    // Send message to the extension to open SQL in editor
    if (this.vscodeApiService.isAvailable()) {
      const message = {
        command: 'openSqlInEditor',
        sql: sql
      };
      console.log('Sending message to extension:', message);
      this.vscodeApiService.postMessage(message);
    } else {
      console.error('VS Code API not available');
    }
  }
} 