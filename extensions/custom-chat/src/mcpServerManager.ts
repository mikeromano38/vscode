import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import { BigQueryTableReference } from './configHelper';

export interface MCPServerConfig {
    name: string;
    command: string;
    args: string[];
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    port?: number;
    toolsConfigPath?: string;
}

export interface MCPServerStatus {
    name: string;
    isRunning: boolean;
    pid?: number;
    port?: number;
    error?: string;
    startTime?: Date;
}

export class MCPServerManager {
    private static instance: MCPServerManager;
    private servers: Map<string, cp.ChildProcess> = new Map();
    private serverStatus: Map<string, MCPServerStatus> = new Map();
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context?: vscode.ExtensionContext): MCPServerManager {
        if (!MCPServerManager.instance && context) {
            MCPServerManager.instance = new MCPServerManager(context);
        }
        return MCPServerManager.instance;
    }

    /**
     * Start the Google GenAI Toolbox MCP server
     */
    public async startGenAIToolboxServer(): Promise<MCPServerStatus> {
        const serverName = 'genai-toolbox';
        
        // Check if server is already running
        if (this.servers.has(serverName)) {
            const status = this.serverStatus.get(serverName);
            if (status?.isRunning) {
                console.log(`[MCPServerManager] ${serverName} server is already running`);
                return status;
            }
        }

        try {
            // Determine the toolbox binary path
            const toolboxPath = await this.findToolboxBinary();
            if (!toolboxPath) {
                throw new Error('Google GenAI Toolbox binary not found. Please install it first.');
            }

            // Get the current workspace directory
            const workspaceDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
            console.log(`[MCPServerManager] Using workspace directory for ${serverName}:`, workspaceDir);

            // Configure server
            const config: MCPServerConfig = {
                name: serverName,
                command: toolboxPath,
                args: ['serve', '--prebuilt', 'bigquery', '--port', '5000'],
                cwd: workspaceDir,  // Use workspace directory instead of toolbox directory
                env: {
                    ...process.env
                },
                port: 5000
            };

            // Start the server
            const status = await this.startServer(config);
            
            console.log(`[MCPServerManager] Started ${serverName} server:`, status);
            return status;

        } catch (error) {
            console.error(`[MCPServerManager] Failed to start ${serverName} server:`, error);
            throw error;
        }
    }



    /**
     * Find the Google GenAI Toolbox binary
     */
    private async findToolboxBinary(): Promise<string | null> {
        const possiblePaths = [
            // Common installation paths
            '/usr/local/bin/genai-toolbox',
            '/opt/homebrew/bin/genai-toolbox',
            '/usr/bin/genai-toolbox',
            // User's home directory
            path.join(process.env.HOME || '', '.local/bin/genai-toolbox'),
            // Go bin directory
            path.join(process.env.HOME || '', 'go/bin/genai-toolbox'),
            // Current working directory
            path.join(process.cwd(), 'genai-toolbox'),
            // Extension directory
            path.join(this.context.extensionPath, 'bin', 'genai-toolbox')
        ];

        for (const binaryPath of possiblePaths) {
            try {
                await fs.promises.access(binaryPath, fs.constants.X_OK);
                console.log(`[MCPServerManager] Found genai-toolbox binary at: ${binaryPath}`);
                return binaryPath;
            } catch {
                // Binary not found at this path, continue
            }
        }

        // Try to find via PATH
        try {
            const result = await this.execCommand('which genai-toolbox');
            if (result.trim()) {
                console.log(`[MCPServerManager] Found genai-toolbox binary via PATH: ${result.trim()}`);
                return result.trim();
            }
        } catch {
            // Not found in PATH
        }

        return null;
    }

    /**
     * Get Google Cloud credentials path
     * Now simplified to only use Application Default Credentials
     */
    private async getGoogleCredentialsPath(): Promise<string> {
        console.log('[MCPServerManager] Using Application Default Credentials');
        return '';
    }

    /**
     * Start an MCP server
     */
    private async startServer(config: MCPServerConfig): Promise<MCPServerStatus> {
        return new Promise((resolve, reject) => {
            console.log(`[MCPServerManager] Starting ${config.name} server...`);
            console.log(`[MCPServerManager] Command: ${config.command} ${config.args.join(' ')}`);

            const childProcess = cp.spawn(config.command, config.args, {
                cwd: config.cwd,
                env: config.env,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            const status: MCPServerStatus = {
                name: config.name,
                isRunning: false,
                pid: childProcess.pid,
                port: config.port,
                startTime: new Date()
            };

            // Handle stdout
            childProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                console.log(`[MCPServerManager] ${config.name} stdout:`, output);
                
                // Check if server is ready
                if (output.includes('Server started') || output.includes('Listening on')) {
                    status.isRunning = true;
                    this.servers.set(config.name, childProcess);
                    this.serverStatus.set(config.name, status);
                    resolve(status);
                }
            });

            // Handle stderr
            childProcess.stderr?.on('data', (data) => {
                const output = data.toString();
                console.log(`[MCPServerManager] ${config.name} stderr:`, output);
            });

            // Handle process exit
            childProcess.on('exit', (code, signal) => {
                console.log(`[MCPServerManager] ${config.name} server exited with code ${code}, signal ${signal}`);
                status.isRunning = false;
                status.error = `Process exited with code ${code}`;
                this.servers.delete(config.name);
                this.serverStatus.set(config.name, status);
                
                if (!status.isRunning) {
                    reject(new Error(`Server failed to start: ${status.error}`));
                }
            });

            // Handle process error
            childProcess.on('error', (error) => {
                console.error(`[MCPServerManager] ${config.name} server error:`, error);
                status.isRunning = false;
                status.error = error.message;
                this.servers.delete(config.name);
                this.serverStatus.set(config.name, status);
                reject(error);
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (!status.isRunning) {
                    childProcess.kill();
                    reject(new Error('Server startup timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Stop an MCP server
     */
    public async stopServer(serverName: string): Promise<void> {
        const childProcess = this.servers.get(serverName);
        if (childProcess) {
            console.log(`[MCPServerManager] Stopping ${serverName} server...`);
            childProcess.kill();
            this.servers.delete(serverName);
            
            const status = this.serverStatus.get(serverName);
            if (status) {
                status.isRunning = false;
                this.serverStatus.set(serverName, status);
            }
        }
    }

    /**
     * Get server status
     */
    public getServerStatus(serverName: string): MCPServerStatus | undefined {
        return this.serverStatus.get(serverName);
    }

    /**
     * Get all server statuses
     */
    public getAllServerStatuses(): MCPServerStatus[] {
        return Array.from(this.serverStatus.values());
    }

    /**
     * Stop all servers
     */
    public async stopAllServers(): Promise<void> {
        const serverNames = Array.from(this.servers.keys());
        for (const serverName of serverNames) {
            await this.stopServer(serverName);
        }
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
     * Install the Google GenAI Toolbox if not present
     */
    public async ensureToolboxInstalled(): Promise<boolean> {
        const toolboxPath = await this.findToolboxBinary();
        if (toolboxPath) {
            return true;
        }

        console.log('[MCPServerManager] Google GenAI Toolbox not found, attempting to install...');
        
        try {
            // Try to install via go install
            await this.execCommand('go install github.com/googleapis/genai-toolbox@latest');
            console.log('[MCPServerManager] Successfully installed Google GenAI Toolbox');
            return true;
        } catch (error) {
            console.error('[MCPServerManager] Failed to install Google GenAI Toolbox:', error);
            
            // Show user instructions
            vscode.window.showErrorMessage(
                'Google GenAI Toolbox not found. Please install it manually:\n\n' +
                '1. Install Go: https://golang.org/doc/install\n' +
                '2. Run: go install github.com/googleapis/genai-toolbox@latest\n' +
                '3. Add Go bin directory to your PATH'
            );
            
            return false;
        }
    }
} 