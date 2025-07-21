// Built by Google
import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

declare const acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [NgFor, NgIf]
})
export class AppComponent implements OnInit {
  csvString: string = '';
  csvRows: string[][] = [];

  // Pagination properties
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
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'csvData') {
        this.csvString = message.csv;
        this.csvRows = this.parseCSV(this.csvString);
        this.currentPage = 0; // Reset to first page on new data
      }
    });

    vscode.postMessage({ type: 'ready' });
  }

  parseCSV(text: string): string[][] {
    return text.split('\n').map(row => row.split(','));
  }
}
