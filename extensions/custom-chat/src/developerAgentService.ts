import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { ConfigHelper } from './configHelper';
import { GeminiCliService } from './geminiCliService';
import { GeminiSessionManager, GeminiSessionConfig } from './geminiSessionManager';

export interface AgentResponse {
    content: string;
    type: 'text' | 'data' | 'error';
    metadata?: any;
    checkpointId?: string;
    isStreaming?: boolean;
}

export interface AgentUpdate {
    type: 'start' | 'content' | 'complete' | 'error';
    content?: string;
    error?: string;
    isTyping?: boolean;
}

export interface CheckpointInfo {
    id: string;
    timestamp: Date;
    message: string;
    description: string;
}

export class DeveloperAgentService extends EventEmitter {
    private static instance: DeveloperAgentService;
    private geminiCliService: GeminiCliService | null = null;
    private sessionManager: GeminiSessionManager | null = null;
    private checkpoints: CheckpointInfo[] = [];
    private currentCheckpointId: string | null = null;
    private currentResponse: string = '';
    private isTyping: boolean = false;
    
    private constructor() {
        super();
    }
    
    public static getInstance(): DeveloperAgentService {
        if (!DeveloperAgentService.instance) {
            DeveloperAgentService.instance = new DeveloperAgentService();
        }
        return DeveloperAgentService.instance;
    }
    
    /**
     * Initialize the agent service with Gemini CLI integration
     */
    public async initialize(context?: vscode.ExtensionContext): Promise<boolean> {
        try {
            console.log('[DeveloperAgentService] Initializing with Gemini CLI integration...');
            
            if (context) {
                this.geminiCliService = GeminiCliService.getInstance(context);
                const isInitialized = await this.geminiCliService.initialize();
                
                if (isInitialized) {
                    console.log('[DeveloperAgentService] Gemini CLI integration initialized successfully');
                    
                    // Initialize session manager
                    this.sessionManager = GeminiSessionManager.getInstance(context);
                    
                    // Start a persistent session
                    const workspaceDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
                    const sessionConfig: GeminiSessionConfig = {
                        model: 'gemini-2.5-pro',
                        debug: false,
                        yolo: true,
                        checkpointing: true,
                        workspaceDir: workspaceDir,
                        systemPrompt: `You are "Cursor for Data" - a specialized AI assistant for Google Cloud data analytics and BigQuery operations. You excel at helping data professionals work with Google Cloud's data services.

**Core Capabilities:**
1. **BigQuery SQL Development**: Write, optimize, and debug BigQuery SQL queries
2. **Data Analysis**: Help with exploratory data analysis, data profiling, and insights
3. **Data Pipeline Development**: Assist with Dataflow, Cloud Functions, and ETL processes
4. **Data Visualization**: Help create charts, dashboards, and reports
5. **Google Cloud Data Services**: Work with Cloud Storage, Pub/Sub, Dataform, Looker, etc.
6. **Data Governance**: Help with data quality, lineage, and compliance

**BigQuery Expertise:**
- Write efficient, cost-optimized SQL queries
- Use BigQuery ML for machine learning workflows
- Leverage BigQuery's advanced features (partitioning, clustering, etc.)
- Work with BigQuery's public datasets
- Optimize query performance and costs

**IMPORTANT: Always Ask for Confirmation**
Before proceeding with any actions that will modify files, execute commands, or make changes, you MUST:

1. **Present a clear plan** of what you intend to do
2. **Ask for explicit confirmation** before proceeding
3. **Wait for user approval** before executing any actions
4. **Only proceed** after receiving clear confirmation

**Response Formatting Guidelines:**
When performing multiple operations or providing step-by-step responses, use the following structured format:

**For Planning (ALWAYS do this first):**
\`\`\`plan
PLAN: [Clear description of what will be done]
STEPS: [Numbered list of specific steps]
FILES: [List of files that will be affected]
RISKS: [Any potential risks or considerations]
\`\`\`

**For File Operations:**
\`\`\`step
STEP: [Step number] - [Brief description]
ACTION: [What was done]
FILE: [filename.ext]
\`\`\`

**For Code Changes:**
\`\`\`patch
FILE: [filename.ext]
CHANGES:
[Show the actual code changes with + and - indicators]
\`\`\`

**For Multi-step Processes:**
\`\`\`summary
COMPLETED: [List of completed actions]
NEXT: [What's coming next]
\`\`\`

**For Data Analysis Results:**
\`\`\`insights
FINDING: [Key insight]
DATA: [Supporting data or metrics]
RECOMMENDATION: [Actionable recommendation]
\`\`\`

**General Guidelines:**
- **ALWAYS present a plan first** before any file modifications or command execution
- **Ask "Should I proceed with this plan?"** after presenting the plan
- **Wait for confirmation** before executing any actions
- Always include detailed comments in SQL queries explaining the business logic
- Suggest query optimizations and cost-saving measures
- Provide data insights and recommendations when analyzing results
- Use BigQuery best practices (partitioning, clustering, materialized views)
- Consider data governance, security, and compliance requirements
- When creating files, use clear naming conventions and documentation
- Suggest relevant Google Cloud services for data workflows
- Use the structured format above for multi-step operations

**Current Workspace:** ${workspaceDir}

You have direct access to BigQuery through MCP servers and can execute queries, explore datasets, and provide real-time data insights.`
                    };
                    
                    const sessionStarted = await this.sessionManager.startSession(sessionConfig);
                    if (sessionStarted) {
                        console.log('[DeveloperAgentService] Persistent session started successfully');
                    } else {
                        console.warn('[DeveloperAgentService] Failed to start persistent session, falling back to individual commands');
                    }
                    
                    return true;
                } else {
                    console.warn('[DeveloperAgentService] Gemini CLI initialization failed, falling back to basic mode');
                    return false;
                }
            }
            
            return false;
        } catch (error) {
            console.error('[DeveloperAgentService] Initialization error:', error);
            return false;
        }
    }
    
