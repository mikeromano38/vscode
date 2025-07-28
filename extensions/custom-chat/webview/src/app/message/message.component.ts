import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ChatMessage } from '../chat/chat.component';

interface StructuredContent {
    type: 'step' | 'patch' | 'summary' | 'insight';
    data: any;
}

@Component({
  selector: 'app-message',
  template: `
    <div class="message" [ngClass]="message.type" [class.streaming]="message.isStreaming">
      <!-- User messages -->
      <div *ngIf="message.type === 'user'" 
           class="message-content" [innerHTML]="formatMessage(message.text)"></div>
      
      <!-- Streaming responses (for ask mode) -->
      <div *ngIf="message.responses && message.responses.length > 0" class="responses-container">
        <app-message-content 
          *ngFor="let response of message.responses"
          [type]="response.type"
          [data]="response.data">
        </app-message-content>
      </div>
      
      <!-- Structured content for assistant messages (for agent mode) -->
      <div *ngIf="message.type === 'assistant' && message.text && !message.responses" class="message-content">
        <div [innerHTML]="formatStructuredMessage(message.text)"></div>
      </div>
      
      <!-- Checkpoint restoration button for user messages -->
      <div *ngIf="message.type === 'user' && message.checkpointId" class="checkpoint-actions">
        <button class="checkpoint-btn" (click)="onRestoreCheckpoint(message.checkpointId!)">
          🔄 Restore to this point
        </button>
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

    .checkpoint-actions {
      margin-top: 8px;
      display: flex;
      gap: 8px;
    }

    .checkpoint-btn {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-button-border);
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 11px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .checkpoint-btn:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .structured-section {
      margin: 15px 0;
      padding: 10px;
      background-color: var(--vscode-textBlockQuote-background);
      border-radius: 4px;
      border-left: 3px solid var(--vscode-textBlockQuote-border);
    }

    .structured-section h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: var(--vscode-textPreformat-foreground);
    }

    .step-item, .patch-item, .insight-item, .plan-item {
      margin: 10px 0;
      padding: 8px;
      background-color: var(--vscode-input-background);
      border-radius: 3px;
      border: 1px solid var(--vscode-input-border);
    }

    .step-header, .patch-header {
      font-weight: bold;
      margin-bottom: 5px;
      color: var(--vscode-textPreformat-foreground);
    }

    .step-details {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .step-details div {
      margin: 2px 0;
    }

    .patch-content {
      background-color: var(--vscode-textBlockQuote-background);
      padding: 8px;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 11px;
      overflow-x: auto;
      margin-top: 5px;
    }

    .summary-completed, .summary-next {
      margin: 8px 0;
    }

    .summary-completed ul {
      margin: 5px 0;
      padding-left: 20px;
    }

    .summary-completed li {
      margin: 2px 0;
    }

    .insight-finding, .insight-data, .insight-recommendation {
      margin: 5px 0;
    }

    .plan-header, .plan-steps, .plan-files, .plan-risks, .plan-confirmation {
      margin: 8px 0;
    }

    .plan-steps ol, .plan-files ul {
      margin: 5px 0;
      padding-left: 20px;
    }

    .plan-steps li, .plan-files li {
      margin: 3px 0;
    }

    .plan-confirmation {
      font-weight: bold;
      color: var(--vscode-textPreformat-foreground);
      padding: 8px;
      background-color: var(--vscode-textBlockQuote-background);
      border-radius: 3px;
      border-left: 3px solid var(--vscode-textPreformat-foreground);
    }

    .remaining-text {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--vscode-panel-border);
    }
  `]
})
export class MessageComponent {
  @Input() message!: ChatMessage;
  @Output() restoreCheckpoint = new EventEmitter<string>();

  onRestoreCheckpoint(checkpointId: string) {
    this.restoreCheckpoint.emit(checkpointId);
  }

  formatMessage(text: string): string {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>');
  }

