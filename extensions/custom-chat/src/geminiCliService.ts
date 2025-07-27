import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

export interface GeminiCliConfig {
    isInstalled: boolean;
    version?: string;
    settingsPath: string;
    mcpServersConfigured: boolean;
}

export interface GeminiCliExecution {
    prompt: string;
    context?: string;
    options?: {
        model?: string;
        sandbox?: boolean;
        debug?: boolean;
    };
}

export class GeminiCliService {
    private static instance: GeminiCliService;
    private context: vscode.ExtensionContext;
    private config: GeminiCliConfig | null = null;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context?: vscode.ExtensionContext): GeminiCliService {
        if (!GeminiCliService.instance && context) {
            GeminiCliService.instance = new GeminiCliService(context);
        }
        return GeminiCliService.instance;
    }

    /**
     * Initialize the Gemini CLI service
     */
    public async initialize(): Promise<boolean> {
        try {
            console.log('[GeminiCliService] Initializing Gemini CLI service...');

            // Check if Gemini CLI is installed
            const isInstalled = await this.checkInstallation();
            if (!isInstalled) {
                console.log('[GeminiCliService] Gemini CLI not found, attempting to install...');
                const installSuccess = await this.installGeminiCli();
                if (!installSuccess) {
                    console.error('[GeminiCliService] Failed to install Gemini CLI');
                    return false;
                }
            }

            // Load configuration
            await this.loadConfiguration();

            // Configure MCP servers
            const configSuccess = await this.configureMcpServers();
            if (!configSuccess) {
                console.error('[GeminiCliService] Failed to configure MCP servers');
                return false;
            }

            console.log('[GeminiCliService] Gemini CLI service initialized successfully');
            return true;

        } catch (error) {
            console.error('[GeminiCliService] Failed to initialize:', error);
            return false;
        }
    }

    /**
     * Check if Gemini CLI is installed
     */
    private async checkInstallation(): Promise<boolean> {
        try {
            const result = await this.execCommand('gemini --version');
            if (result.trim()) {
                this.config = {
                    isInstalled: true,
                    version: result.trim(),
                    settingsPath: path.join(process.env.HOME || '', '.gemini/settings.json'),
                    mcpServersConfigured: false
                };
                console.log(`[GeminiCliService] Gemini CLI found: ${result.trim()}`);
                return true;
            }
        } catch (error) {
            console.log('[GeminiCliService] Gemini CLI not found in PATH');
        }
        return false;
    }

    /**
     * Install Gemini CLI
     */
    private async installGeminiCli(): Promise<boolean> {
        try {
            console.log('[GeminiCliService] Installing Gemini CLI...');

            // Try npm install first
            try {
                await this.execCommand('npm install -g @google/gemini-cli');
                console.log('[GeminiCliService] Gemini CLI installed via npm');
                return true;
            } catch (error) {
                console.log('[GeminiCliService] npm install failed, trying npx...');
            }

            // Try npx as fallback
            try {
                await this.execCommand('npx @google/gemini-cli --version');
                console.log('[GeminiCliService] Gemini CLI available via npx');
                return true;
            } catch (error) {
                console.log('[GeminiCliService] npx also failed');
            }

            // Show user instructions for manual installation
            vscode.window.showErrorMessage(
                'Gemini CLI not found. Please install it manually:\n\n' +
                'Option 1 (npm): npm install -g @google/gemini-cli\n' +
                'Option 2 (Homebrew): brew install gemini-cli\n' +
                'Option 3 (npx): npx @google/gemini-cli\n\n' +
                'For more information: https://github.com/google-gemini/gemini-cli'
            );

            return false;

        } catch (error) {
            console.error('[GeminiCliService] Installation failed:', error);
            return false;
        }
    }

    /**
     * Load Gemini CLI configuration
     */
    private async loadConfiguration(): Promise<void> {
        if (!this.config) {
            throw new Error('Configuration not initialized');
        }

        try {
            const settingsPath = this.config.settingsPath;
            if (await this.fileExists(settingsPath)) {
                const settingsContent = await fs.promises.readFile(settingsPath, 'utf8');
                const settings = JSON.parse(settingsContent);
                
                // Check if MCP servers are configured
                this.config.mcpServersConfigured = !!(settings.mcpServers && 
                    settings.mcpServers.bigquery && 
                    settings.mcpServers.bigquery.command && 
                    (settings.mcpServers.bigquery.command === 'genai-toolbox' || 
                     settings.mcpServers.bigquery.command.includes('genai-toolbox')));
                
                console.log('[GeminiCliService] Configuration loaded, MCP servers configured:', this.config.mcpServersConfigured);
            } else {
                console.log('[GeminiCliService] No settings file found, will create one');
            }
        } catch (error) {
            console.error('[GeminiCliService] Failed to load configuration:', error);
        }
    }

    /**
     * Configure MCP servers for genai-toolbox
     */
    private async configureMcpServers(): Promise<boolean> {
        try {
            if (!this.config) {
                throw new Error('Configuration not initialized');
            }

            if (this.config.mcpServersConfigured) {
                console.log('[GeminiCliService] MCP servers already configured correctly');
                return true;
            }

            console.log('[GeminiCliService] Configuring MCP servers...');

            // Get Google Cloud project ID
            const projectId = await this.getGoogleCloudProjectId();
            if (!projectId) {
                console.error('[GeminiCliService] No Google Cloud project ID configured');
                vscode.window.showErrorMessage(
                    'Google Cloud project ID not configured. Please set it in VS Code settings.'
                );
                return false;
            }

            // Find genai-toolbox binary
            const toolboxPath = await this.findToolboxBinary();
            if (!toolboxPath) {
                console.error('[GeminiCliService] genai-toolbox binary not found');
                vscode.window.showErrorMessage(
                    'genai-toolbox binary not found. Please run the installation script first.'
                );
                return false;
            }

            // Create settings directory if it doesn't exist
            const settingsDir = path.dirname(this.config.settingsPath);
            await fs.promises.mkdir(settingsDir, { recursive: true });

            // Load existing settings or create new ones
            let settings: any = {};
            if (await this.fileExists(this.config.settingsPath)) {
                const settingsContent = await fs.promises.readFile(this.config.settingsPath, 'utf8');
                settings = JSON.parse(settingsContent);
            }

            // Configure MCP servers with full path
            settings.mcpServers = {
                ...settings.mcpServers,
                bigquery: {
                    command: toolboxPath,
                    args: [
                        'serve',
                        '--prebuilt',
                        'bigquery',
                        '--stdio'
                    ],
                    env: {
                        BIGQUERY_PROJECT: projectId,
                        GOOGLE_APPLICATION_CREDENTIALS: await this.getGoogleCredentialsPath(),
                        PATH: process.env.PATH || ''
                    }
                }
            };

            // Ensure other required settings
            settings.theme = settings.theme || 'Default';
            settings.selectedAuthType = settings.selectedAuthType || 'oauth-personal';
            settings.preferredEditor = settings.preferredEditor || 'vscode';

            // Write settings
            await fs.promises.writeFile(
                this.config.settingsPath, 
                JSON.stringify(settings, null, 2), 
                'utf8'
            );

            this.config.mcpServersConfigured = true;
            console.log('[GeminiCliService] MCP servers configured successfully');

            vscode.window.showInformationMessage(
                `✅ Gemini CLI MCP Configuration Updated\n` +
                `• BigQuery MCP server: ${path.basename(toolboxPath)}\n` +
                `• Path: ${toolboxPath}\n` +
                `• Project: ${projectId}\n` +
                `• Ready for BigQuery queries!`
            );

            return true;

        } catch (error) {
            console.error('[GeminiCliService] Failed to configure MCP servers:', error);
            return false;
        }
    }

    /**
     * Execute a Gemini CLI command
     */
    public async executeGeminiCli(execution: GeminiCliExecution): Promise<string> {
        try {
            if (!this.config?.isInstalled) {
                throw new Error('Gemini CLI not installed');
            }

            console.log('[GeminiCliService] Executing Gemini CLI command...');

            // Build command arguments
            const args: string[] = [];
            
            if (execution.options?.model) {
                args.push('-m', execution.options.model);
            }
            
            if (execution.options?.sandbox) {
                args.push('-s');
            }
            
            if (execution.options?.debug) {
                args.push('-d');
            }

            // Execute command with prompt via stdin
            let command = `gemini ${args.join(' ')}`;
            
            if (execution.prompt) {
                // Use echo to pipe the prompt to stdin
                command = `echo "${execution.prompt.replace(/"/g, '\\"')}" | ${command}`;
            }

            const result = await this.execCommand(command);
            
            console.log('[GeminiCliService] Gemini CLI execution completed');
            return result;

        } catch (error) {
            console.error('[GeminiCliService] Gemini CLI execution failed:', error);
            throw error;
        }
    }

    /**
     * Test Gemini CLI with BigQuery integration
     */
    public async testBigQueryIntegration(): Promise<string> {
        try {
            const testPrompt = 'List the available BigQuery datasets in the current project';
            
            console.log('[GeminiCliService] Testing BigQuery integration...');
            
            const result = await this.executeGeminiCli({
                prompt: testPrompt,
                options: {
                    model: 'gemini-2.5-pro',
                    debug: true
                }
            });

            console.log('[GeminiCliService] BigQuery integration test completed');
            return result;

        } catch (error) {
            console.error('[GeminiCliService] BigQuery integration test failed:', error);
            throw error;
        }
    }

    /**
     * Get Gemini CLI configuration
     */
    public getConfiguration(): GeminiCliConfig | null {
        return this.config;
    }

    /**
     * Check if Gemini CLI is ready
     */
    public isReady(): boolean {
        return this.config?.isInstalled === true && this.config?.mcpServersConfigured === true;
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
     * Get Google Cloud credentials path
     */
    private async getGoogleCredentialsPath(): Promise<string> {
        // Try to get from environment
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            return process.env.GOOGLE_APPLICATION_CREDENTIALS;
        }

        // Try common locations
        const possiblePaths = [
            path.join(process.env.HOME || '', '.config/gcloud/application_default_credentials.json'),
            path.join(process.env.HOME || '', '.gcloud/application_default_credentials.json')
        ];

        for (const credPath of possiblePaths) {
            try {
                await fs.promises.access(credPath, fs.constants.R_OK);
                return credPath;
            } catch {
                // File not found, continue
            }
        }

        // Return empty string to use default credentials
        return '';
    }

    /**
     * Execute a command and return the result
     */
    private async execCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            cp.exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    /**
     * Check if a file exists
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Find the genai-toolbox binary
     */
    private async findToolboxBinary(): Promise<string | null> {
        try {
            // Try to find the binary using 'which' command
            const result = await this.execCommand('which genai-toolbox');
            if (result.trim()) {
                return result.trim();
            }
        } catch (error) {
            console.log('[GeminiCliService] genai-toolbox not found in PATH');
        }

        // Try common installation paths
        const possiblePaths = [
            path.join(process.env.HOME || '', 'go/bin/genai-toolbox'),
            path.join(process.env.GOPATH || '', 'bin/genai-toolbox'),
            '/usr/local/bin/genai-toolbox',
            '/opt/homebrew/bin/genai-toolbox'
        ];

        for (const binaryPath of possiblePaths) {
            try {
                await fs.promises.access(binaryPath, fs.constants.X_OK);
                return binaryPath;
            } catch {
                // File not found or not executable, continue
            }
        }

        return null;
    }

    /**
     * Get Gemini CLI information for the chat interface
     */
    public getCliInfo(): any {
        if (!this.config) {
            return null;
        }

        return {
            isInstalled: this.config.isInstalled,
            version: this.config.version,
            mcpServersConfigured: this.config.mcpServersConfigured,
            settingsPath: this.config.settingsPath
        };
    }
} 