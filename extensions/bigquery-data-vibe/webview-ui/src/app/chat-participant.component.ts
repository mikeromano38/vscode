// Built by Google
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare const acquireVsCodeApi: any;

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  loading?: boolean;
  error?: string;
}

interface ChatSuggestion {
  text: string;
  action: string;
  icon: string;
}

@Component({
  selector: 'app-chat-participant',
  templateUrl: './chat-participant.component.html',
  styleUrls: ['./chat-participant.component.css'],
  imports: [NgFor, NgIf, NgClass, DatePipe, FormsModule]
})
export class ChatParticipantComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  isTyping: boolean = false;

  suggestions: ChatSuggestion[] = [
    {
      text: 'Show me the schema of this table',
      action: 'schema',
      icon: '📋'
    },
    {
      text: 'What are the most common values?',
      action: 'common_values',
      icon: '📊'
    },
    {
      text: 'Find potential data quality issues',
      action: 'data_quality',
      icon: '🔍'
    },
    {
      text: 'Generate a sample query',
      action: 'sample_query',
      icon: '💡'
    },
    {
      text: 'Explain this table structure',
      action: 'explain',
      icon: '📝'
    }
  ];

  private vscode: any;

  ngOnInit() {
    this.initializeVSCodeAPI();
    this.addWelcomeMessage();
    this.setupMessageListener();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private initializeVSCodeAPI() {
    try {
      this.vscode = acquireVsCodeApi();
      (window as any).vscode = this.vscode;
    } catch (error) {
      console.warn('VS Code API already acquired or not available:', error);
      this.vscode = (window as any).vscode;
    }
  }

  private addWelcomeMessage() {
    this.messages.push({
      id: this.generateId(),
      content: `Hello! I'm your BigQuery Data Assistant. I can help you understand your data, find insights, and write queries. What would you like to know about your BigQuery table?`,
      sender: 'assistant',
      timestamp: new Date()
    });
  }

  private setupMessageListener() {
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'chatResponse') {
        this.handleChatResponse(message);
      } else if (message.type === 'tableMetadata') {
        this.handleTableMetadata(message.metadata);
      }
    });
  }

  private handleChatResponse(message: any) {
    // Remove loading message if exists
    this.messages = this.messages.filter(m => !m.loading);
    
    if (message.error) {
      this.messages.push({
        id: this.generateId(),
        content: `Sorry, I encountered an error: ${message.error}`,
        sender: 'assistant',
        timestamp: new Date(),
        error: message.error
      });
    } else {
      this.messages.push({
        id: this.generateId(),
        content: message.response,
        sender: 'assistant',
        timestamp: new Date()
      });
    }
    
    this.isLoading = false;
    this.isTyping = false;
  }

  private handleTableMetadata(metadata: any) {
    // Store metadata for context
    (window as any).currentTableMetadata = metadata;
  }

  sendMessage() {
    if (!this.newMessage.trim() || this.isLoading) return;

    const userMessage: ChatMessage = {
      id: this.generateId(),
      content: this.newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    const messageContent = this.newMessage;
    this.newMessage = '';
    this.isLoading = true;

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: this.generateId(),
      content: 'Thinking...',
      sender: 'assistant',
      timestamp: new Date(),
      loading: true
    };
    this.messages.push(loadingMessage);

    // Send message to VS Code extension
    if (this.vscode) {
      this.vscode.postMessage({
        type: 'chatMessage',
        message: messageContent
      });
    }
  }

  sendSuggestion(suggestion: ChatSuggestion) {
    this.newMessage = suggestion.text;
    this.sendMessage();
  }

  private scrollToBottom() {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.warn('Error scrolling to bottom:', err);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  focusInput() {
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  clearChat() {
    this.messages = [];
    this.addWelcomeMessage();
  }

  copyMessage(message: ChatMessage) {
    navigator.clipboard.writeText(message.content).then(() => {
      // Show brief feedback
      const originalContent = message.content;
      message.content = 'Copied to clipboard!';
      setTimeout(() => {
        message.content = originalContent;
      }, 1000);
    });
  }

  onEnterKey(event: any) {
    if (!event.shiftKey) {
      this.sendMessage();
      event.preventDefault();
    }
  }
} 