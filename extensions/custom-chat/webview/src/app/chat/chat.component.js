"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatComponent = void 0;
const core_1 = require("@angular/core");
const rxjs_1 = require("rxjs");
let ChatComponent = (() => {
    let _classDecorators = [(0, core_1.Component)({
            selector: 'app-chat',
            template: `
    <div class="chat-container">
      <div class="messages" #messagesContainer>
        <app-message 
          *ngFor="let message of messages" 
          [message]="message"
          [isStreaming]="message.isStreaming">
        </app-message>
      </div>
      
      <app-input 
        [isProcessing]="isProcessing"
        (sendMessage)="onSendMessage($event)">
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
      gap: 20px;
      overflow: hidden;
      padding: 20px;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      max-height: 400px;
    }

    .status {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      text-align: center;
      padding: 10px;
    }
  `]
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ChatComponent = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ChatComponent = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        messages = [];
        isProcessing = false;
        statusMessage = '';
        vscode;
        destroy$ = new rxjs_1.Subject();
        ngOnInit() {
            this.vscode = acquireVsCodeApi();
            this.setupMessageListener();
            this.addWelcomeMessage();
        }
        ngOnDestroy() {
            this.destroy$.next();
            this.destroy$.complete();
        }
        setupMessageListener() {
            window.addEventListener('message', (event) => {
                const message = event.data;
                switch (message.command) {
                    case 'startStreaming':
                        this.startStreaming();
                        break;
                    case 'updateStreaming':
                        this.updateStreaming(message.text);
                        break;
                    case 'finishStreaming':
                        this.finishStreaming(message.text);
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
        addWelcomeMessage() {
            const welcomeMessage = {
                id: this.generateId(),
                text: `👋 Welcome to Custom Chat! This is a webview-based chat interface that connects to Google Cloud's Conversational Analytics API.

**Features:**
• Chat with your BigQuery data using natural language
• Python code generation and analysis
• Real-time streaming responses
• Integration with VS Code's Google Cloud authentication

Start by configuring your Google Cloud project, then ask questions about your data!`,
                type: 'assistant',
                timestamp: new Date()
            };
            this.messages.push(welcomeMessage);
        }
        onSendMessage(text) {
            if (!text.trim() || this.isProcessing)
                return;
            // Add user message
            const userMessage = {
                id: this.generateId(),
                text: text.trim(),
                type: 'user',
                timestamp: new Date()
            };
            this.messages.push(userMessage);
            // Send to extension
            this.vscode.postMessage({
                command: 'sendMessage',
                text: text.trim()
            });
        }
        startStreaming() {
            const streamingMessage = {
                id: this.generateId(),
                text: '',
                type: 'assistant',
                timestamp: new Date(),
                isStreaming: true
            };
            this.messages.push(streamingMessage);
            this.scrollToBottom();
        }
        updateStreaming(text) {
            const lastMessage = this.messages[this.messages.length - 1];
            if (lastMessage && lastMessage.isStreaming) {
                lastMessage.text = text;
                this.scrollToBottom();
            }
        }
        finishStreaming(text) {
            const lastMessage = this.messages[this.messages.length - 1];
            if (lastMessage && lastMessage.isStreaming) {
                lastMessage.text = text;
                lastMessage.isStreaming = false;
                this.scrollToBottom();
            }
        }
        addError(text) {
            const lastMessage = this.messages[this.messages.length - 1];
            if (lastMessage && lastMessage.isStreaming) {
                lastMessage.text = text;
                lastMessage.type = 'error';
                lastMessage.isStreaming = false;
            }
            else {
                const errorMessage = {
                    id: this.generateId(),
                    text: text,
                    type: 'error',
                    timestamp: new Date()
                };
                this.messages.push(errorMessage);
            }
            this.scrollToBottom();
        }
        updateStatus(text) {
            this.statusMessage = text;
        }
        setProcessing(processing) {
            this.isProcessing = processing;
        }
        scrollToBottom() {
            setTimeout(() => {
                const messagesContainer = document.querySelector('.messages');
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 100);
        }
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
    };
    return ChatComponent = _classThis;
})();
exports.ChatComponent = ChatComponent;
//# sourceMappingURL=chat.component.js.map