// Built by Google
import * as vscode from 'vscode';
import * as fs from 'fs';
import { BigQueryExplorerProvider, BigQueryTreeItem } from './bigqueryExplorer';
import { BigQueryService, BigQueryTableMetadata } from './bigqueryService';
import { SharedAuthService } from './sharedAuthService';
import { GOOGLE_CLOUD_SCOPES, GOOGLE_CLOUD_AUTH_PROVIDER, CONFIG_SECTIONS } from './shared-constants';

async function autoConfigureProject(bigQueryService: BigQueryService): Promise<void> {
  console.log('Auto-configuring project from Google Cloud extension...');
  
  try {
    // Try to get project from google-cloud configuration
    const googleCloudConfig = vscode.workspace.getConfiguration(CONFIG_SECTIONS.GOOGLE_CLOUD);
    const projectId = googleCloudConfig.get<string>('projectId');
    
    if (projectId) {
      console.log(`Found Google Cloud project: ${projectId}`);
      
      // Check if this project is already in our list
        const currentProjects = vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).get<any[]>('projects') || [];
      const projectExists = currentProjects.some(p => p.projectId === projectId);
      
      if (!projectExists) {
        // Add the project to our list
        currentProjects.push({
          projectId: projectId,
          name: projectId,
          enabled: true
        });
        
          await vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).update('projects', currentProjects, vscode.ConfigurationTarget.Global);
        console.log(`BigQuery project auto-configured: ${projectId}`);
      }
      return;
    }
    
    // If no project in config, try to get it from authentication sessions
    console.log('No project in config, checking authentication sessions...');
    const session = await vscode.authentication.getSession(GOOGLE_CLOUD_AUTH_PROVIDER, GOOGLE_CLOUD_SCOPES, { createIfNone: false });
    
    if (session) {
      console.log(`Found Google Cloud session: ${session.account.label}`);
      
      // Extract project from email if it's in the format user@project-id.iam.gserviceaccount.com
      const email = session.account.label;
      if (email.includes('@') && email.includes('.iam.gserviceaccount.com')) {
        const projectFromEmail = email.split('@')[1].split('.')[0];
        console.log(`Extracted project from email: ${projectFromEmail}`);
        
        // Check if this project is already in our list
        const currentProjects = vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).get<any[]>('projects') || [];
        const projectExists = currentProjects.some(p => p.projectId === projectFromEmail);
        
        if (!projectExists) {
          // Add the project to our list
          currentProjects.push({
            projectId: projectFromEmail,
            name: projectFromEmail,
            enabled: true
          });
          
          await vscode.workspace.getConfiguration('bigquery').update('projects', currentProjects, vscode.ConfigurationTarget.Global);
          console.log(`BigQuery project auto-configured from email: ${projectFromEmail}`);
        }
        return;
      }
    }
    
    console.log('No project could be auto-configured');
  } catch (error) {
    console.error('Error auto-configuring project:', error);
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('BigQuery Data Vibe extension is now active!');
  vscode.window.showInformationMessage('BigQuery Data Vibe extension activated!');
  
  // Initialize BigQuery service
  const bigQueryService = new BigQueryService();
  
  // Register BigQuery Explorer
  const bigQueryExplorerProvider = new BigQueryExplorerProvider(bigQueryService);
  
  // Create the tree view
  const treeView = vscode.window.createTreeView('bigqueryExplorer', {
    treeDataProvider: bigQueryExplorerProvider
  });
  
  context.subscriptions.push(treeView);
  
  // Auto-configure project from Google Cloud extension
  autoConfigureProject(bigQueryService).then(() => {
    // Refresh the tree view after auto-configuration
    bigQueryExplorerProvider.refresh();
  });

  // Track open table tabs for persistence
  const openTableTabs: Map<string, vscode.WebviewPanel> = new Map();

  // Restore open table tabs from previous session
  restoreOpenTableTabs(context, bigQueryService, openTableTabs);

  // Register BigQuery commands first
  console.log('Registering BigQuery commands...');
  
  // Test command to verify extension is working
  context.subscriptions.push(
    vscode.commands.registerCommand('bigquery.test', async () => {
      try {
        console.log('[DEBUG] Test command called');
        
        // Test authentication
        const session = await vscode.authentication.getSession(GOOGLE_CLOUD_AUTH_PROVIDER, GOOGLE_CLOUD_SCOPES, { createIfNone: false });
        
        if (session) {
          console.log('[DEBUG] Test - Found session:', session.account.label);
          console.log('[DEBUG] Test - Session scopes:', session.scopes);
          console.log('[DEBUG] Test - Access token present:', !!session.accessToken);
          
          // Test BigQuery service
          const bigQueryService = new BigQueryService();
          const authenticated = await bigQueryService.authenticate();
          console.log('[DEBUG] Test - BigQuery service authenticated:', authenticated);
          
          // Test a simple BigQuery API call
          if (authenticated) {
            try {
              const projects = vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).get<any[]>('projects') || [];
              if (projects.length > 0) {
                const firstProject = projects[0];
                console.log('[DEBUG] Test - Testing API call with project:', firstProject.projectId);
                const datasets = await bigQueryService.listDatasets(firstProject.projectId);
                console.log('[DEBUG] Test - API call successful, found datasets:', datasets.length);
                vscode.window.showInformationMessage(`BigQuery Data Vibe extension is working! Authentication: OK, API: OK (${datasets.length} datasets)`);
              } else {
                vscode.window.showInformationMessage(`BigQuery Data Vibe extension is working! Authentication: OK, No projects configured`);
              }
            } catch (apiError) {
              console.error('[DEBUG] Test - API call failed:', apiError);
              vscode.window.showInformationMessage(`BigQuery Data Vibe extension is working! Authentication: OK, API: Failed - ${apiError}`);
            }
          } else {
            vscode.window.showInformationMessage(`BigQuery Data Vibe extension is working! Authentication: Failed`);
          }
        } else {
          console.log('[DEBUG] Test - No session found');
          vscode.window.showInformationMessage('BigQuery Data Vibe extension is working! No authentication session found.');
        }
      } catch (error) {
        console.error('[DEBUG] Test - Error:', error);
        vscode.window.showInformationMessage(`BigQuery Data Vibe extension is working! Error: ${error}`);
      }
    })
  );

  // Function to reveal table in explorer by efficiently navigating the tree
  async function revealTableInExplorer(projectId: string, datasetId: string, tableId: string) {
    try {
      console.log(`[DEBUG] revealTableInExplorer called with: projectId=${projectId}, datasetId=${datasetId}, tableId=${tableId}`);
      
      // Show progress notification
      vscode.window.showInformationMessage(`Revealing table: ${tableId}...`);
      
      // Get all projects (this is fast, just reads from config)
      const projects = await bigQueryExplorerProvider.getChildren();
      console.log(`[DEBUG] Found ${projects?.length || 0} projects`);
      
      // Find the target project
      const projectItem = projects?.find(item => item.id === projectId);
      if (!projectItem) {
        vscode.window.showErrorMessage(`Project ${projectId} not found in explorer`);
        return;
      }
      
      // First, reveal and expand the project
      await treeView.reveal(projectItem, { expand: true, focus: false, select: false });
      console.log(`[DEBUG] Revealed and expanded project: ${projectId}`);
      
      // Wait a bit for the tree to expand
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get datasets for the project (only if not already loaded)
      const datasets = await bigQueryExplorerProvider.getChildren(projectItem);
      console.log(`[DEBUG] Found ${datasets?.length || 0} datasets in project ${projectId}`);
      
      // Find the target dataset
      const datasetItem = datasets?.find(item => item.id === datasetId);
      if (!datasetItem) {
        vscode.window.showErrorMessage(`Dataset ${datasetId} not found in project ${projectId}`);
        return;
      }
      
      // Reveal and expand the dataset
      await treeView.reveal(datasetItem, { expand: true, focus: false, select: false });
      console.log(`[DEBUG] Revealed and expanded dataset: ${datasetId}`);
      
      // Wait a bit for the tree to expand
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get tables for the dataset (only if not already loaded)
      const tables = await bigQueryExplorerProvider.getChildren(datasetItem);
      console.log(`[DEBUG] Found ${tables?.length || 0} tables in dataset ${datasetId}`);
      
      // Find the target table
      const tableItem = tables?.find(item => item.id === tableId);
      if (!tableItem) {
        vscode.window.showErrorMessage(`Table ${tableId} not found in dataset ${datasetId}`);
        return;
      }
      
      // Finally, reveal the table with focus and selection
      await treeView.reveal(tableItem, { expand: false, focus: true, select: true });
      
      vscode.window.showInformationMessage(`✅ Table ${tableId} revealed in explorer!`);
      console.log(`[DEBUG] Successfully revealed table ${tableId} in explorer`);
      
    } catch (error) {
      console.error('[DEBUG] Error in revealTableInExplorer:', error);
      vscode.window.showErrorMessage(`Failed to reveal table: ${error}`);
    }
  }

  // Function to restore open table tabs
  async function restoreOpenTableTabs(context: vscode.ExtensionContext, bigQueryService: BigQueryService, openTableTabs: Map<string, vscode.WebviewPanel>) {
    const savedTabs = context.globalState.get<Array<{
      id: string;
      title: string;
      projectId: string;
      datasetId: string;
      tableId: string;
      type: string;
    }>>('openTableTabs', []);

    console.log(`Restoring ${savedTabs.length} open table tabs...`);

    for (const savedTab of savedTabs) {
      try {
        // Create a new webview panel for the saved tab
        const panel = vscode.window.createWebviewPanel(
          'bigqueryTableMetadata',
          savedTab.title,
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [context.extensionUri]
          }
        );

        // Set up the webview with Angular
        panel.webview.html = getHtmlForWebview(panel.webview, context);

                  // Handle messages from the webview
          panel.webview.onDidReceiveMessage(async message => {
            if (message.type === 'ready') {
              try {
                // Fetch table metadata
                const metadata = await bigQueryService.getTableMetadata(
                  savedTab.projectId,
                  savedTab.datasetId,
                  savedTab.tableId
                );

                // Send metadata to the webview
                panel.webview.postMessage({
                  type: 'tableMetadata',
                  metadata: metadata
                });
              } catch (error) {
                console.error('Error loading table metadata:', error);
                panel.webview.postMessage({
                  type: 'tableError',
                  error: `Failed to load table metadata: ${error}`
                });
              }
            } else if (message.type === 'revealInExplorer') {
              console.log(`[DEBUG] Received revealInExplorer message from restored tab:`, message);
              await revealTableInExplorer(message.projectId, message.datasetId, message.tableId);
            }
          });

        // Track the panel
        openTableTabs.set(savedTab.id, panel);

        // Handle panel disposal
        panel.onDidDispose(() => {
          openTableTabs.delete(savedTab.id);
          saveOpenTableTabs(context, openTableTabs);
        });

        // Handle panel focus to highlight table in explorer
        panel.onDidChangeViewState(e => {
          if (e.webviewPanel.active) {
            // Reveal the table in explorer when the tab is focused
            revealTableInExplorer(savedTab.projectId, savedTab.datasetId, savedTab.tableId);
          }
        });

        console.log(`Restored tab: ${savedTab.title}`);
      } catch (error) {
        console.error(`Failed to restore tab ${savedTab.title}:`, error);
      }
    }
  }

  // Function to save open table tabs
  function saveOpenTableTabs(context: vscode.ExtensionContext, openTableTabs: Map<string, vscode.WebviewPanel>) {
    const tabsToSave = Array.from(openTableTabs.entries()).map(([id, panel]) => {
      // Parse the tab ID to extract project, dataset, and table info
      const parts = id.split('.');
      return {
        id,
        title: panel.title,
        projectId: parts[0] || '',
        datasetId: parts[1] || '',
        tableId: parts[2] || '',
        type: 'table'
      };
    });
    
    context.globalState.update('openTableTabs', tabsToSave);
  }

  // Command to sign in to Google Cloud
  context.subscriptions.push(
    vscode.commands.registerCommand('bigquery.signIn', async () => {
      try {
        console.log('[DEBUG] bigquery.signIn command called');
        
        const session = await SharedAuthService.getInstance().getSession();
        
        if (session) {
          console.log('[DEBUG] Authentication successful');
          console.log('[DEBUG] Session scopes:', session.scopes);
          console.log('[DEBUG] Session account:', session.account.label);
          vscode.window.showInformationMessage('Successfully signed in to Google Cloud!');
          bigQueryExplorerProvider.refresh();
        } else {
          console.log('[DEBUG] Authentication failed');
          vscode.window.showErrorMessage('Failed to sign in to Google Cloud');
        }
      } catch (error) {
        console.error('[DEBUG] Error in signIn command:', error);
        vscode.window.showErrorMessage(`Sign in failed: ${error}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bigquery.refresh', () => {
      console.log('bigquery.refresh command executed');
      bigQueryExplorerProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bigquery.addProject', async () => {
      console.log('bigquery.addProject command executed');
      
      const projectId = await vscode.window.showInputBox({
        prompt: 'Enter your Google Cloud project ID',
        placeHolder: 'my-project-id',
        validateInput: (value) => {
          if (!value || value.trim() === '') {
            return 'Project ID is required';
          }
          if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(value)) {
            return 'Project ID must be 6-30 characters long and contain only lowercase letters, numbers, and hyphens. It must start with a letter and cannot end with a hyphen.';
          }
          return null;
        }
      });

      if (projectId) {
        const displayName = await vscode.window.showInputBox({
          prompt: 'Enter a display name for this project (optional)',
          placeHolder: projectId,
          value: projectId
        });

        const currentProjects = vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).get<any[]>('projects') || [];
        
        // Check if project already exists
        const projectExists = currentProjects.some(p => p.projectId === projectId);
        if (projectExists) {
          vscode.window.showWarningMessage(`Project ${projectId} is already configured`);
          return;
        }

        // Add the new project
        currentProjects.push({
          projectId: projectId,
          name: displayName || projectId,
          enabled: true
        });

        await vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).update('projects', currentProjects, vscode.ConfigurationTarget.Global);
        bigQueryExplorerProvider.refresh();
        vscode.window.showInformationMessage(`Project ${projectId} added successfully`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bigquery.configureProject', async () => {
      console.log('bigquery.configureProject command executed');
      
      // Open the extension settings
      await vscode.commands.executeCommand('workbench.action.openSettings', 'bigquery.projects');
      
      // Show a helpful message
      vscode.window.showInformationMessage('Add your Google Cloud projects in the settings. Each project should have a projectId and optional display name.');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bigquery.openTable', async (item: BigQueryTreeItem) => {
      console.log(`[DEBUG] bigquery.openTable command called with item:`, item);
      console.log(`[DEBUG] Item type: ${item.type}, projectId: ${item.projectId}, datasetId: ${item.datasetId}, id: ${item.id}`);
      
      if (item.type === 'table' || item.type === 'view') {
        try {
          console.log(`[DEBUG] Creating webview panel for ${item.type}: ${item.label}`);
          
          // Create a unique ID for this tab
          const tabId = `${item.projectId}.${item.datasetId}.${item.id}`;
          console.log(`[DEBUG] Tab ID created: ${tabId}`);
          
          // Create a custom webview panel with full table reference in title
          const panel = vscode.window.createWebviewPanel(
            'bigqueryTableMetadata',
            `${item.projectId}.${item.datasetId}.${item.id} - BigQuery Table`,
            vscode.ViewColumn.One,
            {
              enableScripts: true,
              retainContextWhenHidden: true,
              localResourceRoots: [context.extensionUri]
            }
          );
          console.log(`[DEBUG] Webview panel created successfully`);

          // Set up the webview with Angular
          panel.webview.html = getHtmlForWebview(panel.webview, context);
          console.log(`[DEBUG] Webview HTML set successfully`);

          // Handle messages from the webview
          panel.webview.onDidReceiveMessage(async message => {
            console.log(`[DEBUG] Received message from webview:`, message);
            if (message.type === 'ready') {
              try {
                // Fetch table metadata
                const metadata = await bigQueryService.getTableMetadata(
                  item.projectId!,
                  item.datasetId!,
                  item.id!
                );

                // Send metadata to the webview
                panel.webview.postMessage({
                  type: 'tableMetadata',
                  metadata: metadata
                });
                console.log(`[DEBUG] Table metadata sent to webview successfully`);
              } catch (error) {
                console.error('[DEBUG] Error loading table metadata:', error);
                panel.webview.postMessage({
                  type: 'tableError',
                  error: `Failed to load table metadata: ${error}`
                });
              }
            } else if (message.type === 'revealInExplorer') {
              console.log(`[DEBUG] Received revealInExplorer message:`, message);
              await revealTableInExplorer(message.projectId, message.datasetId, message.tableId);
            }
          });

          // Track the panel for persistence
          openTableTabs.set(tabId, panel);
          console.log(`[DEBUG] Panel tracked for persistence`);

          // Handle panel disposal
          panel.onDidDispose(() => {
            console.log(`[DEBUG] Panel disposed, removing from tracking`);
            openTableTabs.delete(tabId);
            saveOpenTableTabs(context, openTableTabs);
          });

          // Handle panel focus to highlight table in explorer
          panel.onDidChangeViewState(e => {
            console.log(`[DEBUG] Panel view state changed, active: ${e.webviewPanel.active}`);
            if (e.webviewPanel.active) {
              // Reveal the table in explorer when the tab is focused
              console.log(`[DEBUG] Panel is active, calling revealTableInExplorer`);
              revealTableInExplorer(item.projectId!, item.datasetId!, item.id!);
            }
          });

          // Save the tab state
          saveOpenTableTabs(context, openTableTabs);
          console.log(`[DEBUG] Tab state saved`);

          // Reveal the table in explorer immediately when opened
          console.log(`[DEBUG] Calling revealTableInExplorer immediately`);
          revealTableInExplorer(item.projectId!, item.datasetId!, item.id!);

          vscode.window.showInformationMessage(`Opened ${item.type}: ${item.label}`);
          console.log(`[DEBUG] Success message shown`);
        } catch (error) {
          console.error('[DEBUG] Error in openTable command:', error);
          vscode.window.showErrorMessage(`Failed to open ${item.type}: ${error}`);
        }
      } else {
        console.log(`[DEBUG] Item type is not table or view: ${item.type}`);
      }
    })
  );



  context.subscriptions.push(
    vscode.commands.registerCommand('bigquery.disableProject', async (item: BigQueryTreeItem) => {
      if (item.type === 'project') {
        const currentProjects = vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).get<any[]>('projects') || [];
        const projectIndex = currentProjects.findIndex(p => p.projectId === item.id);
        
        if (projectIndex !== -1) {
          currentProjects[projectIndex].enabled = false;
          await vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).update('projects', currentProjects, vscode.ConfigurationTarget.Global);
          bigQueryExplorerProvider.refresh();
          vscode.window.showInformationMessage(`Project ${item.label} disabled`);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bigquery.removeProject', async (item: BigQueryTreeItem) => {
      if (item.type === 'project') {
        const result = await vscode.window.showWarningMessage(
          `Are you sure you want to remove project "${item.label}"?`,
          'Yes',
          'No'
        );
        
        if (result === 'Yes') {
          const currentProjects = vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).get<any[]>('projects') || [];
          const updatedProjects = currentProjects.filter(p => p.projectId !== item.id);
          
          await vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).update('projects', updatedProjects, vscode.ConfigurationTarget.Global);
          bigQueryExplorerProvider.refresh();
          vscode.window.showInformationMessage(`Project ${item.label} removed`);
        }
      }
    })
  );

  // Debug authentication command

  // Command to expose open table information for other extensions
  context.subscriptions.push(
    vscode.commands.registerCommand('bigquery.getOpenTables', () => {
      const openTables = Array.from(openTableTabs.entries()).map(([id, panel]) => {
        const parts = id.split('.');
        return {
          id,
          title: panel.title,
          projectId: parts[0] || '',
          datasetId: parts[1] || '',
          tableId: parts[2] || '',
          type: 'table'
        };
      });
      
      console.log('[BigQuery] Exposing open tables:', openTables);
      return openTables;
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bigquery.debugAuth', async () => {
      try {
        console.log('[DEBUG] Debug authentication command called');
        
        // Check if the shared authentication service is available
        const session = await SharedAuthService.getInstance().getSession();
        
        let debugInfo = '=== BigQuery Authentication Debug Info ===\n\n';
        
        if (session) {
          debugInfo += `✅ Authentication Session Found:\n`;
          debugInfo += `- Account: ${session.account.label}\n`;
          debugInfo += `- Scopes: ${session.scopes.join(', ')}\n`;
          debugInfo += `- Access Token: ${session.accessToken ? 'Present' : 'Missing'}\n\n`;
          
          // Test BigQuery service
          const bigQueryService = new BigQueryService();
          const authenticated = await bigQueryService.authenticate();
          
          debugInfo += `BigQuery Service Authentication: ${authenticated ? '✅ OK' : '❌ Failed'}\n\n`;
          
          if (authenticated) {
            // Test API call
            const projects = vscode.workspace.getConfiguration(CONFIG_SECTIONS.BIGQUERY).get<any[]>('projects') || [];
            if (projects.length > 0) {
              try {
                const datasets = await bigQueryService.listDatasets(projects[0].projectId);
                debugInfo += `✅ API Test: Successfully retrieved ${datasets.length} datasets from ${projects[0].projectId}\n`;
              } catch (apiError) {
                debugInfo += `❌ API Test Failed: ${apiError}\n`;
              }
            } else {
              debugInfo += `⚠️ No projects configured in settings\n`;
            }
          }
        } else {
          debugInfo += `❌ No Authentication Session Found\n`;
          debugInfo += `- This could be because:\n`;
          debugInfo += `  1. The google-cloud-authentication extension is not installed/enabled\n`;
          debugInfo += `  2. You haven't signed in to Google Cloud\n`;
          debugInfo += `  3. The authentication provider is not working properly\n\n`;
          
          debugInfo += `Try running the "Sign in to Google Cloud" command first.\n`;
        }
        
        // Show debug info in a new document
        const uri = vscode.Uri.parse('untitled:bigquery-auth-debug.txt');
        const document = await vscode.workspace.openTextDocument(uri);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(uri, new vscode.Position(0, 0), debugInfo);
        await vscode.workspace.applyEdit(edit);
        
        await vscode.window.showTextDocument(document, { preview: false });
        vscode.window.showInformationMessage('Authentication debug info opened in new document');
        
      } catch (error) {
        console.error('[DEBUG] Error in debugAuth command:', error);
        vscode.window.showErrorMessage(`Debug authentication failed: ${error}`);
      }
    })
  );

  // Register CSV Tabular Editor
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'bqdev.csvTabularEditor',
      new CsvTabularEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    )
  );
}



