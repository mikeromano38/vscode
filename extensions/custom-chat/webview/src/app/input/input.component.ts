import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-input',
  template: `
    <div class="input-container">
      <!-- Context Section -->
      <div class="context-section" *ngIf="contextItems.length > 0">
        <div class="context-pills">
          <div class="context-pill" *ngFor="let item of contextItems">
            <span class="pill-icon">&#64;</span>
            <span class="pill-text">{{ item.name }}</span>
            <button class="pill-remove" (click)="removeContextItem(item)">×</button>
          </div>
        </div>
      </div>
      
      <!-- Main Input Area -->
      <div class="input-main">
        <textarea 
          #messageInput
          class="input-field" 
          [placeholder]="placeholder"
          [disabled]="isProcessing"
          [(ngModel)]="messageText"
          (keydown)="onKeyDown($event)"
          rows="1">
        </textarea>
        
        <!-- Input Controls -->
        <div class="input-controls">
          <div class="mode-selector">
            <button class="mode-btn" [class.active]="selectedMode === 'ask'" (click)="selectMode('ask')">
              Ask
            </button>
            <button class="mode-btn" [class.active]="selectedMode === 'agent'" (click)="selectMode('agent')">
              Agent
            </button>
          </div>
          
          <button 
            class="send-btn" 
            [disabled]="isProcessing || !messageText.trim()"
            (click)="sendMessage()"
            [title]="isProcessing ? 'Sending...' : 'Send message'">
            <svg class="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .input-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 8px;
      padding: 12px;
    }

    .context-section {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      min-height: 24px;
    }

    .context-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .context-pill {
      display: flex;
      align-items: center;
      gap: 4px;
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border-radius: 12px;
      padding: 4px 8px;
      font-size: 12px;
      border: none;
      cursor: default;
    }

    .pill-icon {
      font-weight: bold;
      color: var(--vscode-focusBorder);
    }

    .pill-text {
      font-size: 11px;
    }

    .pill-remove {
      background: none;
      border: none;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      font-size: 14px;
      padding: 0;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    }

    .pill-remove:hover {
      background-color: var(--vscode-input-border);
    }

    .input-main {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .input-field {
      flex: 1;
      min-height: 20px;
      max-height: 120px;
      resize: none;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      background-color: transparent;
      color: var(--vscode-input-foreground);
      font-family: var(--vscode-font-family);
      font-size: 14px;
      outline: none;
      line-height: 1.4;
    }

    .input-field:focus {
      outline: none;
    }

    .input-field:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .input-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mode-selector {
      display: flex;
      background-color: var(--vscode-editor-background);
      border-radius: 6px;
      padding: 2px;
      border: 1px solid var(--vscode-input-border);
    }

    .mode-btn {
      background: none;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .mode-btn.active {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .mode-btn:hover:not(.active) {
      background-color: var(--vscode-input-border);
      color: var(--vscode-foreground);
    }

    .send-btn {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .send-btn:hover:not(:disabled) {
      background-color: var(--vscode-button-hoverBackground);
      transform: scale(1.05);
    }

    .send-btn:disabled {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      cursor: not-allowed;
      transform: none;
    }

    .send-icon {
      width: 16px;
      height: 16px;
    }

    /* Responsive adjustments */
    @media (max-width: 400px) {
      .input-container {
        padding: 8px;
        gap: 6px;
      }
      
      .input-controls {
        gap: 6px;
      }
      
      .mode-btn {
        padding: 3px 6px;
        font-size: 10px;
      }
      
      .send-btn {
        width: 28px;
        height: 28px;
      }
      
      .send-icon {
        width: 14px;
        height: 14px;
      }
    }
  `]
})
export class InputComponent {
  @Input() isProcessing = false;
  @Output() sendMessageEvent = new EventEmitter<string>();
  @Output() modeChangeEvent = new EventEmitter<string>();
  
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  
  messageText = '';
  placeholder = 'Ask a question about the open tables...';
  selectedMode: 'ask' | 'agent' = 'ask';
  contextItems: Array<{id: string, name: string, type: 'file' | 'table'}> = [];

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  selectMode(mode: 'ask' | 'agent') {
    this.selectedMode = mode;
    this.modeChangeEvent.emit(mode);
  }

  addContextItem(item: {id: string, name: string, type: 'file' | 'table'}) {
    // Check if item already exists
    if (!this.contextItems.find(existing => existing.id === item.id)) {
      this.contextItems.push(item);
    }
  }

  // Public method to add context items from external components
  public addContextFromExternal(item: {id: string, name: string, type: 'file' | 'table'}) {
    this.addContextItem(item);
  }

  removeContextItem(item: {id: string, name: string, type: 'file' | 'table'}) {
    this.contextItems = this.contextItems.filter(existing => existing.id !== item.id);
  }

  sendMessage() {
    const text = this.messageText.trim();
    if (text && !this.isProcessing) {
      // Include context items in the message if any
      const contextInfo = this.contextItems.length > 0 
        ? `\n\nContext: ${this.contextItems.map(item => `@${item.name}`).join(', ')}`
        : '';
      
      const fullMessage = {
        text: text + contextInfo,
        mode: this.selectedMode,
        context: this.contextItems
      };
      
      this.sendMessageEvent.emit(JSON.stringify(fullMessage));
      this.messageText = '';
      this.contextItems = []; // Clear context after sending
      this.focusInput();
    }
  }

  focusInput() {
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }
} 