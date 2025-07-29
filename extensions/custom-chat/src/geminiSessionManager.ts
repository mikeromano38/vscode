import * as vscode from 'vscode';
import * as cp from 'child_process';
import { EventEmitter } from 'events';
import { ConfigService } from './configService';

export interface GeminiSessionConfig {
    model: string;
    debug: boolean;
    yolo: boolean;
    checkpointing: boolean;
    workspaceDir: string;
    systemPrompt?: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface SessionResponse {
    content: string;
    success: boolean;
    error?: string;
}

export interface SessionUpdate {
    type: 'start' | 'content' | 'complete' | 'error';
    content?: string;
    error?: string;
}

export class GeminiSessionManager extends EventEmitter {
    private static instance: GeminiSessionManager;
    private isSessionActive = false;
    private chatHistory: ChatMessage[] = [];
    private config: GeminiSessionConfig | null = null;
    private context: vscode.ExtensionContext;
    private configService: ConfigService | null = null;

    private constructor(context: vscode.ExtensionContext) {
        super();
        this.context = context;
    }

    public static getInstance(context?: vscode.ExtensionContext): GeminiSessionManager {
        if (!GeminiSessionManager.instance && context) {
            GeminiSessionManager.instance = new GeminiSessionManager(context);
        }
        return GeminiSessionManager.instance;
    }

    /**
     * Start a new session (initialize configuration)
     */
    public async startSession(config: GeminiSessionConfig): Promise<boolean> {
        try {
            console.log('[GeminiSessionManager] Starting stateless session...');
            
            // Initialize configuration service
            this.configService = ConfigService.getInstance(this.context);
            this.config = config;
            
            // Clear any existing chat history
            this.clearChatHistory();
            
            this.isSessionActive = true;
            console.log('[GeminiSessionManager] Stateless session started successfully');
            return true;
            
        } catch (error) {
            console.error('[GeminiSessionManager] Error starting session:', error);
            return false;
        }
    }

    /**
     * Send a message using stateless approach with conversation history
     */
    public async sendMessage(message: string): Promise<SessionResponse> {
        try {
            console.log('[GeminiSessionManager] sendMessage called with:', message);

            if (!this.isSessionActive || !this.config) {
                throw new Error('No active session');
            }

            // Add user message to chat history
            this.chatHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date()
            });

            // Build the full prompt with conversation history
            const fullPrompt = this.buildPromptWithHistory(message);
            console.log('[GeminiSessionManager] Sending prompt with history:', fullPrompt);

            // Emit start event
            this.emit('update', { type: 'start' } as SessionUpdate);

            // Execute the command with streaming updates
            const response = await this.executeGeminiCommandWithStreaming(fullPrompt);
            
            console.log('[GeminiSessionManager] Response received:', {
                success: response.success,
                content: response.content,
                error: response.error
            });
            
            if (response.success) {
                // Add assistant response to chat history
                this.chatHistory.push({
                    role: 'assistant',
                    content: response.content,
                    timestamp: new Date()
                });
                
                // Emit complete event without content since it's already been streamed
                this.emit('update', { type: 'complete' } as SessionUpdate);
            } else {
                // Emit error event
                this.emit('update', { type: 'error', error: response.error } as SessionUpdate);
            }

