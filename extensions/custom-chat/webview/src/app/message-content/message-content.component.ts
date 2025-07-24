import { Component, Input } from '@angular/core';
import { MessageContentType } from '../../types/responseTypes';

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
                <tr *ngFor="let row of data.data.rows">
                  <td *ngFor="let cell of row">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
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
          <div class="vega-config">
            <pre><code class="json">{{ formatJson(data.vegaConfig) }}</code></pre>
          </div>
          <div class="chart-placeholder">
            <p><em>Chart visualization would be displayed here in a full implementation.</em></p>
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

    .chart-placeholder {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 20px;
      border-radius: 4px;
      text-align: center;
      margin: 10px 0;
      border: 1px dashed var(--vscode-input-border);
    }

    .chart-placeholder p {
      margin: 0;
      color: var(--vscode-descriptionForeground);
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
  `]
})
export class MessageContentComponent {
  @Input() type!: MessageContentType;
  @Input() data!: any;

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
} 