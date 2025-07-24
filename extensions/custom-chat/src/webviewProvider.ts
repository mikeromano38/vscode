import * as vscode from 'vscode';
import { ConversationalAnalyticsService } from './conversationalAnalyticsService';
import { ConfigHelper } from './configHelper';
import { ParsedStreamResponse } from './types/responseTypes';
import * as path from 'path';
import * as fs from 'fs';

export class CustomChatWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'customChatView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new CustomChatWebviewProvider(context.extensionUri);
        return vscode.window.registerWebviewViewProvider(CustomChatWebviewProvider.viewType, provider);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        console.log('=== Resolving webview view ===');
        console.log('Webview view:', webviewView);
        console.log('Extension URI:', this._extensionUri);
        
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'out', 'webview'),
                vscode.Uri.joinPath(this._extensionUri, 'media')
            ],
            enableCommandUris: true
        };

        console.log('Webview options set:', webviewView.webview.options);
        console.log('Local resource roots:', webviewView.webview.options.localResourceRoots);

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        
        console.log('HTML set for webview');

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                console.log('=== Webview message received ===');
                console.log('Message:', message);
                console.log('Command:', message.command);
                
                switch (message.command) {
                    case 'sendMessage':
                        console.log('Handling sendMessage with text:', message.text);
                        this._handleChatMessage(message.text);
                        return;
                    case 'configureProject':
                        console.log('Handling configureProject');
                        this._handleConfigureProject();
                        return;
                    case 'testExtension':
                        console.log('Handling testExtension');
                        this._handleTestExtension();
                        return;
                    default:
                        console.log('Unknown command:', message.command);
                        return;
                }
            }
        );
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get the URI to the Angular app files
        const angularAppUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webview')
        );

        // Dynamically find the Angular build files
        const webviewPath = path.join(this._extensionUri.fsPath, 'out', 'webview');
        const files = this._getAngularBuildFiles(webviewPath);

        // Get URIs for the specific Angular files
        const runtimeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', files.runtime)
        );
        const polyfillsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', files.polyfills)
        );
        const mainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', files.main)
        );
        const stylesUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', files.styles)
        );

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>DataVibe</title>
    <base href="${angularAppUri}/">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="${stylesUri}">
</head>
<body>
    <app-root></app-root>
    <script src="${runtimeUri}" type="module"></script>
    <script src="${polyfillsUri}" type="module"></script>
    <script src="${mainUri}" type="module"></script>
