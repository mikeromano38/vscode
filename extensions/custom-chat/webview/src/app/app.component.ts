import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <app-header></app-header>
      <app-chat></app-chat>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-foreground);
    }
  `]
})
export class AppComponent {
  title = 'Custom Chat';
} 