            return response;

        } catch (error) {
            console.error('[GeminiSessionManager] Error sending message:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emit('update', { type: 'error', error: errorMessage } as SessionUpdate);
            return {
                content: '',
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Build a prompt that includes the system prompt and conversation history
     */
    private buildPromptWithHistory(currentMessage: string): string {
        const promptParts: string[] = [];
        
        // Add system prompt if configured
        if (this.config?.systemPrompt) {
            promptParts.push(`System: ${this.config.systemPrompt}`);
        }
        
        // Build conversation history
        if (this.chatHistory.length > 0) {
            const historyLines: string[] = [];
            
            for (const msg of this.chatHistory) {
                if (msg.role === 'user') {
                    historyLines.push(`User: ${msg.content}`);
                } else {
                    historyLines.push(`Assistant: ${msg.content}`);
                }
            }
            
            promptParts.push(historyLines.join('\n\n'));
        }
        
        // Add the current message
        promptParts.push(`User: ${currentMessage}`);
        
        return promptParts.join('\n\n');
    }

    /**
     * Execute a single Gemini CLI command with streaming updates
     */
    private async executeGeminiCommandWithStreaming(prompt: string): Promise<SessionResponse> {
        return new Promise(async (resolve) => {
            if (!this.config) {
                resolve({
                    content: '',
                    success: false,
                    error: 'No configuration available'
                });
                return;
            }

            // Build command arguments
            const args: string[] = [];
            
            if (this.config.model) {
                args.push('-m', this.config.model);
            }
            
            if (this.config.debug) {
                args.push('-d');
            }
            
            if (this.config.yolo) {
                args.push('-y');
            }
            
            if (this.config.checkpointing) {
                args.push('-c');
            }

            // Prepare environment variables
            const env: NodeJS.ProcessEnv = {
                ...process.env,
                PWD: this.config.workspaceDir
            };

            // Add Google Cloud project ID and Gemini API key to environment
            if (this.configService) {
                const projectId = await this.configService.getEffectiveProjectId();
                const apiKey = await this.configService.getEffectiveGeminiApiKey();
                
                if (projectId) {
                    env.GOOGLE_CLOUD_PROJECT = projectId;
                    console.log('[GeminiSessionManager] Set GOOGLE_CLOUD_PROJECT:', projectId);
                    
                    // Also set gcloud to use the same project to ensure credentials are aligned
                    try {
                        const { exec } = require('child_process');
                        await new Promise<void>((resolve, reject) => {
                            exec(`gcloud config set project ${projectId}`, (error: any) => {
                                if (error) {
                                    console.warn('[GeminiSessionManager] Could not set gcloud project:', error);
                                } else {
                                    console.log('[GeminiSessionManager] Set gcloud project to:', projectId);
                                }
                                resolve();
                            });
                        });
                    } catch (error) {
                        console.warn('[GeminiSessionManager] Error setting gcloud project:', error);
                    }
                } else {
                    console.warn('[GeminiSessionManager] No project ID found, this may cause authentication issues');
                }
                
                if (apiKey) {
                    env.GEMINI_API_KEY = apiKey;
                    console.log('[GeminiSessionManager] Set GEMINI_API_KEY');
                } else {
                    console.warn('[GeminiSessionManager] No Gemini API key found, this may cause authentication issues');
                }
            } else {
                console.warn('[GeminiSessionManager] Config service not available');
            }

            console.log('[GeminiSessionManager] Executing Gemini CLI command with args:', args);
            console.log('[GeminiSessionManager] Environment:', { 
                GOOGLE_CLOUD_PROJECT: env.GOOGLE_CLOUD_PROJECT,
                GEMINI_API_KEY: env.GEMINI_API_KEY ? 'SET' : 'NOT_SET',
                GOOGLE_APPLICATION_CREDENTIALS: env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT_SET'
            });

            const geminiProcess = cp.spawn('gemini', args, {
                cwd: this.config.workspaceDir,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: env
            });

            console.log('[GeminiSessionManager] Process spawned with PID:', geminiProcess.pid);

            let stdout = '';
            let stderr = '';

            geminiProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                console.log('[GeminiSessionManager] stdout:', output);
                stdout += output;
                
                // Emit content update for streaming
                this.emit('update', { type: 'content', content: output } as SessionUpdate);
            });

            geminiProcess.stderr?.on('data', (data) => {
                const error = data.toString();
                console.log('[GeminiSessionManager] stderr:', error);
                stderr += error;
            });

            geminiProcess.on('error', (error) => {
                console.error('[GeminiSessionManager] Process error:', error);
                this.emit('update', { type: 'error', error: error.message } as SessionUpdate);
                resolve({
                    content: '',
                    success: false,
                    error: error.message
                });
            });

            geminiProcess.on('close', (code) => {
                console.log('[GeminiSessionManager] Process closed with code:', code);
                
                if (code === 0 && stdout.trim()) {
                    console.log('[GeminiSessionManager] Command executed successfully');
                    resolve({
                        content: stdout.trim(),
                        success: true
                    });
                } else {
                    console.error('[GeminiSessionManager] Command failed:', { code, stderr });
                    this.emit('update', { type: 'error', error: stderr || `Process exited with code ${code}` } as SessionUpdate);
                    resolve({
                        content: '',
                        success: false,
                        error: stderr || `Process exited with code ${code}`
                    });
                }
            });

            // Send the prompt to stdin
            if (geminiProcess.stdin) {
                console.log('[GeminiSessionManager] Writing prompt to stdin');
                geminiProcess.stdin.write(prompt + '\n');
                geminiProcess.stdin.end();
            } else {
                this.emit('update', { type: 'error', error: 'Process stdin is not available' } as SessionUpdate);
                resolve({
                    content: '',
                    success: false,
                    error: 'Process stdin is not available'
                });
            }
        });
    }

    /**
     * Stop the current session
     */
    public async stopSession(): Promise<void> {
        try {
            console.log('[GeminiSessionManager] Stopping stateless session...');
            this.isSessionActive = false;
            console.log('[GeminiSessionManager] Session stopped');
        } catch (error) {
            console.error('[GeminiSessionManager] Error stopping session:', error);
        }
    }

    /**
     * Get the current chat history
     */
    public getChatHistory(): ChatMessage[] {
        return [...this.chatHistory];
    }

    /**
     * Clear the chat history
     */
    public clearChatHistory(): void {
        this.chatHistory = [];
        console.log('[GeminiSessionManager] Chat history cleared');
    }

    /**
     * Check if session is active
     */
    public isActive(): boolean {
        return this.isSessionActive;
    }

    /**
     * Get the current configuration
     */
    public getConfig(): GeminiSessionConfig | null {
        return this.config;
    }

    /**
     * End the chat session (called when user clicks "End Chat")
     */
    public async endChat(): Promise<void> {
        console.log('[GeminiSessionManager] User requested to end chat');
        await this.stopSession();
        this.clearChatHistory();
    }

    /**
     * Restart the session
     */
    public async restartSession(): Promise<boolean> {
        if (this.config) {
            await this.stopSession();
            return await this.startSession(this.config);
        }
        return false;
    }
}
