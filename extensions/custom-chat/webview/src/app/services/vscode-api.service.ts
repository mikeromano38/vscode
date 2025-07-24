import { Injectable } from '@angular/core';

declare function acquireVsCodeApi(): any;

@Injectable({
  providedIn: 'root'
})
export class VscodeApiService {
  private vscode: any = null;
  private initialized = false;

  constructor() {
    this.initializeVscodeApi();
  }

  private initializeVscodeApi() {
    if (this.initialized) {
      return;
    }

    try {
      this.vscode = acquireVsCodeApi();
      this.initialized = true;
      console.log('VS Code API acquired successfully in service');
    } catch (error) {
      console.error('Failed to acquire VS Code API in service:', error);
      this.vscode = null;
    }
  }

  getVscodeApi(): any {
    return this.vscode;
  }

  postMessage(message: any): void {
    if (!this.vscode) {
      console.error('VS Code API not available');
      return;
    }
    this.vscode.postMessage(message);
  }

  isAvailable(): boolean {
    return this.vscode !== null;
  }
} 