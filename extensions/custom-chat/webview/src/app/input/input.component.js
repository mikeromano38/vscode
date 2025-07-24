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
exports.InputComponent = void 0;
const core_1 = require("@angular/core");
let InputComponent = (() => {
    let _classDecorators = [(0, core_1.Component)({
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
        [disabled]="isProcessing || !messageText?.trim()"
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
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _isProcessing_decorators;
    let _isProcessing_initializers = [];
    let _isProcessing_extraInitializers = [];
    let _sendMessageEvent_decorators;
    let _sendMessageEvent_initializers = [];
    let _sendMessageEvent_extraInitializers = [];
    let _messageInput_decorators;
    let _messageInput_initializers = [];
    let _messageInput_extraInitializers = [];
    var InputComponent = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _isProcessing_decorators = [(0, core_1.Input)()];
            _sendMessageEvent_decorators = [(0, core_1.Output)()];
            _messageInput_decorators = [(0, core_1.ViewChild)('messageInput')];
            __esDecorate(null, null, _isProcessing_decorators, { kind: "field", name: "isProcessing", static: false, private: false, access: { has: obj => "isProcessing" in obj, get: obj => obj.isProcessing, set: (obj, value) => { obj.isProcessing = value; } }, metadata: _metadata }, _isProcessing_initializers, _isProcessing_extraInitializers);
            __esDecorate(null, null, _sendMessageEvent_decorators, { kind: "field", name: "sendMessageEvent", static: false, private: false, access: { has: obj => "sendMessageEvent" in obj, get: obj => obj.sendMessageEvent, set: (obj, value) => { obj.sendMessageEvent = value; } }, metadata: _metadata }, _sendMessageEvent_initializers, _sendMessageEvent_extraInitializers);
            __esDecorate(null, null, _messageInput_decorators, { kind: "field", name: "messageInput", static: false, private: false, access: { has: obj => "messageInput" in obj, get: obj => obj.messageInput, set: (obj, value) => { obj.messageInput = value; } }, metadata: _metadata }, _messageInput_initializers, _messageInput_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            InputComponent = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        isProcessing = __runInitializers(this, _isProcessing_initializers, false);
        sendMessageEvent = (__runInitializers(this, _isProcessing_extraInitializers), __runInitializers(this, _sendMessageEvent_initializers, new core_1.EventEmitter()));
        messageInput = (__runInitializers(this, _sendMessageEvent_extraInitializers), __runInitializers(this, _messageInput_initializers, void 0));
        messageText = (__runInitializers(this, _messageInput_extraInitializers), '');
        placeholder = 'Ask a question about your data...';
        onKeyDown(event) {
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
    };
    return InputComponent = _classThis;
})();
exports.InputComponent = InputComponent;
//# sourceMappingURL=input.component.js.map