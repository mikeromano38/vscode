import * as vscode from 'vscode';
import { SharedAuthService } from './sharedAuthService';
import { CONFIG_SECTIONS } from './shared-constants';
import { BigQueryTableService } from './bigqueryTableService';

export interface BigQueryTableReference {
    projectId: string;
    datasetId: string;
    tableId: string;
}

export interface BigQueryDataSource {
    tableReferences: BigQueryTableReference[];
}

export interface DataSourceReferences {
    bq?: {
        tableReferences: BigQueryTableReference[];
    };
}

export interface AnalysisOptions {
    analysis?: {
        python?: {
            enabled: boolean;
        };
    };
}

export class ConfigHelper {
    private static readonly CONFIG_SECTION = CONFIG_SECTIONS.CUSTOM_CHAT;

    static getBillingProject(): string | undefined {
        // Get project from google-cloud configuration
        const googleCloudConfig = vscode.workspace.getConfiguration(CONFIG_SECTIONS.GOOGLE_CLOUD);
        const projectId = googleCloudConfig.get<string>('projectId', '');
        
        if (projectId) {
            return projectId;
        }
        
        // Fallback to custom chat configuration if google-cloud project is not set
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        const fallbackProject = config.get<string>('billingProject');
        return fallbackProject || undefined;
    }

    static async getDefaultDataSources(): Promise<DataSourceReferences> {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        const customDataSources = config.get<DataSourceReferences>('dataSources');
        
        
        if (customDataSources && customDataSources.bq?.tableReferences && customDataSources.bq.tableReferences.length > 0) {
            return customDataSources;
        }

        // Try to get data sources from currently open BigQuery table tabs
        const tableService = BigQueryTableService.getInstance();
        const openTableDataSources = await tableService.getDataSourcesFromOpenTabs();
        
        // If we have open tables, use them; otherwise use default
        if (openTableDataSources.bq.tableReferences.length > 0) {
            console.log('[ConfigHelper] Using open table tabs as data sources');
            return {
                bq: {
                    tableReferences: openTableDataSources.bq.tableReferences
                }
            };
        }

        // Default data sources if no open tables
        console.log('[ConfigHelper] Using default data sources');
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

    static getAnalysisOptions(): AnalysisOptions {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        // Disable Python analysis - always return false
        const pythonEnabled = false;
        
        return {
            analysis: {
                python: {
                    enabled: pythonEnabled
                }
            }
        };
    }

    static async promptForBillingProject(): Promise<string | undefined> {
        const currentProject = this.getBillingProject();
        
        const project = await vscode.window.showInputBox({
            prompt: 'Enter your Google Cloud project ID',
            value: currentProject || '',
            placeHolder: 'e.g., my-project-123456',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Project ID is required';
                }
                return null;
            }
        });

        if (project) {
            // Update the google-cloud configuration
            const googleCloudConfig = vscode.workspace.getConfiguration('google-cloud');
            await googleCloudConfig.update('projectId', project, vscode.ConfigurationTarget.Global);
        }

        return project;
    }

    static async promptForDataSources(): Promise<DataSourceReferences | undefined> {
        const currentSources = this.getDefaultDataSources();
        
        // For now, we'll use a simple approach. In a full implementation,
        // you might want to create a more sophisticated UI for managing data sources
        const useDefault = await vscode.window.showQuickPick(
            ['Use default (bigquery-public-data.san_francisco.street_trees)', 'Configure custom sources'],
            {
                placeHolder: 'Select data source configuration'
            }
        );

        if (useDefault === 'Use default (bigquery-public-data.san_francisco.street_trees)') {
            return currentSources;
        } else if (useDefault === 'Configure custom sources') {
            // For now, return the default. In a full implementation,
            // you would create a more sophisticated configuration UI
            vscode.window.showInformationMessage(
                'Custom data source configuration not yet implemented. Using default sources.'
            );
            return currentSources;
        }

        return undefined;
    }

    static async getGoogleCloudSession(): Promise<vscode.AuthenticationSession | undefined> {
        return SharedAuthService.getInstance().getSession();
    }
} 