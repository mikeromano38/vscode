import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VscodeApiService } from '../services/vscode-api.service';
import { TitleService } from '../services/title.service';
import { ParsedStreamResponse, MessageContentType } from '../../types/responseTypes';

export interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'assistant' | 'error';
  timestamp: Date;
  isStreaming: boolean;
  responses?: ParsedStreamResponse[];
  checkpointId?: string;
  metadata?: any;
}

declare function acquireVsCodeApi(): any;

@Component({
  selector: 'app-chat',
  template: `
    <div class="chat-container">
      <div class="messages" #messagesContainer>
        <app-message 
          *ngFor="let message of messages" 
          [message]="message"
          (restoreCheckpoint)="restoreCheckpoint($event)">
        </app-message>
      </div>
      
      <div class="bottom-section">
        <div class="status" *ngIf="statusMessage">
          {{ statusMessage }}
        </div>
        
              <app-input 
        [isProcessing]="isProcessing"
        (sendMessageEvent)="onSendMessage($event)"
        (modeChangeEvent)="onModeChange($event)">
      </app-input>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 15px;
      min-height: 0;
      height: 100%;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      min-height: 0;
      margin-bottom: 10px;
    }

    .bottom-section {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
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
      }
      
      .messages {
        padding: 6px;
      }
      
      .bottom-section {
        gap: 8px;
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
  private hasSetTitle = false;

  constructor(
    private vscodeApiService: VscodeApiService,
    private titleService: TitleService
  ) {}

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
        case 'addMessage':
          this.addMessage(message.text, message.isUser || false, message.metadata);
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
        case 'agentUpdate':
          this.handleAgentUpdate(message.update);
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

  onSendMessage(messageData: string) {
    if (!messageData || this.isProcessing) return;

    let parsedMessage: any;
    let displayText: string;
    let contextItems: any[] = [];
    let mode: string = 'ask';

    try {
      // Try to parse as JSON first (new format)
      parsedMessage = JSON.parse(messageData);
      displayText = parsedMessage.text || '';
      contextItems = parsedMessage.context || [];
      mode = parsedMessage.mode || 'ask';
    } catch {
      // Fallback to old format (plain text)
      displayText = messageData.trim();
    }

    if (!displayText) return;

    console.log('Sending message:', displayText);
    console.log('Mode:', mode);
    console.log('Context items:', contextItems);

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      text: displayText,
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

    // Send the original JSON string to preserve mode information
    this.vscodeApiService.postMessage({
      command: 'sendMessage',
      text: messageData
    });
    
    console.log('Message sent to extension');
  }

  onModeChange(mode: string) {
    console.log('Mode changed to:', mode);
    // You can add additional logic here for mode changes
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
    
    // Set title from systemMessage schema query if available and title hasn't been set yet
    if (!this.hasSetTitle && response.data?.question) {
      const title = response.data.question;
      this.titleService.setTitle(title);
      this.hasSetTitle = true;
      console.log('Title set from systemMessage:', title);
    }
    
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

  private addMessage(text: string, isUser: boolean = false, metadata?: any) {
    console.log('=== Adding message ===');
    console.log('Text:', text);
    console.log('Is user:', isUser);
    console.log('Metadata:', metadata);
    
    const message: ChatMessage = {
      id: this.generateId(),
      text: text,
      type: isUser ? 'user' : 'assistant',
      timestamp: new Date(),
      isStreaming: false,
      checkpointId: metadata?.checkpointId,
      metadata: metadata
    };
    
    this.messages.push(message);
    console.log('Message added, total messages:', this.messages.length);
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

  private handleAgentUpdate(update: any) {
    const lastMessage = this.messages[this.messages.length - 1];
    
    switch (update.type) {
      case 'start':
        // Start typing effect for the last assistant message
        if (lastMessage && lastMessage.type === 'assistant') {
          lastMessage.isStreaming = true;
          lastMessage.text = '';
        }
        break;
        
      case 'content':
        // Add content with typing effect
        if (update.content && lastMessage && lastMessage.type === 'assistant') {
          lastMessage.text += update.content;
          this.scrollToBottom();
        }
        break;
        
      case 'complete':
        // Finish typing effect
        if (lastMessage && lastMessage.type === 'assistant') {
          lastMessage.isStreaming = false;
          // Content is already accumulated from streaming, just finish the typing effect
        }
        break;
        
      case 'error':
        // Handle error
        this.addError(update.error || 'An error occurred');
        break;
    }
  }

  restoreCheckpoint(checkpointId: string) {
    console.log('=== Restoring checkpoint ===');
    console.log('Checkpoint ID:', checkpointId);
    
    if (!this.vscodeApiService.isAvailable()) {
      console.error('VS Code API not available');
      return;
    }
    
    this.vscodeApiService.postMessage({
      command: 'restoreCheckpoint',
      checkpointId: checkpointId
    });
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

  private generateTitleFromMessage(message: string): string {
    // Clean up the message and create a title
    let title = message.trim();
    
    // Remove common prefixes
    title = title.replace(/^(question|query|ask|tell me about|show me|analyze|explain|what is|how to|can you|please)\s+/i, '');
    
    // Limit length
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    // If title is empty or too short, use a default
    if (!title || title.length < 3) {
      title = 'New Chat';
    }
    
    return title;
  }
} 