    /**
     * Process a message in agent mode using Gemini CLI
     * @param message The user's message
     * @param context Optional context information
     * @returns Promise that resolves to the agent response
     */
    public async processAgentMessage(message: string, context?: any): Promise<AgentResponse> {
        try {
            console.log('[DeveloperAgentService] Processing agent message:', message);
            console.log('[DeveloperAgentService] Context:', context);
            
            // Try to use session manager if available
            if (this.sessionManager) {
                console.log('[DeveloperAgentService] Session manager available, checking if active...');
                
                // If session is not active, try to restart it
                if (!this.sessionManager.isActive()) {
                    console.log('[DeveloperAgentService] Session not active, attempting to restart...');
                    const workspaceDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
                    const sessionConfig: GeminiSessionConfig = {
                        model: 'gemini-2.5-pro',
                        debug: false,
                        yolo: true,
                        checkpointing: true,
                        workspaceDir: workspaceDir,
                        systemPrompt: `You are "Cursor for Data" - a specialized AI assistant for Google Cloud data analytics and BigQuery operations. You excel at helping data professionals work with Google Cloud's data services.

**Core Capabilities:**
1. **BigQuery SQL Development**: Write, optimize, and debug BigQuery SQL queries
2. **Data Analysis**: Help with exploratory data analysis, data profiling, and insights
3. **Data Pipeline Development**: Assist with Dataflow, Cloud Functions, and ETL processes
4. **Data Visualization**: Help create charts, dashboards, and reports
5. **Google Cloud Data Services**: Work with Cloud Storage, Pub/Sub, Dataform, Looker, etc.
6. **Data Governance**: Help with data quality, lineage, and compliance

**BigQuery Expertise:**
- Write efficient, cost-optimized SQL queries
- Use BigQuery ML for machine learning workflows
- Leverage BigQuery's advanced features (partitioning, clustering, etc.)
- Work with BigQuery's public datasets
- Optimize query performance and costs

**IMPORTANT: Always Ask for Confirmation**
Before proceeding with any actions that will modify files, execute commands, or make changes, you MUST:

1. **Present a clear plan** of what you intend to do
2. **Ask for explicit confirmation** before proceeding
3. **Wait for user approval** before executing any actions
4. **Only proceed** after receiving clear confirmation

**Response Formatting Guidelines:**
When performing multiple operations or providing step-by-step responses, use the following structured format:

**For Planning (ALWAYS do this first):**
\`\`\`plan
PLAN: [Clear description of what will be done]
STEPS: [Numbered list of specific steps]
FILES: [List of files that will be affected]
RISKS: [Any potential risks or considerations]
\`\`\`

**For File Changes or Operations:**
\`\`\`step
STEP: [Step number] - [Brief description]
ACTION: [What was done]
FILE: [filename.ext]
CHANGES:
[Show the actual code changes with + and - indicators]
\`\`\`

**At completion of plan show summary:**
\`\`\`summary
COMPLETED: [List of completed actions]
NEXT: [What's coming next]
\`\`\`

**General Guidelines:**
- **ALWAYS present a plan first** before any file modifications or command execution
- **Ask "Should I proceed with this plan?"** after presenting the plan
- **Wait for confirmation** before executing any actions
- Always include detailed comments in SQL queries explaining the business logic
- Suggest query optimizations and cost-saving measures
- Stream back a summary of each step as it completes
- Provide data insights and recommendations when analyzing results
- When creating files, use clear naming conventions and documentation
- Use BigQuery DTS to schedule queries
- Use the structured format above for multi-step operations

**Current Workspace:** ${workspaceDir}

You have direct access to BigQuery through MCP servers and can execute queries, explore datasets, and provide real-time data insights.`
                    };
                    
                    const sessionStarted = await this.sessionManager.startSession(sessionConfig);
                    if (!sessionStarted) {
                        console.warn('[DeveloperAgentService] Failed to restart session, falling back to individual commands');
                    } else {
                        console.log('[DeveloperAgentService] Session restarted successfully');
                    }
                }
                
                // Try to use the session if it's now active
                if (this.sessionManager.isActive()) {
                    console.log('[DeveloperAgentService] Using stateless session for message processing');
                    
                    // Reset streaming state
                    this.currentResponse = '';
                    this.isTyping = false;
                    
                    // Set up session update listener
                    const updateListener = (update: any) => {
                        this.handleSessionUpdate(update);
                    };
                    
                    this.sessionManager.on('update', updateListener);
                    
                    try {
                        const sessionResponse = await this.sessionManager.sendMessage(message);
                        
                        // Remove the listener
                        this.sessionManager.removeListener('update', updateListener);
                        
                        if (sessionResponse.success) {
                            console.log('[DeveloperAgentService] Session response received');
                            
                            // Create a new checkpoint for this interaction
                            const checkpointId = this.createCheckpoint(message, sessionResponse.content);
                            
                            return {
                                content: sessionResponse.content,
                                type: 'text',
                                metadata: {
                                    source: 'gemini-cli-session',
                                    model: 'gemini-2.5-pro',
                                    timestamp: new Date().toISOString(),
                                    checkpointId: checkpointId,
                                    sessionActive: true
                                },
                                checkpointId: checkpointId
                            };
                        } else {
                            console.warn('[DeveloperAgentService] Session failed, falling back to individual commands');
                        }
                    } catch (error) {
                        // Remove the listener on error
                        this.sessionManager.removeListener('update', updateListener);
                        throw error;
                    }
                }
            }
            
            // Fallback to individual commands if session is not available
            if (!this.geminiCliService || !this.geminiCliService.isReady()) {
                console.warn('[DeveloperAgentService] Gemini CLI not available, using fallback response');
                return {
                    content: `🤖 Agent Mode: "${message}"\n\n⚠️ Gemini CLI integration is not available. Please ensure:\n1. Gemini CLI is installed\n2. genai-toolbox is configured\n3. Google Cloud authentication is set up\n\nRun "DataVibe: Test Gemini CLI Integration" to troubleshoot.`,
                    type: 'error',
                    metadata: { fallback: true }
                };
            }
            
            // Process the message through Gemini CLI (fallback)
            console.log('[DeveloperAgentService] Executing Gemini CLI command (fallback)...');
            
            const response = await this.geminiCliService.executeGeminiCli({
                prompt: message,
                options: {
                    model: 'gemini-2.5-pro',
                    debug: false
                }
            });
            
            console.log('[DeveloperAgentService] Gemini CLI response received');
            
            // Create a new checkpoint for this interaction
            const checkpointId = this.createCheckpoint(message, response);
            
            return {
                content: response,
                type: 'text',
                metadata: {
                    source: 'gemini-cli',
                    model: 'gemini-2.5-pro',
                    timestamp: new Date().toISOString(),
                    checkpointId: checkpointId
                },
                checkpointId: checkpointId
            };
            
        } catch (error) {
            console.error('[DeveloperAgentService] Error processing agent message:', error);
            
            return {
                content: `❌ Error processing your request:\n\n${error instanceof Error ? error.message : String(error)}\n\nPlease try:\n1. Running "DataVibe: Test Gemini CLI Integration"\n2. Checking your Google Cloud authentication\n3. Ensuring genai-toolbox is properly configured`,
                type: 'error',
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }
    
    /**
     * Check if the agent service is available
     * @returns Promise that resolves to true if the service is available
     */
    public async isAvailable(): Promise<boolean> {
        try {
            if (!this.geminiCliService) {
                return false;
            }
            
            return this.geminiCliService.isReady();
        } catch (error) {
            console.error('[DeveloperAgentService] Error checking availability:', error);
            return false;
        }
    }
    
    /**
     * Get agent service configuration
     * @returns Promise that resolves to the service configuration
     */
    public async getConfiguration(): Promise<any> {
        try {
            const geminiConfig = this.geminiCliService?.getConfiguration();
            
            return {
                serviceType: 'developer-agent',
                version: '1.0.0',
                capabilities: ['text-processing', 'code-analysis', 'bigquery-analysis'],
                status: await this.isAvailable() ? 'available' : 'unavailable',
                geminiCli: geminiConfig ? {
                    isInstalled: geminiConfig.isInstalled,
                    version: geminiConfig.version,
                    mcpServersConfigured: geminiConfig.mcpServersConfigured
                } : null
            };
        } catch (error) {
            console.error('[DeveloperAgentService] Error getting configuration:', error);
            return {
                serviceType: 'developer-agent',
                version: '1.0.0',
                capabilities: ['text-processing', 'code-analysis'],
                status: 'error',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Create a new checkpoint for the current interaction
     */
    private createCheckpoint(userMessage: string, response: string): string {
        const checkpointId = `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const description = userMessage.length > 50 ? userMessage.substring(0, 47) + '...' : userMessage;
        
        const checkpoint: CheckpointInfo = {
            id: checkpointId,
            timestamp: new Date(),
            message: userMessage,
            description: description
        };
        
        this.checkpoints.push(checkpoint);
        this.currentCheckpointId = checkpointId;
        
        console.log('[DeveloperAgentService] Created checkpoint:', checkpointId);
        return checkpointId;
    }

    /**
     * Get all available checkpoints
     */
    public getCheckpoints(): CheckpointInfo[] {
        return [...this.checkpoints];
    }

    /**
     * Restore to a specific checkpoint
     */
    public async restoreCheckpoint(checkpointId: string): Promise<AgentResponse> {
        try {
            const checkpoint = this.checkpoints.find(cp => cp.id === checkpointId);
            if (!checkpoint) {
                throw new Error(`Checkpoint ${checkpointId} not found`);
            }

            console.log('[DeveloperAgentService] Restoring checkpoint:', checkpointId);
            
            // Execute the original message again to restore state
            const response = await this.processAgentMessage(checkpoint.message, { restore: true });
            
            this.currentCheckpointId = checkpointId;
            return response;
            
        } catch (error) {
            console.error('[DeveloperAgentService] Error restoring checkpoint:', error);
            return {
                content: `❌ Error restoring checkpoint: ${error instanceof Error ? error.message : String(error)}`,
                type: 'error',
                metadata: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    }

    /**
     * Get the current checkpoint ID
     */
    public getCurrentCheckpointId(): string | null {
        return this.currentCheckpointId;
    }

    /**
     * Get chat history from the session
     */
    public getChatHistory() {
        return this.sessionManager?.getChatHistory() || [];
    }

    /**
     * Clear chat history
     */
    public clearChatHistory() {
        this.sessionManager?.clearChatHistory();
    }

    /**
     * Restart the session
     */
    public async restartSession(): Promise<boolean> {
        if (this.sessionManager) {
            return await this.sessionManager.restartSession();
        }
        return false;
    }

    /**
     * Handle session updates and emit agent updates with typing effect
     */
    private handleSessionUpdate(update: any): void {
        switch (update.type) {
            case 'start':
                this.currentResponse = '';
                this.isTyping = true;
                this.emit('update', { type: 'start', isTyping: true } as AgentUpdate);
                break;
                
            case 'content':
                if (update.content) {
                    this.currentResponse += update.content;
                    this.emit('update', { 
                        type: 'content', 
                        content: update.content,
                        isTyping: true 
                    } as AgentUpdate);
                }
                break;
                
            case 'complete':
                this.isTyping = false;
                // Don't send content again since it's already been streamed
                this.emit('update', { 
                    type: 'complete', 
                    isTyping: false 
                } as AgentUpdate);
                break;
                
            case 'error':
                this.isTyping = false;
                this.emit('update', { 
                    type: 'error', 
                    error: update.error,
                    isTyping: false 
                } as AgentUpdate);
                break;
        }
    }

    /**
     * Check if session is active
     */
    public isSessionActive(): boolean {
        return this.sessionManager?.isActive() || false;
    }
} 