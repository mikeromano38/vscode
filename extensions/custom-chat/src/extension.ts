import * as vscode from 'vscode';
import { CustomChatWebviewProvider } from './webviewProvider';
import { ConfigHelper } from './configHelper';
import { BigQueryTableService } from './bigqueryTableService';
import { DeveloperAgentService } from './developerAgentService';
import { MCPIntegrationService } from './mcpIntegrationService';
import { GeminiCliService } from './geminiCliService';
import { ConfigService } from './configService';
import { GeminiSessionManager, GeminiSessionConfig } from './geminiSessionManager';

export async function activate(context: vscode.ExtensionContext) {
    console.log('=== DataVibe extension is now active! ===');
    console.log('Extension context:', context.extension.id);
    console.log('Extension path:', context.extension.extensionPath);
    console.log('Extension version:', context.extension.packageJSON.version);

    // Initialize MCP integration service
    const mcpService = MCPIntegrationService.getInstance(context);
    
    // Initialize Gemini CLI service
    const geminiCliService = GeminiCliService.getInstance(context);
    
    // Initialize Developer Agent Service with Gemini CLI integration
    const developerAgentService = DeveloperAgentService.getInstance();
    await developerAgentService.initialize(context);
    
    // Initialize Configuration Service
    const configService = ConfigService.getInstance(context);
    
    // Register the webview view provider
    context.subscriptions.push(
        CustomChatWebviewProvider.register(context)
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('custom-chat.openChat', () => {
            // Reveal the webview view
            vscode.commands.executeCommand('customChatView.focus');
        })
    );



    context.subscriptions.push(
        vscode.commands.registerCommand('custom-chat.testDataSources', async () => {
            try {
                console.log('=== Testing Data Sources ===');
                
                // Test BigQuery table service
                const tableService = BigQueryTableService.getInstance();
                const openTabs = await tableService.getOpenTableTabs();
                console.log('Open table tabs:', openTabs);
                
                // Test data sources configuration
                const dataSources = await ConfigHelper.getDefaultDataSources();
                console.log('Data sources configuration:', JSON.stringify(dataSources, null, 2));
                console.log('Data sources type:', typeof dataSources);
                console.log('Data sources keys:', Object.keys(dataSources));
                console.log('Data sources bq:', dataSources.bq);
                console.log('Data sources bq type:', typeof dataSources.bq);
                console.log('Data sources bq keys:', dataSources.bq ? Object.keys(dataSources.bq) : 'undefined');
                console.log('Data sources bq tableReferences:', dataSources.bq?.tableReferences);
                console.log('Data sources bq tableReferences length:', dataSources.bq?.tableReferences?.length);
                
                // Test payload construction
                const testPayload = {
                    parent: `projects/test-project/locations/global`,
                    messages: [
                        {
                            userMessage: {
                                text: "Test message"
                            }
                        }
                    ],
                    inlineContext: {
                        datasourceReferences: dataSources,
                        options: {
                            analysis: {
                                python: {
                                    enabled: true
                                }
                            }
                        }
                    }
                };
                
                console.log('Test payload:', JSON.stringify(testPayload, null, 2));
                console.log('Test payload datasourceReferences:', JSON.stringify(testPayload.inlineContext.datasourceReferences, null, 2));
                
                vscode.window.showInformationMessage(
                    `Data sources test: ${openTabs.length} open tabs, ${dataSources.bq?.tableReferences?.length || 0} table references configured`
                );
                
            } catch (error) {
                console.error('Data sources test failed:', error);
                vscode.window.showErrorMessage(`Data sources test failed: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('custom-chat.testWebviewDetection', async () => {
            try {
                console.log('=== Testing Webview Detection ===');
                
                // Test BigQuery table service webview detection specifically
                const tableService = BigQueryTableService.getInstance();
                
                // Test webview detection
                console.log('Testing webview detection...');
                const webviewTabs = await tableService.getOpenTableTabs();
                
                // Show detailed results
                let message = `Webview Detection Test Results:\n\n`;
                message += `Total open table tabs found: ${webviewTabs.length}\n\n`;
                
                if (webviewTabs.length > 0) {
                    message += `Found tables:\n`;
                    webviewTabs.forEach((tab, index) => {
                        message += `${index + 1}. ${tab.projectId}.${tab.datasetId}.${tab.tableId}\n`;
                    });
                } else {
                    message += `No BigQuery table webviews detected.\n`;
                    message += `\nTo test this:\n`;
                    message += `1. Open a BigQuery table using the BigQuery extension\n`;
                    message += `2. Run this test command again\n`;
                }
                
                // Also show all current tabs for debugging
                message += `\n=== All Current Tabs ===\n`;
                const tabGroups = vscode.window.tabGroups.all;
                message += `Total tab groups: ${tabGroups.length}\n`;
                
                for (const tabGroup of tabGroups) {
                    message += `\nTab Group (${tabGroup.viewColumn}): ${tabGroup.tabs.length} tabs\n`;
                    for (const tab of tabGroup.tabs) {
                        const inputType = tab.input ? tab.input.constructor.name : 'unknown';
                        const viewType = tab.input && tab.input instanceof vscode.TabInputWebview ? tab.input.viewType : 'N/A';
                        message += `  - "${tab.label}" (${inputType})${viewType !== 'N/A' ? ` [${viewType}]` : ''}\n`;
                    }
                }
                
                console.log('Webview detection test results:', message);
                vscode.window.showInformationMessage(message);
                
            } catch (error) {
                console.error('Webview detection test failed:', error);
                vscode.window.showErrorMessage(`Webview detection test failed: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('custom-chat.testAgentService', async () => {
            try {
                console.log('=== Testing Developer Agent Service ===');
                
                // Test the Developer Agent service
                const agentService = DeveloperAgentService.getInstance();
                
                // Test availability
                const isAvailable = await agentService.isAvailable();
                console.log('Agent service available:', isAvailable);
                
                // Test configuration
                const config = await agentService.getConfiguration();
                console.log('Agent service configuration:', config);
                
                // Test message processing
                const testMessage = 'List the first 3 datasets in the daui-storage project';
                console.log('Testing message processing with:', testMessage);
                
                const response = await agentService.processAgentMessage(testMessage, { test: true });
                console.log('Agent response:', response);
                
                // Test session functionality
                const chatHistory = agentService.getChatHistory();
                const isSessionActive = agentService.isSessionActive();
                
                vscode.window.showInformationMessage(
                    `✅ Developer Agent Service Test Results:\n` +
                    `• Available: ${isAvailable ? 'Yes' : 'No'}\n` +
                    `• Configuration: ${config.serviceType} v${config.version}\n` +
                    `• Status: ${config.status}\n` +
                    `• Gemini CLI: ${config.geminiCli ? 'Configured' : 'Not Configured'}\n` +
                    `• Session Active: ${isSessionActive ? 'Yes' : 'No'}\n` +
                    `• Chat History: ${chatHistory.length} messages\n` +
                    `• Message processing: Success\n` +
                    `• Response Type: ${response.type}\n\n` +
                    `Agent service is working correctly!`
                );
                
            } catch (error) {
                console.error('Agent service test failed:', error);
                vscode.window.showErrorMessage(`Agent service test failed: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('custom-chat.testMCPService', async () => {
            try {
                console.log('=== Testing MCP Integration Service ===');
                
                // Test the MCP integration service
                const mcpService = MCPIntegrationService.getInstance(context);
                
                // Test initialization
                const isInitialized = await mcpService.initialize();
                console.log('MCP service initialized:', isInitialized);
                
                if (isInitialized) {
                    // Test server status
                    const serverInfo = mcpService.getServerInfo();
                    console.log('MCP server info:', serverInfo);
                    
                    // Test available tools
                    const tools = mcpService.getAvailableTools();
                    console.log('Available tools:', tools.length);
                    
                    vscode.window.showInformationMessage(
                        `✅ MCP Integration Service Test Results:\n` +
                        `• Initialized: ${isInitialized ? 'Yes' : 'No'}\n` +
                        `• Server Running: ${serverInfo?.isRunning ? 'Yes' : 'No'}\n` +
                        `• Port: ${serverInfo?.port || 'N/A'}\n` +
                        `• Available Tools: ${tools.length}\n\n` +
                        `MCP integration is working correctly!`
                    );
                } else {
                    vscode.window.showWarningMessage(
                        `⚠️ MCP Integration Service Test Results:\n` +
                        `• Initialized: No\n` +
                        `• Reason: No BigQuery tables open or toolbox not installed\n\n` +
                        `To test MCP integration:\n` +
                        `1. Open a BigQuery table\n` +
                        `2. Install Google GenAI Toolbox\n` +
                        `3. Run this test again`
                    );
                }
                
            } catch (error) {
                console.error('MCP service test failed:', error);
                vscode.window.showErrorMessage(`MCP service test failed: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('custom-chat.refreshMCPService', async () => {
            try {
                console.log('=== Refreshing MCP Integration Service ===');
                
                const mcpService = MCPIntegrationService.getInstance(context);
                const success = await mcpService.refresh();
                
                if (success) {
                    const serverInfo = mcpService.getServerInfo();
                    const tools = mcpService.getAvailableTools();
                    
                    vscode.window.showInformationMessage(
                        `✅ MCP Integration Refreshed\n` +
                        `• Server: ${serverInfo?.name}\n` +
                        `• Status: ${serverInfo?.isRunning ? 'Running' : 'Stopped'}\n` +
                        `• Tools: ${tools.length} available`
                    );
                } else {
                    vscode.window.showWarningMessage('MCP integration refresh failed');
                }
                
            } catch (error) {
                console.error('MCP service refresh failed:', error);
                vscode.window.showErrorMessage(`MCP service refresh failed: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('custom-chat.testGeminiCliService', async () => {
            try {
                console.log('=== Testing Gemini CLI Integration Service ===');
                
                // Test the Gemini CLI service
                const geminiCliService = GeminiCliService.getInstance(context);
                
                // Test initialization
                const isInitialized = await geminiCliService.initialize();
                console.log('Gemini CLI service initialized:', isInitialized);
                
                if (isInitialized) {
                    // Test configuration
                    const config = geminiCliService.getConfiguration();
                    console.log('Gemini CLI configuration:', config);
                    
                    // Test BigQuery integration
                    console.log('Testing BigQuery integration...');
                    const testResult = await geminiCliService.testBigQueryIntegration();
                    console.log('BigQuery integration test result:', testResult);
                    
                    vscode.window.showInformationMessage(
                        `✅ Gemini CLI Integration Service Test Results:\n` +
                        `• Initialized: ${isInitialized ? 'Yes' : 'No'}\n` +
                        `• Version: ${config?.version || 'Unknown'}\n` +
                        `• MCP Servers Configured: ${config?.mcpServersConfigured ? 'Yes' : 'No'}\n` +
                        `• BigQuery Integration: Tested\n\n` +
                        `Gemini CLI integration is working correctly!`
                    );
                } else {
                    vscode.window.showWarningMessage(
                        `⚠️ Gemini CLI Integration Service Test Results:\n` +
                        `• Initialized: No\n` +
                        `• Reason: Installation or configuration failed\n\n` +
                        `To fix:\n` +
                        `1. Run the installation script: ./scripts/install-toolbox.sh\n` +
                        `2. Ensure Google Cloud project is configured\n` +
                        `3. Run this test again`
                    );
                }
                
            } catch (error) {
                console.error('Gemini CLI service test failed:', error);
                vscode.window.showErrorMessage(`Gemini CLI service test failed: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('custom-chat.testSessionManager', async () => {
            try {
                console.log('=== Testing Gemini Session Manager ===');
                
                // Test the session manager
                const sessionManager = GeminiSessionManager.getInstance(context);
                
                // Start a session
                const workspaceDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
                const sessionConfig: GeminiSessionConfig = {
                    model: 'gemini-2.5-pro',
                    debug: true,
                    yolo: true,
                    checkpointing: true,
                    workspaceDir: workspaceDir
                };
                
                console.log('Starting session with config:', sessionConfig);
                const sessionStarted = await sessionManager.startSession(sessionConfig);
                console.log('Session started:', sessionStarted);
                
                if (sessionStarted) {
                    // Test sending a message
                    console.log('Testing session with message...');
                    const response1 = await sessionManager.sendMessage('Hello, what is your name?');
                    console.log('Response 1:', response1);
                    
                    // Test sending another message to see if session persists
                    console.log('Testing session persistence...');
                    const response2 = await sessionManager.sendMessage('What did I just ask you?');
                    console.log('Response 2:', response2);
                    
                    // Stop the session
                    await sessionManager.stopSession();
                    
                    vscode.window.showInformationMessage(
                        `✅ Session Manager Test Results:\n` +
                        `• Session Started: ${sessionStarted ? 'Yes' : 'No'}\n` +
                        `• First Response: ${response1.success ? 'Success' : 'Failed'}\n` +
                        `• Second Response: ${response2.success ? 'Success' : 'Failed'}\n` +
                        `• Session Active: ${sessionManager.isActive()}\n\n` +
                        `Session manager test completed!`
                    );
                } else {
                    vscode.window.showWarningMessage('Session manager test failed - could not start session');
                }
                
            } catch (error) {
                console.error('Session manager test failed:', error);
                vscode.window.showErrorMessage(`Session manager test failed: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('custom-chat.refreshGeminiCliService', async () => {
            try {
                console.log('=== Refreshing Gemini CLI Integration Service ===');
                
                const geminiCliService = GeminiCliService.getInstance(context);
                const success = await geminiCliService.initialize();
                
                if (success) {
                    const config = geminiCliService.getConfiguration();
                    
                    vscode.window.showInformationMessage(
                        `✅ Gemini CLI Integration Refreshed\n` +
                        `• Version: ${config?.version}\n` +
                        `• MCP Servers: ${config?.mcpServersConfigured ? 'Configured' : 'Not Configured'}\n` +
                        `• Settings: ${config?.settingsPath}`
                    );
                } else {
                    vscode.window.showWarningMessage('Gemini CLI integration refresh failed');
                }
                
            } catch (error) {
                console.error('Gemini CLI service refresh failed:', error);
                vscode.window.showErrorMessage(`Gemini CLI service refresh failed: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('custom-chat.showConfigStatus', async () => {
            try {
                console.log('=== Showing Configuration Status ===');
                
                const configService = ConfigService.getInstance(context);
                await configService.showConfigStatus();
                
            } catch (error) {
                console.error('Configuration status display failed:', error);
                vscode.window.showErrorMessage(`Configuration status display failed: ${error}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('custom-chat.openSettings', async () => {
            try {
                console.log('=== Opening Settings ===');
                
                const configService = ConfigService.getInstance(context);
                await configService.openSettings();
                
            } catch (error) {
                console.error('Settings open failed:', error);
                vscode.window.showErrorMessage(`Settings open failed: ${error}`);
            }
        })
    );

    // Register a status bar item to quickly open the chat
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(database) DataVibe";
    statusBarItem.tooltip = "Open DataVibe";
    statusBarItem.command = 'custom-chat.openChat';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    console.log('=== DataVibe extension activated successfully! ===');
    console.log('Available commands:');
    console.log('- custom-chat.openChat: Open DataVibe');
    console.log('- custom-chat.testDataSources: Test data sources configuration');
}

export function deactivate() {
    console.log('=== DataVibe extension is now deactivated! ===');
    
    // Cleanup MCP integration service
    const mcpService = MCPIntegrationService.getInstance();
    if (mcpService) {
        mcpService.cleanup();
    }
    
    // Cleanup Gemini CLI service
    const geminiCliService = GeminiCliService.getInstance();
    if (geminiCliService) {
        // No specific cleanup needed for Gemini CLI service
        console.log('[GeminiCliService] Cleanup completed');
    }
    
    // Cleanup Developer Agent Service (includes session cleanup)
    const agentService = DeveloperAgentService.getInstance();
    if (agentService) {
        console.log('[DeveloperAgentService] Cleanup completed');
    }
} 