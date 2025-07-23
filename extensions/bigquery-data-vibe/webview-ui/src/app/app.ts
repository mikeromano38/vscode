// Built by Google
import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { BigQueryTableComponent, BigQueryTableMetadata } from './bigquery-table.component';

declare const acquireVsCodeApi: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [NgFor, NgIf, BigQueryTableComponent]
})
export class AppComponent implements OnInit {
  csvString: string = '';
  csvRows: string[][] = [];
  tableMetadata: BigQueryTableMetadata | null = null;
  viewType: 'csv' | 'bigquery-table' = 'csv';
  loading = true;
  error: string | null = null;
  private vscode: any;

  // Pagination properties for CSV
  pageSize: number = 100;
  currentPage: number = 0;

  get pagedRows(): string[][] {
    // Exclude header row for pagination
    if (this.csvRows.length <= 1) { return []; }
    const start = 1 + this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.csvRows.slice(start, end);
  }

  get totalPages(): number {
    if (this.csvRows.length <= 1) { return 1; }
    return Math.ceil((this.csvRows.length - 1) / this.pageSize);
  }

  get hasPrevPage(): boolean {
    return this.currentPage > 0;
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  goToPrevPage() {
    if (this.hasPrevPage) { this.currentPage--; }
  }

  goToNextPage() {
    if (this.hasNextPage) { this.currentPage++; }
  }

  ngOnInit() {
    // Safely acquire VS Code API once and make it globally available
    try {
      this.vscode = acquireVsCodeApi();
      // Make it globally available to prevent other components from trying to acquire it
      (window as any).vscode = this.vscode;
    } catch (error) {
      console.warn('VS Code API already acquired or not available:', error);
      // Try to get existing instance
      this.vscode = (window as any).vscode;
    }

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'csvData') {
        this.viewType = 'csv';
        this.csvString = message.csv;
        this.csvRows = this.parseCSV(this.csvString);
        this.currentPage = 0; // Reset to first page on new data
        this.loading = false;
      } else if (message.type === 'tableMetadata') {
        this.viewType = 'bigquery-table';
        this.tableMetadata = message.metadata;
        this.loading = false;
      } else if (message.type === 'tableError') {
        this.viewType = 'bigquery-table';
        this.error = message.error;
        this.loading = false;
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

  parseCSV(text: string): string[][] {
    return text.split('\n').map(row => row.split(','));
  }
}
