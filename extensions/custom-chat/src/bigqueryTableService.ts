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
        
        if (hasBigQueryInName || hasBqPrefix || isSqlFile) {
            console.log(`[BigQueryTableService] ✅ File matches criteria, analyzing...`);
            
            // Try to extract project, dataset, table from the file path or content
            console.log(`[BigQueryTableService] Trying to parse from filename...`);
            const tableInfo = this.parseTableInfoFromFileName(fileName);
            if (tableInfo) {
                console.log(`[BigQueryTableService] ✅ Found table info from filename: ${tableInfo.projectId}.${tableInfo.datasetId}.${tableInfo.tableId}`);
                return tableInfo;
            } else {
                console.log(`[BigQueryTableService] ❌ No table info found in filename`);
            }
            
            // If no pattern match, try to extract from SQL content
            console.log(`[BigQueryTableService] Trying to parse from SQL content...`);
            const sqlContent = document.getText();
            console.log(`[BigQueryTableService] SQL content length: ${sqlContent.length} characters`);
            console.log(`[BigQueryTableService] SQL content preview: ${sqlContent.substring(0, 200)}...`);
            
            const tableInfoFromSQL = this.parseTableInfoFromSQL(sqlContent);
            if (tableInfoFromSQL) {
                console.log(`[BigQueryTableService] ✅ Found table info from SQL: ${tableInfoFromSQL.projectId}.${tableInfoFromSQL.datasetId}.${tableInfoFromSQL.tableId}`);
                return tableInfoFromSQL;
            } else {
                console.log(`[BigQueryTableService] ❌ No table info found in SQL content`);
            }
        } else {
            console.log(`[BigQueryTableService] ❌ File does not match any criteria`);
        }

        console.log(`[BigQueryTableService] === End extractTableInfoFromTab() ===`);
        return null;
    }

    /**
     * Parse table information from file name
     * Expected format: project.dataset.table or similar
     */
    private parseTableInfoFromFileName(fileName: string): BigQueryTableReference | null {
        console.log(`[BigQueryTableService] parseTableInfoFromFileName: ${fileName}`);
        
        // Remove path and extension
        const baseName = fileName.split('/').pop()?.split('\\').pop()?.split('.')[0];
        console.log(`[BigQueryTableService] Base name: ${baseName}`);
        
        if (!baseName) {
            console.log(`[BigQueryTableService] No base name found`);
            return null;
        }

        // Try different patterns
        const patterns = [
            /^([^.]+)\.([^.]+)\.([^.]+)$/, // project.dataset.table
            /^([^.]+)_([^.]+)_([^.]+)$/,   // project_dataset_table
            /^bq_([^.]+)_([^.]+)_([^.]+)$/ // bq_project_dataset_table
        ];

        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            console.log(`[BigQueryTableService] Trying pattern ${i + 1}: ${pattern}`);
            const match = baseName.match(pattern);
            if (match) {
                console.log(`[BigQueryTableService] ✅ Pattern ${i + 1} matched:`, match);
                return {
                    projectId: match[1],
                    datasetId: match[2],
                    tableId: match[3]
                };
            } else {
                console.log(`[BigQueryTableService] ❌ Pattern ${i + 1} did not match`);
            }
        }

        console.log(`[BigQueryTableService] No patterns matched`);
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
     * Get table information from webview panels
     * This would need to be implemented with communication between extensions
     */
    private async getTableInfoFromWebviews(): Promise<BigQueryTableReference[]> {
        // For now, we'll return an empty array
        // In a full implementation, we would need to:
        // 1. Communicate with the BigQuery extension
        // 2. Get the list of open webview panels
        // 3. Extract table information from each panel
        
        // TODO: Implement communication with BigQuery extension
        console.log('[BigQueryTableService] Webview table detection not yet implemented');
        return [];
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