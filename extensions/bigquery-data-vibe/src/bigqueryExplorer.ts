import * as vscode from 'vscode';
import { BigQueryService } from './bigqueryService';
import { CONFIG_SECTIONS } from './shared-constants';

export class BigQueryExplorerProvider implements vscode.TreeDataProvider<BigQueryTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<BigQueryTreeItem | undefined | null | void> = new vscode.EventEmitter<BigQueryTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<BigQueryTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  // Cache for children to avoid unnecessary API calls
  private childrenCache = new Map<string, BigQueryTreeItem[]>();

  constructor(private bigQueryService: BigQueryService) {
    console.log('BigQueryExplorerProvider constructor called');
  }

  refresh(): void {
    // Clear the cache when refreshing
    this.childrenCache.clear();
    this._onDidChangeTreeData.fire();
  }

  // Clear cache for a specific project or dataset
  clearCache(projectId?: string, datasetId?: string): void {
    if (!projectId) {
      // Clear all cache
      this.childrenCache.clear();
    } else if (!datasetId) {
      // Clear cache for a specific project
      const keysToDelete = Array.from(this.childrenCache.keys()).filter(key => 
        key.startsWith(`project:${projectId}`) || key.startsWith(`dataset:${projectId}:`)
      );
      keysToDelete.forEach(key => this.childrenCache.delete(key));
    } else {
      // Clear cache for a specific dataset
      const key = `dataset:${projectId}:${datasetId}`;
      this.childrenCache.delete(key);
    }
  }

  getTreeItem(element: BigQueryTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: BigQueryTreeItem): Promise<BigQueryTreeItem[]> {
    console.log('BigQueryExplorerProvider.getChildren called with element:', element?.label);
    
    if (!element) {
      // Root level - show projects (no caching needed, just reads from config)
      console.log('Getting root level projects...');
      return this.getProjects();
    }

    // Create a cache key for this element
    const cacheKey = this.getCacheKey(element);
    
    // Check if we have cached children
    if (this.childrenCache.has(cacheKey)) {
      console.log(`Using cached children for ${element.label}`);
      return this.childrenCache.get(cacheKey)!;
    }

    let children: BigQueryTreeItem[];
    
    if (element.type === 'project') {
      // Project level - show datasets
      children = await this.getDatasets(element.id!);
    } else if (element.type === 'dataset') {
      // Dataset level - show tables and views
      children = await this.getDatasetChildren(element.projectId!, element.id!);
    } else {
      children = [];
    }

    // Cache the children
    this.childrenCache.set(cacheKey, children);
    console.log(`Cached ${children.length} children for ${element.label}`);
    
    return children;
  }

  private getCacheKey(element: BigQueryTreeItem): string {
    if (element.type === 'project') {
      return `project:${element.id}`;
    } else if (element.type === 'dataset') {
      return `dataset:${element.projectId}:${element.id}`;
    }
    return `unknown:${element.label}`;
  }

  getParent(element: BigQueryTreeItem): BigQueryTreeItem | undefined {
    console.log('BigQueryExplorerProvider.getParent called with element:', element?.label);
    
    if (!element) {
      return undefined;
    }

    if (element.type === 'table' || element.type === 'view') {
      // Table/View parent is the dataset
      return new BigQueryTreeItem(
        element.datasetId!,
        'dataset',
        vscode.TreeItemCollapsibleState.Collapsed,
        element.datasetId,
        element.projectId
      );
    }

    if (element.type === 'dataset') {
      // Dataset parent is the project
      return new BigQueryTreeItem(
        element.projectId!,
        'project',
        vscode.TreeItemCollapsibleState.Collapsed,
        element.projectId
      );
    }

    // Project has no parent (root level)
    return undefined;
  }

  private async getProjects(): Promise<BigQueryTreeItem[]> {
    console.log('getProjects called');
    try {
      const projects = vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).get<any[]>('projects') || [];
      console.log('Projects from config:', projects);
      
      if (projects.length === 0) {
        console.log('No projects configured, returning sign-in item');
        return [new BigQueryTreeItem('Sign in to Google Cloud to configure project', 'error', vscode.TreeItemCollapsibleState.None, undefined, undefined, undefined, undefined, 'bigquery.signIn')];
      }
      
      // Return enabled projects
      const enabledProjects = projects.filter(p => p.enabled !== false);
      console.log('Returning enabled projects:', enabledProjects);
      
      return enabledProjects.map((project: any) => 
        new BigQueryTreeItem(
          project.name || project.projectId,
          'project',
          vscode.TreeItemCollapsibleState.Collapsed,
          project.projectId
        )
      );
    } catch (error) {
      console.error('Error getting projects:', error);
      return [new BigQueryTreeItem('Error loading projects', 'error', vscode.TreeItemCollapsibleState.None)];
    }
  }

  private async getDatasets(projectId: string): Promise<BigQueryTreeItem[]> {
    console.log('getDatasets called for projectId:', projectId);
    try {
      // First, ensure we're authenticated
      console.log('Ensuring BigQuery service is authenticated...');
      const authenticated = await this.bigQueryService.authenticate();
      console.log('BigQuery service authentication result:', authenticated);
      
      if (!authenticated) {
        console.log('Authentication failed, returning sign-in item');
        return [new BigQueryTreeItem('Sign in to Google Cloud to view datasets', 'error', vscode.TreeItemCollapsibleState.None, undefined, undefined, undefined, undefined, 'bigquery.signIn')];
      }
      
      console.log('Calling BigQuery service listDatasets...');
      const datasets = await this.bigQueryService.listDatasets(projectId);
      console.log('Successfully retrieved datasets:', datasets.length);
      
      return datasets.map((dataset: any) => 
        new BigQueryTreeItem(
          dataset.datasetId,
          'dataset',
          vscode.TreeItemCollapsibleState.Collapsed,
          dataset.datasetId,
          projectId
        )
      );
    } catch (error) {
      console.error('Error getting datasets:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && (
        error.message.includes('Authentication failed') ||
        error.message.includes('401') ||
        error.message.includes('403') ||
        error.message.includes('unauthorized') ||
        error.message.includes('forbidden')
      )) {
        console.log('Authentication error detected, returning sign-in item');
        return [new BigQueryTreeItem('Sign in to Google Cloud to view datasets', 'error', vscode.TreeItemCollapsibleState.None, undefined, undefined, undefined, undefined, 'bigquery.signIn')];
      }
      
      return [new BigQueryTreeItem(`Error loading datasets: ${error}`, 'error', vscode.TreeItemCollapsibleState.None)];
    }
  }

  private async getDatasetChildren(projectId: string, datasetId: string): Promise<BigQueryTreeItem[]> {
    try {
      const tables = await this.bigQueryService.listTables(projectId, datasetId);
      const views = await this.bigQueryService.listViews(projectId, datasetId);

      const items: BigQueryTreeItem[] = [];

      // Add tables
      tables.forEach((table: any) => {
        items.push(new BigQueryTreeItem(
          table.tableId,
          'table',
          vscode.TreeItemCollapsibleState.None,
          table.tableId,
          projectId,
          datasetId,
          'table'
        ));
      });

      // Add views
      views.forEach((view: any) => {
        items.push(new BigQueryTreeItem(
          view.tableId,
          'view',
          vscode.TreeItemCollapsibleState.None,
          view.tableId,
          projectId,
          datasetId,
          'view'
        ));
      });

      return items;
    } catch (error) {
      console.error('Error getting dataset children:', error);
      return [new BigQueryTreeItem('Error loading tables/views', 'error', vscode.TreeItemCollapsibleState.None)];
    }
  }
}

