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
exports.MessageComponent = void 0;
const core_1 = require("@angular/core");
let MessageComponent = (() => {
    let _classDecorators = [(0, core_1.Component)({
            selector: 'app-message',
            template: `
    <div class="message" [ngClass]="message.type" [class.streaming]="isStreaming">
      <div class="message-content" [innerHTML]="formatMessage(message.text)"></div>
      <div class="message-timestamp">{{ formatTimestamp(message.timestamp) }}</div>
      <div class="streaming-indicator" *ngIf="isStreaming">
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
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _message_decorators;
    let _message_initializers = [];
    let _message_extraInitializers = [];
    let _isStreaming_decorators;
    let _isStreaming_initializers = [];
    let _isStreaming_extraInitializers = [];
    var MessageComponent = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _message_decorators = [(0, core_1.Input)()];
            _isStreaming_decorators = [(0, core_1.Input)()];
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: obj => "message" in obj, get: obj => obj.message, set: (obj, value) => { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _isStreaming_decorators, { kind: "field", name: "isStreaming", static: false, private: false, access: { has: obj => "isStreaming" in obj, get: obj => obj.isStreaming, set: (obj, value) => { obj.isStreaming = value; } }, metadata: _metadata }, _isStreaming_initializers, _isStreaming_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MessageComponent = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        message = __runInitializers(this, _message_initializers, void 0);
        isStreaming = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _isStreaming_initializers, false));
        formatMessage(text) {
            // Simple markdown-like formatting
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/\n/g, '<br>');
        }
        formatTimestamp(timestamp) {
            return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        constructor() {
            __runInitializers(this, _isStreaming_extraInitializers);
        }
    };
    return MessageComponent = _classThis;
})();
exports.MessageComponent = MessageComponent;
//# sourceMappingURL=message.component.js.map