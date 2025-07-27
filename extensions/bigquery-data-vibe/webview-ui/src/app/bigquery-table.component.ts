import { Component, OnInit, Input } from '@angular/core';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';

declare const acquireVsCodeApi: any;

export interface BigQueryTableMetadata {
  tableId: string;
  friendlyName?: string;
  description?: string;
  type: 'TABLE' | 'VIEW';
  creationTime?: string;
  lastModifiedTime?: string;
  expirationTime?: string;
  location?: string;
  defaultCollation?: string;
  defaultRoundingMode?: string;
  caseInsensitive?: boolean;
  labels?: { [key: string]: string };
  primaryKeys?: string[];
  schema?: any;
  numBytes?: string;
  numLongTermBytes?: string;
  numRows?: string;
  timePartitioning?: any;
  clustering?: any;
  encryptionConfiguration?: any;
  projectId?: string;
  datasetId?: string;
}

@Component({
  selector: 'app-bigquery-table',
  templateUrl: './bigquery-table.component.html',
  styleUrls: ['./bigquery-table.component.css'],
  imports: [NgFor, NgIf, DecimalPipe]
})
export class BigQueryTableComponent implements OnInit {
  @Input() metadata: BigQueryTableMetadata | null = null;
  loading = true;
  error: string | null = null;
  selectedTab: 'details' | 'schema' | 'data' = 'schema'; // Default to schema tab
  private vscode: any;

  // Data preview properties
  dataRows: any[] = [];
  dataColumns: string[] = [];
  dataLoading = false;
  dataError: string | null = null;

  // Helper methods for template
  Object = Object;
  parseInt = parseInt;

  ngOnInit() {
    // Use the globally available VS Code API instead of acquiring it
    this.vscode = (window as any).vscode;

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'tableMetadata') {
        this.metadata = message.metadata;
        this.loading = false;
      } else if (message.type === 'tableError') {
        this.error = message.error;
        this.loading = false;
      } else if (message.type === 'tableData') {
        this.dataRows = message.rows || [];
        this.dataColumns = message.columns || [];
        this.dataLoading = false;
      } else if (message.type === 'tableDataError') {
        this.dataError = message.error;
        this.dataLoading = false;
      }
    });

    // Send ready message if VS Code API is available
    if (this.vscode) {
      this.vscode.postMessage({ type: 'ready' });
    } else {
      console.error('VS Code API not available');
      this.error = 'VS Code API not available';
      this.loading = false;
    }
  }

  selectTab(tab: 'details' | 'schema' | 'data') {
    this.selectedTab = tab;
    
    // Load data when switching to data tab
    if (tab === 'data' && this.metadata && this.dataRows.length === 0 && !this.dataLoading) {
      this.loadTableData();
    }
  }

  formatDate(timestamp: string | undefined): string {
    if (!timestamp) return 'Not set';
    return new Date(parseInt(timestamp)).toLocaleString();
  }

  formatBytes(bytes: string | undefined): string {
    if (!bytes) return 'Unknown';
    const numBytes = parseInt(bytes);
    if (numBytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatLabels(labels: { [key: string]: string } | undefined): string {
    if (!labels || Object.keys(labels).length === 0) return 'None';
    return Object.entries(labels).map(([k, v]) => `${k}: ${v}`).join(', ');
  }

  get displayName(): string {
    return this.metadata?.friendlyName || this.metadata?.tableId || 'Unknown Table';
  }

  get hasSchema(): boolean {
    return !!(this.metadata?.schema?.fields && this.metadata.schema.fields.length > 0);
  }

  get fullyQualifiedName(): string {
    if (!this.metadata) return 'Unknown Table';
    return `${this.metadata.projectId}.${this.metadata.datasetId}.${this.metadata.tableId}`;
  }

  private loadTableData() {
    if (!this.metadata || !this.vscode) return;
    
    this.dataLoading = true;
    this.dataError = null;
    
    this.vscode.postMessage({
      type: 'fetchTableData',
      projectId: this.metadata.projectId,
      datasetId: this.metadata.datasetId,
      tableId: this.metadata.tableId
    });
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }


} 