export class BigQueryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly type: 'project' | 'dataset' | 'table' | 'view' | 'error',
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly id?: string,
    public readonly projectId?: string,
    public readonly datasetId?: string,
    public readonly resourceType?: 'table' | 'view',
    public readonly commandId?: string
  ) {
    super(label, collapsibleState);

    this.tooltip = this.getTooltip();
    this.iconPath = this.getIconPath();
    this.contextValue = this.getContextValue();
    
    // Add command if provided
    if (commandId) {
      this.command = {
        command: commandId,
        title: this.label,
        arguments: []
      };
    }
  }

  private getTooltip(): string {
    switch (this.type) {
      case 'project':
        return `Project: ${this.label}`;
      case 'dataset':
        return `Dataset: ${this.label}`;
      case 'table':
        return `Table: ${this.projectId}.${this.datasetId}.${this.label}`;
      case 'view':
        return `View: ${this.projectId}.${this.datasetId}.${this.label}`;
      case 'error':
        return this.label;
      default:
        return this.label;
    }
  }

  private getIconPath(): vscode.ThemeIcon | undefined {
    switch (this.type) {
      case 'project':
        return new vscode.ThemeIcon('cloud');
      case 'dataset':
        return new vscode.ThemeIcon('database');
      case 'table':
        return new vscode.ThemeIcon('table');
      case 'view':
        return new vscode.ThemeIcon('eye');
      case 'error':
        return new vscode.ThemeIcon('error');
      default:
        return undefined;
    }
  }

  private getContextValue(): string {
    switch (this.type) {
      case 'project':
        return 'bigquery-project';
      case 'dataset':
        return 'bigquery-dataset';
      case 'table':
        return 'bigquery-table';
      case 'view':
        return 'bigquery-view';
      case 'error':
        return 'bigquery-error';
      default:
        return '';
    }
  }
} 