import * as vscode from 'vscode';
import { CustomChatWebviewProvider } from './webviewProvider';
import { ConfigHelper } from './configHelper';
import { BigQueryTableService } from './bigqueryTableService';

export function activate(context: vscode.ExtensionContext) {
    console.log('=== DataVibe extension is now active! ===');
    console.log('Extension context:', context.extension.id);
    console.log('Extension path:', context.extension.extensionPath);
    console.log('Extension version:', context.extension.packageJSON.version);

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
        vscode.commands.registerCommand('custom-chat.configureProject', async () => {
            try {
                const project = await ConfigHelper.promptForBillingProject();
                if (project) {
                    vscode.window.showInformationMessage(`✅ Google Cloud project configured: ${project}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Error configuring Google Cloud project: ${errorMessage}`);
            }
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
        vscode.commands.registerCommand('custom-chat.testExtension', async () => {
            try {
                console.log('=== Testing DataVibe Extension ===');
                
                // Test authentication
                console.log('Testing authentication...');
                const session = await ConfigHelper.getGoogleCloudSession();
                if (session) {
                    console.log('✅ Authentication working:', session.account.label);
                    vscode.window.showInformationMessage(`✅ Authentication working: ${session.account.label}`);
                } else {
                    console.log('❌ No authentication session found');
                    vscode.window.showWarningMessage('❌ No authentication session found');
                    return;
                }
                
                // Test project configuration
                console.log('Testing project configuration...');
                const project = ConfigHelper.getBillingProject();
                if (project) {
                    console.log('✅ Project configured:', project);
                    vscode.window.showInformationMessage(`✅ Project configured: ${project}`);
                } else {
                    console.log('❌ No project configured');
                    vscode.window.showWarningMessage('❌ No project configured');
                    return;
                }
                
                // Test data sources
                console.log('Testing data sources...');
                const dataSources = await ConfigHelper.getDefaultDataSources();
                console.log('✅ Data sources:', JSON.stringify(dataSources, null, 2));
                console.log('✅ Data sources bq:', dataSources.bq);
                console.log('✅ Data sources table references length:', dataSources.bq?.tableReferences?.length);
                vscode.window.showInformationMessage(`✅ Data sources configured: ${dataSources.bq?.tableReferences?.length || 0} table references`);
                
                vscode.window.showInformationMessage('✅ DataVibe extension test completed successfully!');
                
            } catch (error) {
                console.error('=== Test failed ===');
                console.error('Error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`❌ Test failed: ${errorMessage}`);
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
    console.log('- custom-chat.configureProject: Configure Google Cloud project');
    console.log('- custom-chat.testDataSources: Test data sources configuration');
    console.log('- custom-chat.testExtension: Test DataVibe functionality');
}

export function deactivate() {
    console.log('=== DataVibe extension is now deactivated! ===');
} 