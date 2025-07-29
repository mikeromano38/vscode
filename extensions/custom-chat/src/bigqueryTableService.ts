import * as vscode from 'vscode';
import { BigQueryTableReference } from './configHelper';

/**
 * Service to get currently open BigQuery table tabs
 * and convert them to data source references for the Conversational Analytics API
 */
export class BigQueryTableService {
    private static instance: BigQueryTableService;

    private constructor() {}

    public static getInstance(): BigQueryTableService {
        if (!BigQueryTableService.instance) {
            BigQueryTableService.instance = new BigQueryTableService();
        }
        return BigQueryTableService.instance;
    }

    /**
     * Get all currently open BigQuery table tabs
     */
    public async getOpenTableTabs(): Promise<BigQueryTableReference[]> {
        console.log('[BigQueryTableService] === Starting getOpenTableTabs() ===');
        const openTabs: BigQueryTableReference[] = [];
        
        // Get all visible text editors
        const visibleEditors = vscode.window.visibleTextEditors;
        console.log('[BigQueryTableService] Found visible editors:', visibleEditors.length);
        
        for (let i = 0; i < visibleEditors.length; i++) {
            const editor = visibleEditors[i];
            console.log(`[BigQueryTableService] Checking editor ${i + 1}/${visibleEditors.length}:`);
            console.log(`  - File: ${editor.document.fileName}`);
            console.log(`  - Language: ${editor.document.languageId}`);
            console.log(`  - URI: ${editor.document.uri.toString()}`);
            
            const tab = this.extractTableInfoFromTab(editor);
            if (tab) {
                console.log(`[BigQueryTableService] ✅ Found table info: ${tab.projectId}.${tab.datasetId}.${tab.tableId}`);
                openTabs.push(tab);
            } else {
                console.log(`[BigQueryTableService] ❌ No table info found for this editor`);
            }
        }

        // Also check webview panels (BigQuery table tabs are webviews)
        console.log('[BigQueryTableService] Checking webview panels...');
        const webviewTabs = await this.getTableInfoFromWebviews();
        console.log('[BigQueryTableService] Webview tabs found:', webviewTabs.length);
        openTabs.push(...webviewTabs);

        console.log('[BigQueryTableService] === Final result ===');
        console.log('[BigQueryTableService] Total open table tabs found:', openTabs.length);
        console.log('[BigQueryTableService] Open table tabs:', JSON.stringify(openTabs, null, 2));
        console.log('[BigQueryTableService] === End getOpenTableTabs() ===');
        return openTabs;
    }

    /**
     * Extract table information from a text editor tab
     */
    private extractTableInfoFromTab(editor: vscode.TextEditor): BigQueryTableReference | null {
        const document = editor.document;
        const fileName = document.fileName;
        const languageId = document.languageId;
        
        console.log(`[BigQueryTableService] === extractTableInfoFromTab() ===`);
        console.log(`[BigQueryTableService] File: ${fileName}`);
        console.log(`[BigQueryTableService] Language: ${languageId}`);
        console.log(`[BigQueryTableService] URI: ${document.uri.toString()}`);
        
        // Check if this is a BigQuery table file
        // BigQuery table files typically have a specific naming pattern
        // or are in a specific location
        const hasBigQueryInName = fileName.includes('bigquery');
        const hasBqPrefix = fileName.includes('bq_');
        const isSqlFile = languageId === 'sql' || fileName.endsWith('.sql');
        
        console.log(`[BigQueryTableService] Checks:`);
        console.log(`  - Has 'bigquery' in name: ${hasBigQueryInName}`);
        console.log(`  - Has 'bq_' prefix: ${hasBqPrefix}`);
        console.log(`  - Is SQL file: ${isSqlFile}`);

        console.log(`[BigQueryTableService] === End extractTableInfoFromTab() ===`);
        return null;
    }

