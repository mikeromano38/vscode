import { Component, Input } from '@angular/core';
import { ChatMessage } from '../chat/chat.component';

@Component({
  selector: 'app-message',
  template: `
    <div class="message" [ngClass]="message.type" [class.streaming]="message.isStreaming">
      <!-- User messages and simple text -->
      <div *ngIf="message.type === 'user' || (!message.responses && message.text)" 
           class="message-content" [innerHTML]="formatMessage(message.text)"></div>
      
      <!-- Streaming responses -->
      <div *ngIf="message.responses && message.responses.length > 0" class="responses-container">
        <app-message-content 
          *ngFor="let response of message.responses"
          [type]="response.type"
          [data]="response.data">
        </app-message-content>
      </div>
      
      <div class="message-timestamp">{{ formatTimestamp(message.timestamp) }}</div>
      <div class="streaming-indicator" *ngIf="message.isStreaming">
        <div class="spinner"></div>
        <span>Processing...</span>
      </div>
    </div>
  `,
  styles: [`
    .message {
      margin-bottom: 15px;
      padding: 10px;
      border-radius: 4px;
      position: relative;
    }

    .message.user {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      margin-left: 20%;
    }

    .message.assistant {
      background-color: var(--vscode-textBlockQuote-background);
      border-left: 3px solid var(--vscode-textBlockQuote-border);
      margin-right: 20%;
    }

    .message.error {
      background-color: var(--vscode-errorForeground);
      color: var(--vscode-errorBackground);
      margin-right: 20%;
    }

    .message.streaming {
      border-left: 3px solid var(--vscode-progressBar-background);
    }

    .message-content {
      line-height: 1.5;
      word-wrap: break-word;
    }

    .message-content pre {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 10px 0;
    }

    .message-content code {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 2px 4px;
      border-radius: 2px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }

    .responses-container {
      margin: 10px 0;
    }

    .message-content p {
      margin: 8px 0;
    }

    .message-content ul, .message-content ol {
      margin: 8px 0;
      padding-left: 20px;
    }

    .message-content li {
      margin: 4px 0;
    }

    .message-content strong {
      font-weight: bold;
    }

    .message-content em {
      font-style: italic;
    }

    .message-timestamp {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 5px;
      text-align: right;
    }

    .streaming-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid var(--vscode-progressBar-background);
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class MessageComponent {
  @Input() message!: ChatMessage;

  formatMessage(text: string): string {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>');
  }

  formatTimestamp(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
} 