</body>
</html>`;

        console.log('Generated HTML for webview');
        console.log('Angular app URI:', angularAppUri);
        console.log('Runtime URI:', runtimeUri);
        console.log('Polyfills URI:', polyfillsUri);
        console.log('Main URI:', mainUri);
        console.log('Styles URI:', stylesUri);

        return html;
    }

    private _getAngularBuildFiles(webviewPath: string): { runtime: string; polyfills: string; main: string; styles: string } {
        try {
            const files = fs.readdirSync(webviewPath);
            
            const runtime = files.find(f => f.startsWith('runtime.') && f.endsWith('.js')) || 'runtime.js';
            const polyfills = files.find(f => f.startsWith('polyfills.') && f.endsWith('.js')) || 'polyfills.js';
            const main = files.find(f => f.startsWith('main.') && f.endsWith('.js')) || 'main.js';
            const styles = files.find(f => f.startsWith('styles.') && f.endsWith('.css')) || 'styles.css';

            console.log('Found Angular build files:', { runtime, polyfills, main, styles });
            
            return { runtime, polyfills, main, styles };
        } catch (error) {
            console.error('Error reading Angular build files:', error);
            // Fallback to default names
            return {
                runtime: 'runtime.js',
                polyfills: 'polyfills.js',
                main: 'main.js',
                styles: 'styles.css'
            };
        }
    }

    private async _handleChatMessage(text: string) {
        if (!this._view) return;

        try {
            // Update UI to show processing state
            this._view.webview.postMessage({ command: 'setProcessing', processing: true });
            this._view.webview.postMessage({ command: 'updateStatus', text: 'Processing request...' });

            console.log('=== Chat request received ===');
            console.log('Prompt:', text);

            // Get the Google Cloud auth session
            const session = await ConfigHelper.getGoogleCloudSession();
            if (!session) {
                this._view.webview.postMessage({ 
                    command: 'addError', 
                    text: '❌ **Authentication Error**: No Google Cloud session found. Please sign in to Google Cloud first.' 
                });
                this._view.webview.postMessage({ command: 'setProcessing', processing: false });
                return;
            }

            // Get project from google-cloud configuration
            let billingProject = ConfigHelper.getBillingProject();
            if (!billingProject) {
                const project = await ConfigHelper.promptForBillingProject();
                if (!project) {
                    this._view.webview.postMessage({ 
                        command: 'addError', 
                        text: '❌ **Configuration Error**: Google Cloud project ID is required. Please configure it in settings or when prompted.' 
                    });
                    this._view.webview.postMessage({ command: 'setProcessing', processing: false });
                    return;
                }
                billingProject = project;
            }

            // Initialize the Conversational Analytics service
            const analyticsService = new ConversationalAnalyticsService(billingProject);
            
            // Get data sources configuration
            const dataSources = await ConfigHelper.getDefaultDataSources();
            const analysisOptions = ConfigHelper.getAnalysisOptions();

            console.log('=== CONFIGURATION DETAILS ===');
            console.log('Data sources:', JSON.stringify(dataSources, null, 2));
            console.log('Data sources type:', typeof dataSources);
            console.log('Data sources bq:', dataSources.bq);
            console.log('Data sources table references:', dataSources.bq?.tableReferences);
            console.log('Data sources table references length:', dataSources.bq?.tableReferences?.length);
            console.log('Analysis options:', JSON.stringify(analysisOptions, null, 2));
            console.log('=== END CONFIGURATION DETAILS ===');

            this._view.webview.postMessage({ command: 'updateStatus', text: 'Calling Conversational Analytics API...' });

            // Start streaming response
            this._view.webview.postMessage({ command: 'startStreaming' });
            
            // Add a test response to verify the streaming is working
            console.log('Adding test response to verify streaming...');
            const testResponse: ParsedStreamResponse = {
                type: 'text',
                data: { content: '🔄 **Streaming test**: This is a test response to verify the streaming is working correctly.' },
                rawResponse: null
            };
            this._view.webview.postMessage({ 
                command: 'addStreamingResponse', 
                response: testResponse 
            });

            // Create a cancellation token
            const cancellationTokenSource = new vscode.CancellationTokenSource();
            const token = cancellationTokenSource.token;

            // Add a timeout to prevent hanging
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                    console.log('Request timeout after 30 seconds');
                    cancellationTokenSource.cancel();
                    reject(new Error('Request timeout after 30 seconds'));
                }, 30000);
            });

            // Stream the response from Conversational Analytics API
            console.log('Getting stream from analytics service...');
            const streamPromise = analyticsService.streamChatResponse(
                text,
                session,
                dataSources,
                analysisOptions,
                token
            );

            console.log('Waiting for stream to be created...');
            const stream = await Promise.race([streamPromise, timeoutPromise]);

            console.log('Stream created, processing chunks...');
            let chunkCount = 0;
            const responses: ParsedStreamResponse[] = [];

            try {
                // Process the async generator directly
                for await (const response of stream) {
                    if (token.isCancellationRequested) {
                        console.log('Request was cancelled');
                        break;
                    }
                    
                    chunkCount++;
                    console.log(`=== Received response ${chunkCount} ===`);
                    console.log('Response type:', response.type);
                    console.log('Response data keys:', Object.keys(response.data));
                    console.log('Response data:', JSON.stringify(response.data, null, 2));
                    console.log('Raw response:', JSON.stringify(response.rawResponse, null, 2));
                    
                    responses.push(response);
                    
                    // Send each response to the webview for immediate rendering
                    console.log('Sending response to webview...');
                    this._view.webview.postMessage({ 
                        command: 'addStreamingResponse', 
                        response: response 
                    });
                    console.log('Response sent to webview');
                    
                    // Update status with progress
                    this._view.webview.postMessage({ 
                        command: 'updateStatus', 
                        text: `Receiving response... (${chunkCount} responses)` 
                    });
                }
            } catch (streamError) {
                console.error('Stream processing error:', streamError);
                const errorResponse: ParsedStreamResponse = {
                    type: 'error',
                    data: {
                        code: 'STREAM_ERROR',
                        message: streamError instanceof Error ? streamError.message : 'Unknown error'
                    },
                    rawResponse: null
                };
                this._view.webview.postMessage({ 
                    command: 'addStreamingResponse', 
                    response: errorResponse 
                });
            }

            console.log(`Total responses received: ${chunkCount}`);

            // Finish streaming
            this._view.webview.postMessage({ command: 'finishStreaming' });

            this._view.webview.postMessage({ command: 'updateStatus', text: 'Ready' });
            this._view.webview.postMessage({ command: 'setProcessing', processing: false });

            console.log('=== Chat request completed ===');

        } catch (error) {
            console.error('=== Chat error ===');
            console.error('Error details:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to process chat request';
            
            this._view.webview.postMessage({ command: 'addError', text: `❌ **Error**: ${errorMessage}` });
            this._view.webview.postMessage({ command: 'setProcessing', processing: false });
        }
    }

    private async _handleConfigureProject() {
        try {
            const project = await ConfigHelper.promptForBillingProject();
            if (project) {
                vscode.window.showInformationMessage(`✅ Google Cloud project configured: ${project}`);
                if (this._view) {
                    this._view.webview.postMessage({ command: 'updateStatus', text: `Project configured: ${project}` });
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Error configuring Google Cloud project: ${errorMessage}`);
        }
    }

    private async _handleTestExtension() {
        if (!this._view) return;

        try {
            this._view.webview.postMessage({ command: 'updateStatus', text: 'Testing extension...' });

            // Test authentication
            const session = await ConfigHelper.getGoogleCloudSession();
            if (!session) {
                this._view.webview.postMessage({ command: 'addError', text: '❌ No authentication session found' });
                return;
            }

            // Test project configuration
            const project = ConfigHelper.getBillingProject();
            if (!project) {
                this._view.webview.postMessage({ command: 'addError', text: '❌ No project configured' });
                return;
            }

            // Test data sources
            const dataSources = await ConfigHelper.getDefaultDataSources();
            
            this._view.webview.postMessage({ 
                command: 'finishStreaming', 
                text: `✅ **Extension Test Results**\n\n` +
                      `• Authentication: ✅ ${session.account.label}\n` +
                      `• Project: ✅ ${project}\n` +
                      `• Data Sources: ✅ ${dataSources.bq?.tableReferences?.length || 0} table references configured\n\n` +
                      `Extension is working correctly!`
            });

            this._view.webview.postMessage({ command: 'updateStatus', text: 'Test completed' });

        } catch (error) {
            console.error('Test failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this._view.webview.postMessage({ command: 'addError', text: `❌ Test failed: ${errorMessage}` });
        }
    }
} 