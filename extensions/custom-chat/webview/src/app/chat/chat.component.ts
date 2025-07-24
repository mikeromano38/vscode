import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VscodeApiService } from '../services/vscode-api.service';
import { ParsedStreamResponse, MessageContentType } from '../../types/responseTypes';

export interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'assistant' | 'error';
  timestamp: Date;
  isStreaming: boolean;
  responses?: ParsedStreamResponse[];
}

declare function acquireVsCodeApi(): any;

@Component({
  selector: 'app-chat',
  template: `
    <div class="chat-container">
      <div class="messages" #messagesContainer>
        <app-message 
          *ngFor="let message of messages" 
          [message]="message">
        </app-message>
      </div>
      
      <app-input 
        [isProcessing]="isProcessing"
        (sendMessageEvent)="onSendMessage($event)">
      </app-input>
      
      <div class="status" *ngIf="statusMessage">
        {{ statusMessage }}
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 15px;
      overflow: hidden;
      padding: 15px;
      min-height: 0;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      min-height: 200px;
      max-height: 60vh;
    }

    .status {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      text-align: center;
      padding: 8px;
      border-top: 1px solid var(--vscode-panel-border);
    }

    /* Responsive adjustments for narrow sidebar */
    @media (max-width: 400px) {
      .chat-container {
        padding: 10px;
        gap: 10px;
      }
      
      .messages {
        padding: 6px;
        min-height: 150px;
        max-height: 50vh;
      }
      
      .status {
        font-size: 10px;
        padding: 6px;
      }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  isProcessing = false;
  statusMessage = '';
  private destroy$ = new Subject<void>();

  constructor(private vscodeApiService: VscodeApiService) {}

  ngOnInit() {
    console.log('Chat component initialized');
    this.setupMessageListener();
    this.addWelcomeMessage();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      const message = event.data;
      
      switch (message.command) {
        case 'startStreaming':
          this.startStreaming();
          break;
        case 'addStreamingResponse':
          this.addStreamingResponse(message.response);
          break;
        case 'finishStreaming':
          this.finishStreaming();
          break;
        case 'addError':
          this.addError(message.text);
          break;
        case 'updateStatus':
          this.updateStatus(message.text);
          break;
        case 'setProcessing':
          this.setProcessing(message.processing);
          break;
      }
    });
  }

  private addWelcomeMessage() {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      text: `📊 Welcome to DataVibe! Your AI-powered data analysis companion.

**Features:**
• Chat with your BigQuery data using natural language
• Python code generation and analysis
• Real-time streaming responses
• Integration with VS Code's Google Cloud authentication

Start by configuring your Google Cloud project, then ask questions about your data!`,
      type: 'assistant',
      timestamp: new Date(),
      isStreaming: false
    };
    this.messages.push(welcomeMessage);
  }

  onSendMessage(text: string) {
    if (!text.trim() || this.isProcessing) return;

    console.log('Sending message:', text.trim());

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      text: text.trim(),
      type: 'user',
      timestamp: new Date(),
      isStreaming: false
    };
    this.messages.push(userMessage);

    // Send to extension
    if (!this.vscodeApiService.isAvailable()) {
      console.error('VS Code API not available');
      this.addError('❌ **Error**: VS Code API not available. Please reload the extension.');
      return;
    }

    this.vscodeApiService.postMessage({
      command: 'sendMessage',
      text: text.trim()
    });
    
    console.log('Message sent to extension');
  }

  private startStreaming() {
    console.log('=== Starting streaming ===');
    // We don't need to create a streaming message anymore since each response
    // will be its own message. The streaming indicator will be shown by the
    // last message if it's still processing.
    console.log('Streaming started - responses will be added as individual messages');
  }

  private addStreamingResponse(response: ParsedStreamResponse) {
    console.log('=== Adding streaming response ===');
    console.log('Response type:', response.type);
    console.log('Response data:', response.data);
    console.log('Current messages count:', this.messages.length);
    
    // Create a new message for each response chunk
    const newMessage: ChatMessage = {
      id: this.generateId(),
      text: '', // Empty text since we're using responses
      type: 'assistant',
      timestamp: new Date(),
      isStreaming: false, // Not streaming since this is a complete response
      responses: [response] // Single response per message
    };
    
    this.messages.push(newMessage);
    console.log('Added new message with response type:', response.type);
    this.scrollToBottom();
  }

  private finishStreaming() {
    console.log('=== Finishing streaming ===');
    console.log('Total messages after streaming:', this.messages.length);
    // No need to update any message since each response is its own message
    this.scrollToBottom();
  }

  private addError(text: string) {
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage && lastMessage.isStreaming) {
      lastMessage.text = text;
      lastMessage.type = 'error';
      lastMessage.isStreaming = false;
    } else {
      const errorMessage: ChatMessage = {
        id: this.generateId(),
        text: text,
        type: 'error',
        timestamp: new Date(),
        isStreaming: false
      };
      this.messages.push(errorMessage);
    }
    this.scrollToBottom();
  }

  private updateStatus(text: string) {
    this.statusMessage = text;
  }

  private setProcessing(processing: boolean) {
    this.isProcessing = processing;
  }

  private scrollToBottom() {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages') as HTMLElement;
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 