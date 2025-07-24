import { Component } from '@angular/core';
import { VscodeApiService } from '../services/vscode-api.service';

@Component({
  selector: 'app-header',
  template: `
    <div class="header">
      <div class="title">
        <span class="icon">📊</span>
        DataVibe
      </div>
      <div class="controls">
        <button class="btn btn-secondary" (click)="configureProject()">
          <span class="icon">⚙️</span>
          Configure Project
        </button>
        <button class="btn btn-secondary" (click)="testExtension()">
          <span class="icon">🧪</span>
          Test Extension
        </button>
      </div>
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid var(--vscode-panel-border);
      background-color: var(--vscode-editor-background);
    }

    .title {
      font-size: 1.5em;
      font-weight: bold;
      color: var(--vscode-editor-foreground);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title .icon {
      font-size: 1.2em;
    }

    .controls {
      display: flex;
      gap: 10px;
    }

    .btn {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background-color 0.2s ease;
    }

    .btn:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .btn-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn-secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .icon {
      font-size: 14px;
    }
  `]
})
export class HeaderComponent {
  constructor(private vscodeApiService: VscodeApiService) {}

  configureProject() {
    if (!this.vscodeApiService.isAvailable()) {
      console.error('VS Code API not available');
      return;
    }
    this.vscodeApiService.postMessage({
      command: 'configureProject'
    });
  }

  testExtension() {
    console.log('Test extension button clicked');
    if (!this.vscodeApiService.isAvailable()) {
      console.error('VS Code API not available');
      return;
    }
    this.vscodeApiService.postMessage({
      command: 'testExtension'
    });
    console.log('Test extension message sent');
  }
} 