function getHtmlForWebview(webview: vscode.Webview, context: vscode.ExtensionContext): string {
  const angularDistPath = vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'dist', 'webview-ui', 'browser');
  const indexHtmlPath = vscode.Uri.joinPath(angularDistPath, 'index.html');
  let html = fs.readFileSync(indexHtmlPath.fsPath, 'utf8');

  // Replace asset paths with webview URIs
  html = html.replace(/(src|href)=\"(.+?)\"/g, (match: string, attr: string, src: string) => {
    if (src.startsWith('http') || src.startsWith('//')) return match;
    const assetUri = webview.asWebviewUri(vscode.Uri.joinPath(angularDistPath, src));
    return `${attr}=\"${assetUri}\"`;
  });

  return html;
}

class CsvTabularEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true
    };
    const updateWebview = () => {
      webviewPanel.webview.html = getHtmlForWebview(webviewPanel.webview, this.context);
    };
    updateWebview();
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
    webviewPanel.webview.onDidReceiveMessage(message => {
      if (message.type === 'ready') {
        const csvText = document.getText();
        webviewPanel.webview.postMessage({
          type: 'csvData',
          csv: csvText
        });
      }
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const angularDistPath = vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'dist', 'webview-ui', 'browser');
    const indexHtmlPath = vscode.Uri.joinPath(angularDistPath, 'index.html');
    let html = fs.readFileSync(indexHtmlPath.fsPath, 'utf8');

    // Replace asset paths with webview URIs
    html = html.replace(/(src|href)=\"(.+?)\"/g, (match: string, attr: string, src: string) => {
      if (src.startsWith('http') || src.startsWith('//')) return match;
      const assetUri = webview.asWebviewUri(vscode.Uri.joinPath(angularDistPath, src));
      return `${attr}=\"${assetUri}\"`;
    });

    return html;
  }
}





export function deactivate() {}