    /**
     * Parse table information from SQL content
     * Look for FROM, JOIN, or table references in SQL
     */
    private parseTableInfoFromSQL(sqlContent: string): BigQueryTableReference | null {
        console.log(`[BigQueryTableService] parseTableInfoFromSQL: analyzing SQL content`);
        
        // Common patterns for BigQuery table references in SQL
        const patterns = [
            /FROM\s+`?([^.]+)\.([^.]+)\.([^.]+)`?/i,
            /JOIN\s+`?([^.]+)\.([^.]+)\.([^.]+)`?/i,
            /`([^.]+)\.([^.]+)\.([^.]+)`/,
            /([^.]+)\.([^.]+)\.([^.]+)/
        ];

        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            console.log(`[BigQueryTableService] Trying SQL pattern ${i + 1}: ${pattern}`);
            const match = sqlContent.match(pattern);
            if (match) {
                // Skip if it looks like a function call or other non-table reference
                const fullMatch = match[0];
                if (fullMatch.includes('(') || fullMatch.includes(')')) {
                    console.log(`[BigQueryTableService] Skipping match with parentheses: ${fullMatch}`);
                    continue;
                }
                
                console.log(`[BigQueryTableService] ✅ SQL pattern ${i + 1} matched:`, match);
                return {
                    projectId: match[1],
                    datasetId: match[2],
                    tableId: match[3]
                };
            } else {
                console.log(`[BigQueryTableService] ❌ SQL pattern ${i + 1} did not match`);
            }
        }

