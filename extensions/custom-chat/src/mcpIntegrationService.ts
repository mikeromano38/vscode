import * as vscode from 'vscode';
import { MCPServerManager, MCPServerStatus } from './mcpServerManager';
import { BigQueryTableService } from './bigqueryTableService';
import { ConfigHelper } from './configHelper';

export interface MCPTool {
    name: string;
    description: string;
    parameters: any[];
    toolset?: string;
}

export interface MCPToolExecution {
    toolName: string;
    parameters: any;
    result?: any;
    error?: string;
}

export class MCPIntegrationService {
    private static instance: MCPIntegrationService;
    private mcpManager: MCPServerManager;
    private bigQueryService: BigQueryTableService;
    private serverStatus: MCPServerStatus | null = null;
    private availableTools: MCPTool[] = [];

    private constructor(context: vscode.ExtensionContext) {
        this.mcpManager = MCPServerManager.getInstance(context);
        this.bigQueryService = BigQueryTableService.getInstance();
    }

    public static getInstance(context?: vscode.ExtensionContext): MCPIntegrationService {
        if (!MCPIntegrationService.instance && context) {
            MCPIntegrationService.instance = new MCPIntegrationService(context);
        }
        return MCPIntegrationService.instance;
    }

    /**
     * Initialize the MCP integration service
     */
    public async initialize(): Promise<boolean> {
        try {
            console.log('[MCPIntegrationService] Initializing MCP integration...');

            // Ensure toolbox is installed
            const isInstalled = await this.mcpManager.ensureToolboxInstalled();
            if (!isInstalled) {
                console.error('[MCPIntegrationService] Google GenAI Toolbox not installed');
                return false;
            }

            // Get current BigQuery tables
            const openTables = await this.bigQueryService.getOpenTableTabs();
            console.log('[MCPIntegrationService] Found open BigQuery tables:', openTables.length);

            if (openTables.length === 0) {
                console.log('[MCPIntegrationService] No BigQuery tables open, MCP server not needed');
                return true;
            }

            // Get Google Cloud project ID
            const projectId = await this.getGoogleCloudProjectId();
            if (!projectId) {
                console.error('[MCPIntegrationService] No Google Cloud project ID configured');
                vscode.window.showErrorMessage(
                    'Google Cloud project ID not configured. Please set it in VS Code settings.'
                );
                return false;
            }

            // Start the MCP server
            this.serverStatus = await this.mcpManager.startGenAIToolboxServer();
            console.log('[MCPIntegrationService] MCP server started:', this.serverStatus);

            // Load available tools
            await this.loadAvailableTools();

            vscode.window.showInformationMessage(
                `✅ MCP Integration Ready\n` +
                `• Server: ${this.serverStatus.name}\n` +
                `• Port: ${this.serverStatus.port}\n` +
                `• Tools: ${this.availableTools.length} available\n` +
                `• Tables: ${openTables.length} connected`
            );

            return true;

        } catch (error) {
            console.error('[MCPIntegrationService] Failed to initialize:', error);
            vscode.window.showErrorMessage(`MCP integration failed: ${error}`);
            return false;
        }
    }

    /**
     * Get available tools from the MCP server
     */
    public async loadAvailableTools(): Promise<MCPTool[]> {
        try {
            if (!this.serverStatus?.isRunning) {
                console.log('[MCPIntegrationService] MCP server not running, cannot load tools');
                return [];
            }

            // With the prebuilt BigQuery configuration, we have access to standard BigQuery tools
            // The prebuilt configuration provides comprehensive BigQuery functionality
            this.availableTools = [
                {
                    name: 'bigquery-sql',
                    description: 'Execute BigQuery SQL queries',
                    parameters: [
                        {
                            name: 'query',
                            type: 'string',
                            description: 'SQL query to execute'
                        }
                    ],
                    toolset: 'bigquery'
                },
                {
                    name: 'bigquery-list-datasets',
                    description: 'List available BigQuery datasets',
                    parameters: [],
                    toolset: 'bigquery'
                },
                {
                    name: 'bigquery-list-tables',
                    description: 'List tables in a BigQuery dataset',
                    parameters: [
                        {
                            name: 'dataset',
                            type: 'string',
                            description: 'Dataset name'
                        }
                    ],
                    toolset: 'bigquery'
                },
                {
                    name: 'bigquery-describe-table',
                    description: 'Describe a BigQuery table schema',
                    parameters: [
                        {
                            name: 'table',
                            type: 'string',
                            description: 'Table name (project.dataset.table)'
                        }
                    ],
                    toolset: 'bigquery'
                }
            ];

            console.log('[MCPIntegrationService] Loaded prebuilt BigQuery tools:', this.availableTools.length);
            return this.availableTools;

        } catch (error) {
            console.error('[MCPIntegrationService] Failed to load tools:', error);
            return [];
        }
    }