  formatStructuredMessage(text: string): string {
    console.log('[MessageComponent] formatStructuredMessage called with text:', text.substring(0, 200) + '...');
    
    // First, try to parse structured content
    // Use a more robust regex that can handle incomplete blocks
    const planMatches = text.match(/```plan\n([\s\S]*?)(?=\n```|$)/g);
    const stepMatches = text.match(/```step\n([\s\S]*?)\n```/g);
    const patchMatches = text.match(/```patch\n([\s\S]*?)\n```/g);
    const summaryMatches = text.match(/```summary\n([\s\S]*?)\n```/g);
    const insightMatches = text.match(/```insights\n([\s\S]*?)\n```/g);

    console.log('[MessageComponent] Found matches:', {
      plans: planMatches?.length || 0,
      steps: stepMatches?.length || 0,
      patches: patchMatches?.length || 0,
      summaries: summaryMatches?.length || 0,
      insights: insightMatches?.length || 0
    });

    if (planMatches || stepMatches || patchMatches || summaryMatches || insightMatches) {
      let formatted = '';

      // Format plans
      if (planMatches) {
        console.log('[MessageComponent] Formatting plans:', planMatches);
        
        planMatches.forEach((match, index) => {
          console.log(`[MessageComponent] Processing plan ${index}:`, match);
          const content = match.replace(/```plan\n/, '');
          const lines = content.split('\n');
          let plan = '', steps: string[] = [], files: string[] = [], risks = '';
          let currentSection = '';
          
          lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('PLAN:')) {
              plan = trimmedLine.replace('PLAN:', '').trim();
              currentSection = 'plan';
            } else if (trimmedLine.startsWith('STEPS:')) {
              currentSection = 'steps';
              // Handle multi-line steps
              const stepsContent = trimmedLine.replace('STEPS:', '').trim();
              if (stepsContent) {
                steps.push(stepsContent);
              }
            } else if (trimmedLine.startsWith('FILES:')) {
              currentSection = 'files';
              const filesContent = trimmedLine.replace('FILES:', '').trim();
              if (filesContent) {
                files.push(...filesContent.split(/[,;]/).map(item => item.trim()).filter(item => item));
              }
            } else if (trimmedLine.startsWith('RISKS:')) {
              currentSection = 'risks';
              risks = trimmedLine.replace('RISKS:', '').trim();
            } else if (trimmedLine && currentSection === 'steps') {
              // Continue parsing steps (numbered or bulleted)
              if (trimmedLine.match(/^\d+\./)) {
                steps.push(trimmedLine.replace(/^\d+\.\s*/, ''));
              } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                steps.push(trimmedLine.replace(/^[-•]\s*/, ''));
              } else if (trimmedLine.includes('.')) {
                // Handle steps that might be split across lines
                const lastStep = steps[steps.length - 1];
                if (lastStep && !lastStep.endsWith('.')) {
                  steps[steps.length - 1] = lastStep + ' ' + trimmedLine;
                } else {
                  steps.push(trimmedLine);
                }
              }
            } else if (trimmedLine && currentSection === 'files') {
              // Continue parsing files
              if (trimmedLine.startsWith('-')) {
                files.push(trimmedLine.replace(/^-\s*/, ''));
              }
            } else if (trimmedLine && currentSection === 'risks') {
              // Continue parsing risks
              risks += ' ' + trimmedLine;
            }
          });
          
          console.log('[MessageComponent] Parsed plan data:', { plan, steps, files, risks });
          
          formatted += `<div class="plan-item">
            <div class="plan-header"><strong>Plan:</strong> ${plan}</div>
            ${steps.length > 0 ? `<div class="plan-steps"><strong>Steps:</strong><ol>${steps.map(step => `<li>${step}</li>`).join('')}</ol></div>` : ''}
            ${files.length > 0 ? `<div class="plan-files"><strong>Files to be affected:</strong><ul>${files.map(file => `<li><code>${file}</code></li>`).join('')}</ul></div>` : ''}
            ${risks ? `<div class="plan-risks"><strong>Risks/Considerations:</strong> ${risks}</div>` : ''}
            <div class="plan-confirmation"><strong>Should I proceed with this plan?</strong></div>
          </div>`;
        });
        formatted += '</div>';
      }

      // Format steps
      if (stepMatches) {
        formatted += '<div class="structured-section"><h3>📋 Steps Completed</h3>';
        stepMatches.forEach(match => {
          const content = match.replace(/```step\n/, '').replace(/\n```/, '');
          const lines = content.split('\n');
          let step = '', action = '', file = '';
          
          lines.forEach(line => {
            if (line.startsWith('STEP:')) step = line.replace('STEP:', '').trim();
            if (line.startsWith('ACTION:')) action = line.replace('ACTION:', '').trim();
            if (line.startsWith('FILE:')) file = line.replace('FILE:', '').trim();
          });
          
          formatted += `<div class="step-item">
            <div class="step-header"><strong>${step}</strong></div>
            <div class="step-details">
              <div>Action: ${action}</div>
              <div>File: <code>${file}</code></div>
            </div>
          </div>`;
        });
        formatted += '</div>';
      }

      // Format patches
      if (patchMatches) {
        formatted += '<div class="structured-section"><h3>🔧 Code Changes</h3>';
        patchMatches.forEach(match => {
          const content = match.replace(/```patch\n/, '').replace(/\n```/, '');
          const lines = content.split('\n');
          let file = '', changes = '';
          
          lines.forEach(line => {
            if (line.startsWith('FILE:')) file = line.replace('FILE:', '').trim();
            if (line.startsWith('CHANGES:')) {
              const changesIndex = content.indexOf('CHANGES:');
              if (changesIndex !== -1) {
                changes = content.substring(changesIndex + 8).trim();
              }
            }
          });
          
          formatted += `<div class="patch-item">
            <div class="patch-header"><strong>${file}</strong></div>
            <pre class="patch-content"><code>${changes}</code></pre>
          </div>`;
        });
        formatted += '</div>';
      }

      // Format summaries
      if (summaryMatches) {
        formatted += '<div class="structured-section"><h3>📊 Summary</h3>';
        summaryMatches.forEach(match => {
          const content = match.replace(/```summary\n/, '').replace(/\n```/, '');
          const lines = content.split('\n');
          const completed: string[] = [];
          let next = '';
          
          lines.forEach(line => {
            if (line.startsWith('COMPLETED:')) {
              const completedContent = line.replace('COMPLETED:', '').trim();
              completed.push(...completedContent.split(/[,;]/).map(item => item.trim()).filter(item => item));
            }
            if (line.startsWith('NEXT:')) next = line.replace('NEXT:', '').trim();
          });
          
          if (completed.length > 0) {
            formatted += '<div class="summary-completed"><strong>Completed:</strong><ul>';
            completed.forEach(item => formatted += `<li>${item}</li>`);
            formatted += '</ul></div>';
          }
          if (next) {
            formatted += `<div class="summary-next"><strong>Next:</strong> ${next}</div>`;
          }
        });
        formatted += '</div>';
      }

      // Format insights
      if (insightMatches) {
        formatted += '<div class="structured-section"><h3>💡 Insights</h3>';
        insightMatches.forEach(match => {
          const content = match.replace(/```insights\n/, '').replace(/\n```/, '');
          const lines = content.split('\n');
          let finding = '', data = '', recommendation = '';
          
          lines.forEach(line => {
            if (line.startsWith('FINDING:')) finding = line.replace('FINDING:', '').trim();
            if (line.startsWith('DATA:')) data = line.replace('DATA:', '').trim();
            if (line.startsWith('RECOMMENDATION:')) recommendation = line.replace('RECOMMENDATION:', '').trim();
          });
          
          formatted += `<div class="insight-item">
            <div class="insight-finding"><strong>Finding:</strong> ${finding}</div>
            ${data ? `<div class="insight-data"><strong>Data:</strong> ${data}</div>` : ''}
            ${recommendation ? `<div class="insight-recommendation"><strong>Recommendation:</strong> ${recommendation}</div>` : ''}
          </div>`;
        });
        formatted += '</div>';
      }

      // Simple approach: just format the text as-is, preserving natural order
      // Replace structured blocks with formatted versions, keep everything else as-is
      let result = text;
      
      // Replace plan blocks
      if (planMatches) {
        planMatches.forEach(match => {
          const formattedPlan = this.formatPlanBlock(match.replace(/```plan\n/, '').replace(/\n```/, ''));
          result = result.replace(match, formattedPlan);
        });
      }
      
      // Replace step blocks
      if (stepMatches) {
        stepMatches.forEach(match => {
          const formattedStep = this.formatStepBlock(match.replace(/```step\n/, '').replace(/\n```/, ''));
          result = result.replace(match, formattedStep);
        });
      }
      
      // Replace patch blocks
      if (patchMatches) {
        patchMatches.forEach(match => {
          const formattedPatch = this.formatPatchBlock(match.replace(/```patch\n/, '').replace(/\n```/, ''));
          result = result.replace(match, formattedPatch);
        });
      }
      
      // Replace summary blocks
      if (summaryMatches) {
        summaryMatches.forEach(match => {
          const formattedSummary = this.formatSummaryBlock(match.replace(/```summary\n/, '').replace(/\n```/, ''));
          result = result.replace(match, formattedSummary);
        });
      }
      
      // Replace insight blocks
      if (insightMatches) {
        insightMatches.forEach(match => {
          const formattedInsight = this.formatInsightBlock(match.replace(/```insights\n/, '').replace(/\n```/, ''));
          result = result.replace(match, formattedInsight);
        });
      }
      
      // Format any remaining text that's not in blocks
      result = result.replace(/```[^`]*$/g, ''); // Remove incomplete blocks
      
      return this.formatMessage(result);
    }

    // If no structured content, format as regular message
    return this.formatMessage(text);
  }

  /**
   * Format a plan block
   */
  private formatPlanBlock(content: string): string {
    const lines = content.split('\n');
    let plan = '', steps: string[] = [], files: string[] = [], risks = '';
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('PLAN:')) {
        plan = trimmedLine.replace('PLAN:', '').trim();
        currentSection = 'plan';
      } else if (trimmedLine.startsWith('STEPS:')) {
        currentSection = 'steps';
        const stepsContent = trimmedLine.replace('STEPS:', '').trim();
        if (stepsContent) {
          steps.push(stepsContent);
        }
      } else if (trimmedLine.startsWith('FILES:')) {
        currentSection = 'files';
        const filesContent = trimmedLine.replace('FILES:', '').trim();
        if (filesContent) {
          files.push(...filesContent.split(/[,;]/).map(item => item.trim()).filter(item => item));
        }
      } else if (trimmedLine.startsWith('RISKS:')) {
        currentSection = 'risks';
        risks = trimmedLine.replace('RISKS:', '').trim();
      } else if (trimmedLine && currentSection === 'steps') {
        if (trimmedLine.match(/^\d+\./)) {
          steps.push(trimmedLine.replace(/^\d+\.\s*/, ''));
        } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
          steps.push(trimmedLine.replace(/^[-•]\s*/, ''));
        } else if (trimmedLine.includes('.')) {
          const lastStep = steps[steps.length - 1];
          if (lastStep && !lastStep.endsWith('.')) {
            steps[steps.length - 1] = lastStep + ' ' + trimmedLine;
          } else {
            steps.push(trimmedLine);
          }
        }
      } else if (trimmedLine && currentSection === 'files') {
        if (trimmedLine.startsWith('-')) {
          files.push(trimmedLine.replace(/^-\s*/, ''));
        }
      } else if (trimmedLine && currentSection === 'risks') {
        risks += ' ' + trimmedLine;
      }
    });
    
    return `<div class="plan-item">
      <div class="plan-header"><strong>Plan:</strong> ${plan}</div>
      ${steps.length > 0 ? `<div class="plan-steps"><strong>Steps:</strong><ol>${steps.map(step => `<li>${step}</li>`).join('')}</ol></div>` : ''}
      ${files.length > 0 ? `<div class="plan-files"><strong>Files to be affected:</strong><ul>${files.map(file => `<li><code>${file}</code></li>`).join('')}</ul></div>` : ''}
      ${risks ? `<div class="plan-risks"><strong>Risks/Considerations:</strong> ${risks}</div>` : ''}
      <div class="plan-confirmation"><strong>Should I proceed with this plan?</strong></div>
    </div>`;
  }

  /**
   * Format a step block
   */
  private formatStepBlock(content: string): string {
    const lines = content.split('\n');
    let step = '', action = '', file = '';
    
    lines.forEach(line => {
      if (line.startsWith('STEP:')) step = line.replace('STEP:', '').trim();
      if (line.startsWith('ACTION:')) action = line.replace('ACTION:', '').trim();
      if (line.startsWith('FILE:')) file = line.replace('FILE:', '').trim();
    });
    
    return `<div class="structured-section"><h3>Steps Completed</h3><div class="step-item">
      <div class="step-header"><strong>${step}</strong></div>
      <div class="step-action">Action: ${action}</div>
      <div class="step-file">File: <code>${file}</code></div>
    </div></div>`;
  }

  /**
   * Format a patch block
   */
  private formatPatchBlock(content: string): string {
    const lines = content.split('\n');
    let file = '', changes = '';
    
    lines.forEach(line => {
      if (line.startsWith('FILE:')) file = line.replace('FILE:', '').trim();
      if (line.startsWith('CHANGES:')) {
        const changesIndex = content.indexOf('CHANGES:');
        if (changesIndex !== -1) {
          changes = content.substring(changesIndex + 8).trim();
        }
      }
    });
    
    return `<div class="structured-section"><h3>🔧 Code Changes</h3><div class="patch-item">
      <div class="patch-header"><strong>${file}</strong></div>
      <pre class="patch-content"><code>${changes}</code></pre>
    </div></div>`;
  }

  /**
   * Format a summary block
   */
  private formatSummaryBlock(content: string): string {
    const lines = content.split('\n');
    const completed: string[] = [];
    let next = '';
    
    lines.forEach(line => {
      if (line.startsWith('COMPLETED:')) {
        const completedContent = line.replace('COMPLETED:', '').trim();
        completed.push(...completedContent.split(/[,;]/).map(item => item.trim()).filter(item => item));
      }
      if (line.startsWith('NEXT:')) next = line.replace('NEXT:', '').trim();
    });
    
    let result = '<div class="structured-section"><h3>📊 Summary</h3>';
    if (completed.length > 0) {
      result += '<div class="summary-completed"><strong>Completed:</strong><ul>';
      completed.forEach(item => result += `<li>${item}</li>`);
      result += '</ul></div>';
    }
    if (next) {
      result += `<div class="summary-next"><strong>Next:</strong> ${next}</div>`;
    }
    result += '</div>';
    
    return result;
  }

  /**
   * Format an insight block
   */
  private formatInsightBlock(content: string): string {
    const lines = content.split('\n');
    let finding = '', data = '', recommendation = '';
    
    lines.forEach(line => {
      if (line.startsWith('FINDING:')) finding = line.replace('FINDING:', '').trim();
      if (line.startsWith('DATA:')) data = line.replace('DATA:', '').trim();
      if (line.startsWith('RECOMMENDATION:')) recommendation = line.replace('RECOMMENDATION:', '').trim();
    });
    
    return `<div class="structured-section"><h3>💡 Insights</h3><div class="insight-item">
      <div class="insight-finding"><strong>Finding:</strong> ${finding}</div>
      ${data ? `<div class="insight-data"><strong>Data:</strong> ${data}</div>` : ''}
      ${recommendation ? `<div class="insight-recommendation"><strong>Recommendation:</strong> ${recommendation}</div>` : ''}
    </div></div>`;
  }

  /**
   * Check if remaining text is redundant with the formatted content
   */
  private isRedundantText(remainingText: string, formattedContent: string): boolean {
    // Remove HTML tags from formatted content for comparison
    const cleanFormatted = formattedContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const cleanRemaining = remainingText.replace(/\s+/g, ' ').trim();
    
    // Check if the remaining text is just a subset or duplicate of the formatted content
    if (cleanRemaining.length < 50) return false; // Don't filter out short text
    
    // Check for common patterns that indicate redundancy
    const redundantPatterns = [
      /I can help with that\. Here is my plan:/i,
      /Here is the plan:/i,
      /Should I proceed with this plan\?/i
    ];
    
    return redundantPatterns.some(pattern => pattern.test(cleanRemaining));
  }

  formatTimestamp(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
} 