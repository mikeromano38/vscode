import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-input',
  template: `
    <div class="input-container">
      <textarea 
        #messageInput
        class="input-field" 
        [placeholder]="placeholder"
        [disabled]="isProcessing"
        [(ngModel)]="messageText"
        (keydown)="onKeyDown($event)"
        rows="3">
      </textarea>
      <button 
        class="send-btn" 
        [disabled]="isProcessing || !messageText.trim()"
        (click)="sendMessage()">
        {{ isProcessing ? 'Sending...' : 'Send' }}
      </button>
    </div>
  `,
  styles: [`
    .input-container {
      display: flex;
      gap: 10px;
      align-items: flex-end;
    }

    .input-field {
      flex: 1;
      min-height: 60px;
      max-height: 200px;
      resize: vertical;
      padding: 10px;
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      outline: none;
    }

    .input-field:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }

    .input-field:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .send-btn {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      height: 60px;
      transition: background-color 0.2s ease;
    }

    .send-btn:hover:not(:disabled) {
      background-color: var(--vscode-button-hoverBackground);
    }

    .send-btn:disabled {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      cursor: not-allowed;
    }
  `]
})
export class InputComponent {
  @Input() isProcessing = false;
  @Output() sendMessageEvent = new EventEmitter<string>();
  
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  
  messageText = '';
  placeholder = 'Ask DataVibe about your data...';

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const text = this.messageText.trim();
    if (text && !this.isProcessing) {
      this.sendMessageEvent.emit(text);
      this.messageText = '';
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