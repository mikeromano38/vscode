import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VscodeApiService } from '../services/vscode-api.service';
import { TitleService } from '../services/title.service';

@Component({
  selector: 'app-header',
  template: `
    <div class="header">
      <div class="title">
        <span class="icon">📊</span>
        {{ currentTitle }}
      </div>
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid var(--vscode-panel-border);
      background-color: var(--vscode-editor-background);
      flex-shrink: 0;
    }

    .title {
      font-size: 1.5em;
      font-weight: bold;
      color: var(--vscode-editor-foreground);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title .icon {
      font-size: 1.2em;
    }

    .icon {
      font-size: 14px;
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentTitle = 'Untitled';
  private destroy$ = new Subject<void>();

  constructor(
    private vscodeApiService: VscodeApiService,
    private titleService: TitleService
  ) {}

  ngOnInit() {
    this.titleService.title$
      .pipe(takeUntil(this.destroy$))
      .subscribe(title => {
        this.currentTitle = title;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 