    /**
     * Execute a tool through the MCP server
     */
    public async executeTool(execution: MCPToolExecution): Promise<any> {
        try {
            if (!this.serverStatus?.isRunning) {
                throw new Error('MCP server is not running');
            }

            console.log('[MCPIntegrationService] Executing tool:', execution.toolName);

            // In a full implementation, you would make an HTTP request to the MCP server
            // For now, we'll simulate the execution
            const tool = this.availableTools.find(t => t.name === execution.toolName);
            if (!tool) {
                throw new Error(`Tool ${execution.toolName} not found`);
            }

            // Simulate tool execution
            // In reality, this would be an HTTP POST to the MCP server
            const result = await this.simulateToolExecution(execution);
            
            console.log('[MCPIntegrationService] Tool execution result:', result);
            return result;

        } catch (error) {
            console.error('[MCPIntegrationService] Tool execution failed:', error);
            throw error;
        }
    }

    /**
     * Simulate tool execution (placeholder for actual MCP server communication)
     */
    private async simulateToolExecution(execution: MCPToolExecution): Promise<any> {
        // This is a placeholder implementation
        // In a real implementation, you would:
        // 1. Make an HTTP POST request to the MCP server
        // 2. Pass the tool name and parameters
        // 3. Return the actual result from BigQuery

        switch (execution.toolName) {
            case 'bigquery-sql':
                const query = execution.parameters.query;
                return {
                    success: true,
                    tool: execution.toolName,
                    query: query,
                    message: `Simulated execution of BigQuery SQL: ${query}`,
                    data: {
                        rows: [],
                        schema: []
                    }
                };

            case 'bigquery-list-datasets':
                return {
                    success: true,
                    tool: execution.toolName,
                    message: 'Simulated list of BigQuery datasets',
                    data: {
                        datasets: ['dataset1', 'dataset2', 'dataset3']
                    }
                };

            case 'bigquery-list-tables':
                const dataset = execution.parameters.dataset;
                return {
                    success: true,
                    tool: execution.toolName,
                    dataset: dataset,
                    message: `Simulated list of tables in dataset: ${dataset}`,
                    data: {
                        tables: ['table1', 'table2', 'table3']
                    }
                };

            case 'bigquery-describe-table':
                const table = execution.parameters.table;
                return {
                    success: true,
                    tool: execution.toolName,
                    table: table,
                    message: `Simulated schema for table: ${table}`,
                    data: {
                        schema: [
                            { name: 'column1', type: 'STRING' },
                            { name: 'column2', type: 'INTEGER' },
                            { name: 'column3', type: 'TIMESTAMP' }
                        ]
                    }
                };

            default:
                throw new Error(`Unknown tool: ${execution.toolName}`);
        }
    }

    /**
     * Get the current server status
     */
    public getServerStatus(): MCPServerStatus | null {
        return this.serverStatus;
    }

    /**
     * Get available tools
     */
    public getAvailableTools(): MCPTool[] {
        return this.availableTools;
    }

    /**
     * Check if MCP integration is ready
     */
    public isReady(): boolean {
        return this.serverStatus?.isRunning === true;
    }

    /**
     * Refresh the MCP server with current BigQuery tables
     */
    public async refresh(): Promise<boolean> {
        try {
            console.log('[MCPIntegrationService] Refreshing MCP integration...');

            // Stop current server if running
            if (this.serverStatus?.isRunning) {
                await this.mcpManager.stopServer(this.serverStatus.name);
            }

            // Reinitialize
            return await this.initialize();

        } catch (error) {
            console.error('[MCPIntegrationService] Failed to refresh:', error);
            return false;
        }
    }

    /**
     * Cleanup resources
     */
    public async cleanup(): Promise<void> {
        try {
            if (this.serverStatus?.isRunning) {
                await this.mcpManager.stopServer(this.serverStatus.name);
            }
            console.log('[MCPIntegrationService] Cleanup completed');
        } catch (error) {
            console.error('[MCPIntegrationService] Cleanup failed:', error);
        }
    }

    /**
     * Get Google Cloud project ID from VS Code settings
     */
    private async getGoogleCloudProjectId(): Promise<string | null> {
        // Try to get from VS Code settings
        const config = vscode.workspace.getConfiguration('google-cloud');
        let projectId = config.get<string>('projectId') || null;

        if (!projectId) {
            // Try alternative configuration keys
            const customConfig = vscode.workspace.getConfiguration('customChat');
            projectId = customConfig.get<string>('googleCloudProjectId') || null;
        }

        if (!projectId) {
            // Try to get from environment
            projectId = process.env.GOOGLE_CLOUD_PROJECT || null;
        }

        return projectId;
    }

    /**
     * Get MCP server information for the chat interface
     */
    public getServerInfo(): any {
        if (!this.serverStatus) {
            return null;
        }

        return {
            name: this.serverStatus.name,
            isRunning: this.serverStatus.isRunning,
            port: this.serverStatus.port,
            startTime: this.serverStatus.startTime,
            tools: this.availableTools.length,
            error: this.serverStatus.error
        };
    }

    /**
     * Get tools information for the chat interface
     */
    public getToolsInfo(): any[] {
        return this.availableTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            toolset: tool.toolset
        }));
    }
} 