        console.log(`[BigQueryTableService] No SQL patterns matched`);
        return null;
    }

    /**
     * Parse table information from tab title
     */
    private parseTableInfoFromTabTitle(title: string): BigQueryTableReference | null {
        console.log(`[BigQueryTableService] parseTableInfoFromTabTitle: ${title}`);
        
        // BigQuery table tabs typically have titles like "table_name - BigQuery Table"
        // or "project.dataset.table - BigQuery Table"
        const patterns = [
            /^([^.]+)\.([^.]+)\.([^.]+)\s*-\s*BigQuery\s*Table$/i,
            /^([^.]+)\.([^.]+)\.([^.]+)\s*-\s*BigQuery\s*Metadata$/i,
            /^([^.]+)\.([^.]+)\.([^.]+)$/,
            /^([^.]+)_([^.]+)_([^.]+)\s*-\s*BigQuery\s*Table$/i
        ];
        
        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            console.log(`[BigQueryTableService] Trying tab title pattern ${i + 1}: ${pattern}`);
            const match = title.match(pattern);
            if (match) {
                console.log(`[BigQueryTableService] ✅ Tab title pattern ${i + 1} matched:`, match);
                return {
                    projectId: match[1],
                    datasetId: match[2],
                    tableId: match[3]
                };
            } else {
                console.log(`[BigQueryTableService] ❌ Tab title pattern ${i + 1} did not match`);
            }
        }
        
        console.log('[BigQueryTableService] No tab title patterns matched');
        return null;
    }

    /**
     * Parse table information from webview content
     */
    private parseTableInfoFromWebviewContent(content: string): BigQueryTableReference | null {
        console.log('[BigQueryTableService] parseTableInfoFromWebviewContent: analyzing content');
        
        // Look for BigQuery table references in the content
        // The content might contain JSON with table metadata
        const patterns = [
            /"projectId"\s*:\s*"([^"]+)"/,
            /"datasetId"\s*:\s*"([^"]+)"/,
            /"tableId"\s*:\s*"([^"]+)"/,
            /projectId['"]?\s*:\s*['"]([^'"]+)['"]/,
            /datasetId['"]?\s*:\s*['"]([^'"]+)['"]/,
            /tableId['"]?\s*:\s*['"]([^'"]+)['"]/
        ];
        
        let projectId: string | null = null;
        let datasetId: string | null = null;
        let tableId: string | null = null;
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                const value = match[1];
                if (pattern.source.includes('projectId')) {
                    projectId = value;
                } else if (pattern.source.includes('datasetId')) {
                    datasetId = value;
                } else if (pattern.source.includes('tableId')) {
                    tableId = value;
                }
            }
        }
        
        if (projectId && datasetId && tableId) {
            console.log('[BigQueryTableService] ✅ Found table info from webview content:', { projectId, datasetId, tableId });
            return { projectId, datasetId, tableId };
        }
        
        console.log('[BigQueryTableService] ❌ No table info found in webview content');
        return null;
    }

    /**
     * Get table information from webview panels
     * This would need to be implemented with communication between extensions
     */
    private async getTableInfoFromWebviews(): Promise<BigQueryTableReference[]> {
        console.log('[BigQueryTableService] === Starting getTableInfoFromWebviews() ===');
        const webviewTabs: BigQueryTableReference[] = [];
        
        try {
            // Try to detect BigQuery tables from tab titles
            console.log('[BigQueryTableService] Checking tab titles for BigQuery references...');
            const tabGroups = vscode.window.tabGroups.all;
            console.log('[BigQueryTableService] Total tab groups found:', tabGroups.length);
            
            for (const tabGroup of tabGroups) {
                console.log(`[BigQueryTableService] Checking tab group: ${tabGroup.viewColumn} (tabs: ${tabGroup.tabs.length})`);
                for (const tab of tabGroup.tabs) {
                    console.log(`[BigQueryTableService] Tab: "${tab.label}" (type: ${tab.input ? tab.input.constructor.name : 'unknown'})`);
                    console.log(`[BigQueryTableService] Tab input:`, tab.input);
                    
                    if (tab.input && tab.input instanceof vscode.TabInputWebview) {
                        console.log('[BigQueryTableService] Found webview tab:', tab.label);
                        console.log('[BigQueryTableService] Webview viewType:', tab.input.viewType);
                        
                        // Check if this is a BigQuery webview by viewType
                        if (tab.input.viewType === 'bigqueryTableMetadata' || tab.input.viewType === 'mainThreadWebview-bigqueryTableMetadata') {
                            console.log('[BigQueryTableService] ✅ Found BigQuery webview by viewType');
                            
                            // Try to get table info from the BigQuery extension's command
                            try {
                                const openTables = await vscode.commands.executeCommand('bigquery.getOpenTables');
                                console.log('[BigQueryTableService] Open tables from BigQuery extension:', openTables);
                                
                                if (openTables && Array.isArray(openTables)) {
                                    // Find the matching table by title
                                    const matchingTable = openTables.find((table: any) => table.title === tab.label);
                                    if (matchingTable) {
                                        const tableInfo = {
                                            projectId: matchingTable.projectId,
                                            datasetId: matchingTable.datasetId,
                                            tableId: matchingTable.tableId
                                        };
                                        console.log('[BigQueryTableService] ✅ Found table info from BigQuery extension:', tableInfo);
                                        webviewTabs.push(tableInfo);
                                        continue; // Skip the fallback parsing
                                    }
                                }
                            } catch (error) {
                                console.log('[BigQueryTableService] Error getting open tables from BigQuery extension:', error);
                            }
                            
                            // Fallback: Try to extract table info from the title
                            const tableInfo = this.parseTableInfoFromTabTitle(tab.label);
                            if (tableInfo) {
                                console.log('[BigQueryTableService] ✅ Found table info from tab title:', tableInfo);
                                webviewTabs.push(tableInfo);
                            } else {
                                console.log('[BigQueryTableService] ❌ No table info found in tab title, but it is a BigQuery webview');
                                // Log the exact title for debugging
                                console.log('[BigQueryTableService] BigQuery webview tab title for debugging:', JSON.stringify(tab.label));
                                
                                // Try to extract from the title without the " - BigQuery Table" suffix
                                const titleWithoutSuffix = tab.label.replace(/\s*-\s*BigQuery\s*Table$/i, '');
                                console.log('[BigQueryTableService] Title without suffix:', titleWithoutSuffix);
                                
                                // Try to parse as project.dataset.table format first
                                const parts = titleWithoutSuffix.split('.');
                                if (parts.length === 3) {
                                    const tableInfo = {
                                        projectId: parts[0],
                                        datasetId: parts[1],
                                        tableId: parts[2]
                                    };
                                    console.log('[BigQueryTableService] ✅ Extracted table info from title parts:', tableInfo);
                                    webviewTabs.push(tableInfo);
                                } else {
                                    console.log('[BigQueryTableService] ❌ Could not parse title parts:', parts);
                                    
                                    // If it's just a table name, we need to get the project and dataset from somewhere else
                                    // For now, let's use a default project and dataset, and the table name
                                    console.log('[BigQueryTableService] Using default project/dataset for table:', titleWithoutSuffix);
                                    
                                    // Try to get project from configuration
                                    const config = vscode.workspace.getConfiguration('google-cloud');
                                    const projectId = config.get<string>('projectId') || 'bigquery-public-data';
                                    
                                    const tableInfo = {
                                        projectId: projectId,
                                        datasetId: 'default_dataset', // This is a placeholder
                                        tableId: titleWithoutSuffix
                                    };
                                    console.log('[BigQueryTableService] ✅ Created table info with defaults:', tableInfo);
                                    webviewTabs.push(tableInfo);
                                }
                            }
                        } else {
                            // Check if the tab title contains "BigQuery Table" (fallback for any BigQuery webview)
                            if (tab.label.includes('BigQuery Table')) {
                                console.log('[BigQueryTableService] ✅ Found BigQuery webview by title pattern');
                                
                                // Extract table name from title
                                const titleWithoutSuffix = tab.label.replace(/\s*-\s*BigQuery\s*Table$/i, '');
                                console.log('[BigQueryTableService] Title without suffix:', titleWithoutSuffix);
                                
                                // Try to parse as project.dataset.table format first
                                const parts = titleWithoutSuffix.split('.');
                                if (parts.length === 3) {
                                    const tableInfo = {
                                        projectId: parts[0],
                                        datasetId: parts[1],
                                        tableId: parts[2]
                                    };
                                    console.log('[BigQueryTableService] ✅ Extracted table info from title parts:', tableInfo);
                                    webviewTabs.push(tableInfo);
                                } else {
                                    console.log('[BigQueryTableService] Using default project/dataset for table:', titleWithoutSuffix);
                                    
                                    // Try to get project from configuration
                                    const config = vscode.workspace.getConfiguration('google-cloud');
                                    const projectId = config.get<string>('projectId') || 'bigquery-public-data';
                                    
                                    const tableInfo = {
                                        projectId: projectId,
                                        datasetId: 'default_dataset', // This is a placeholder
                                        tableId: titleWithoutSuffix
                                    };
                                    console.log('[BigQueryTableService] ✅ Created table info with defaults:', tableInfo);
                                    webviewTabs.push(tableInfo);
                                }
                            } else {
                                // Check if the tab title contains BigQuery table information (other patterns)
                                const tableInfo = this.parseTableInfoFromTabTitle(tab.label);
                                if (tableInfo) {
                                    console.log('[BigQueryTableService] ✅ Found table info from tab title:', tableInfo);
                                    webviewTabs.push(tableInfo);
                                } else {
                                    console.log('[BigQueryTableService] ❌ No table info found in webview tab title');
                                    // Log the exact title for debugging
                                    console.log('[BigQueryTableService] Webview tab title for debugging:', JSON.stringify(tab.label));
                                }
                            }
                        }
                    } else {
                        console.log('[BigQueryTableService] Unknown tab input type:', tab.input);
                    }
                }
            }
            
            // Try to get information from the BigQuery extension's global state
            console.log('[BigQueryTableService] Attempting to get BigQuery extension state...');
            try {
                // Try to access the BigQuery extension's context
                const bigQueryExtension = vscode.extensions.getExtension('google.bigquery-data-vibe');
                if (bigQueryExtension) {
                    console.log('[BigQueryTableService] BigQuery extension found:', bigQueryExtension.id);
                    
                    // If the extension is active, we could potentially communicate with it
                    if (bigQueryExtension.isActive) {
                        console.log('[BigQueryTableService] BigQuery extension is active');
                        
                        // Try to access the extension's global state
                        // Note: This is a bit of a hack since we can't directly access another extension's context
                        // But we can try to infer from the extension's activation
                        console.log('[BigQueryTableService] Attempting to access BigQuery extension global state...');
                        
                        // Since we can't directly access another extension's global state,
                        // we'll rely on the tab title parsing and webview content parsing above
                        // The BigQuery extension stores open tabs in its global state, but we can't access it directly
                        console.log('[BigQueryTableService] Note: Cannot directly access BigQuery extension global state from another extension');
                    }
                } else {
                    console.log('[BigQueryTableService] BigQuery extension not found');
                }
            } catch (error) {
                console.log('[BigQueryTableService] Error accessing BigQuery extension:', error);
            }
            
        } catch (error) {
            console.error('[BigQueryTableService] Error in getTableInfoFromWebviews:', error);
        }
        
        console.log('[BigQueryTableService] === Final webview results ===');
        console.log('[BigQueryTableService] Webview tabs found:', webviewTabs.length);
        console.log('[BigQueryTableService] Webview tabs:', JSON.stringify(webviewTabs, null, 2));
        console.log('[BigQueryTableService] === End getTableInfoFromWebviews() ===');
        
        return webviewTabs;
    }

    /**
     * Get data sources configuration for currently open tables
     */
    public async getDataSourcesFromOpenTabs(): Promise<{ bq: { tableReferences: BigQueryTableReference[] } }> {
        console.log('[BigQueryTableService] === Starting getDataSourcesFromOpenTabs() ===');
        
        const openTabs = await this.getOpenTableTabs();
        console.log('[BigQueryTableService] Open tabs returned:', openTabs.length);
        
        if (openTabs.length === 0) {
            // Fallback to default if no open tables
            console.log('[BigQueryTableService] No open table tabs found, using default');
            const defaultResult = {
                bq: {
                    tableReferences: [
                        {
                            projectId: "bigquery-public-data",
                            datasetId: "san_francisco",
                            tableId: "street_trees"
                        }
                    ]
                }
            };
            console.log('[BigQueryTableService] Returning default data sources:', JSON.stringify(defaultResult, null, 2));
            return defaultResult;
        }

        const result = {
            bq: {
                tableReferences: openTabs
            }
        };
        console.log('[BigQueryTableService] Returning data sources from open tabs:', JSON.stringify(result, null, 2));
        console.log('[BigQueryTableService] === End getDataSourcesFromOpenTabs() ===');
        return result;
    }

    /**
     * Prompt user to select from open tables or use default
     */
    public async promptForDataSources(): Promise<{ bq: { tableReferences: BigQueryTableReference[] } }> {
        const openTabs = await this.getOpenTableTabs();
        
        if (openTabs.length === 0) {
            vscode.window.showInformationMessage('No BigQuery tables are currently open. Using default data source.');
            return {
                bq: {
                    tableReferences: [
                        {
                            projectId: "bigquery-public-data",
                            datasetId: "san_francisco",
                            tableId: "street_trees"
                        }
                    ]
                }
            };
        }

        // Create options for the user
        const options = [
            'Use all open tables',
            'Use default data source',
            'Select specific tables...'
        ];

        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select data sources for analysis'
        });

        if (selection === 'Use all open tables') {
            return {
                bq: {
                    tableReferences: openTabs
                }
            };
        } else if (selection === 'Use default data source') {
            return {
                bq: {
                    tableReferences: [
                        {
                            projectId: "bigquery-public-data",
                            datasetId: "san_francisco",
                            tableId: "street_trees"
                        }
                    ]
                }
            };
        } else if (selection === 'Select specific tables...') {
            // Create quick pick items for each open table
            const tableOptions = openTabs.map((tab: BigQueryTableReference) => ({
                label: `${tab.projectId}.${tab.datasetId}.${tab.tableId}`,
                description: `Project: ${tab.projectId}`,
                tab: tab
            }));

            const selectedTables = await vscode.window.showQuickPick(tableOptions, {
                placeHolder: 'Select tables to include',
                canPickMany: true
            });

            if (selectedTables && selectedTables.length > 0) {
                return {
                    bq: {
                        tableReferences: selectedTables.map((item: any) => item.tab)
                    }
                };
            }
        }

        // Default fallback
        return {
            bq: {
                tableReferences: [
                    {
                        projectId: "bigquery-public-data",
                        datasetId: "san_francisco",
                        tableId: "street_trees"
                    }
                ]
            }
        };
    }
} 