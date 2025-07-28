import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface GoogleCloudConfig {
    projectId: string;
    useApplicationDefaultCredentials: boolean;
}

export interface GeminiConfig {
    model: string;
    debugMode: boolean;
    apiKey: string;
}

export interface ExtensionConfig {
    googleCloud: GoogleCloudConfig;
    gemini: GeminiConfig;
}

export class ConfigService {
    private static instance: ConfigService;
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context?: vscode.ExtensionContext): ConfigService {
        if (!ConfigService.instance && context) {
            ConfigService.instance = new ConfigService(context);
        }
        return ConfigService.instance;
    }

    /**
     * Get the complete extension configuration
     */
    public getConfig(): ExtensionConfig {
        const config = vscode.workspace.getConfiguration('customChat');
        
        return {
            googleCloud: {
                projectId: config.get('googleCloud.projectId', ''),
                useApplicationDefaultCredentials: config.get('googleCloud.useApplicationDefaultCredentials', true)
            },
            gemini: {
                model: config.get('gemini.model', 'gemini-2.5-pro'),
                debugMode: config.get('gemini.debugMode', false),
                apiKey: config.get('gemini.apiKey', '')
            }
        };
    }

    /**
     * Get Google Cloud configuration
     */
    public getGoogleCloudConfig(): GoogleCloudConfig {
        return this.getConfig().googleCloud;
    }

    /**
     * Get Gemini configuration
     */
    public getGeminiConfig(): GeminiConfig {
        return this.getConfig().gemini;
    }

    /**
     * Get the effective Google Cloud project ID
     * Falls back to gcloud configured project if not set in extension settings
     */
    public async getEffectiveProjectId(): Promise<string> {
        const config = this.getGoogleCloudConfig();
        
        if (config.projectId) {
            console.log('[ConfigService] Using project ID from extension settings:', config.projectId);
            return config.projectId;
        }

        // Try to get from gcloud
        try {
            const { exec } = require('child_process');
            const projectId = await new Promise<string>((resolve, reject) => {
                exec('gcloud config get-value project', (error: any, stdout: string, stderr: string) => {
                    if (error) {
                        reject(error);
                    } else {
                        const project = stdout.trim();
                        if (project && project !== '(unset)') {
                            resolve(project);
                        } else {
                            reject(new Error('No project configured in gcloud'));
                        }
                    }
                });
            });
            
            console.log('[ConfigService] Using project ID from gcloud:', projectId);
            return projectId;
        } catch (error) {
            console.warn('[ConfigService] Could not get project ID from gcloud:', error);
            return '';
        }
    }

    /**
     * Get the effective Google Cloud credentials path
     * Now only supports Application Default Credentials
     */
    public async getEffectiveCredentialsPath(): Promise<string> {
        const config = this.getGoogleCloudConfig();
        
        if (config.useApplicationDefaultCredentials) {
            console.log('[ConfigService] Using Application Default Credentials');
            return '';
        }

        console.warn('[ConfigService] Application Default Credentials disabled but no alternative configured');
        return '';
    }

    /**
     * Get the effective Gemini API key
     * Falls back to GEMINI_API_KEY environment variable if not set in extension settings
     */
    public async getEffectiveGeminiApiKey(): Promise<string> {
        const config = this.getGeminiConfig();
        
        if (config.apiKey) {
            console.log('[ConfigService] Using Gemini API key from extension settings');
            return config.apiKey;
        }

        // Fall back to environment variable
        const envApiKey = process.env.GEMINI_API_KEY;
        if (envApiKey) {
            console.log('[ConfigService] Using Gemini API key from environment variable');
            return envApiKey;
        }

        console.log('[ConfigService] No Gemini API key configured');
        return '';
    }

    /**
     * Validate the current configuration
     */
    public async validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];
        const config = this.getConfig();

        // Validate Google Cloud configuration
        const projectId = await this.getEffectiveProjectId();
        if (!projectId) {
            errors.push('No Google Cloud project ID configured. Set customChat.googleCloud.projectId or run "gcloud config set project YOUR_PROJECT_ID"');
        }

        // Check for BigQuery/tool authentication method
        if (!config.googleCloud.useApplicationDefaultCredentials) {
            errors.push('Application Default Credentials must be enabled for BigQuery authentication. Set customChat.googleCloud.useApplicationDefaultCredentials to true');
        }

        // Check for Gemini authentication method
        const geminiApiKey = await this.getEffectiveGeminiApiKey();
        if (!geminiApiKey) {
            errors.push('No Gemini API key configured. Set customChat.gemini.apiKey for Gemini authentication');
        }

        // Validate Gemini configuration
        if (!config.gemini.model) {
            errors.push('No Gemini model configured');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Update configuration values
     */
    public async updateConfig(updates: Partial<ExtensionConfig>): Promise<void> {
        const config = vscode.workspace.getConfiguration('customChat');

        if (updates.googleCloud) {
            if (updates.googleCloud.projectId !== undefined) {
                await config.update('googleCloud.projectId', updates.googleCloud.projectId, vscode.ConfigurationTarget.Global);
            }
            if (updates.googleCloud.useApplicationDefaultCredentials !== undefined) {
                await config.update('googleCloud.useApplicationDefaultCredentials', updates.googleCloud.useApplicationDefaultCredentials, vscode.ConfigurationTarget.Global);
            }
        }

        if (updates.gemini) {
            if (updates.gemini.model !== undefined) {
                await config.update('gemini.model', updates.gemini.model, vscode.ConfigurationTarget.Global);
            }
            if (updates.gemini.debugMode !== undefined) {
                await config.update('gemini.debugMode', updates.gemini.debugMode, vscode.ConfigurationTarget.Global);
            }
            if (updates.gemini.apiKey !== undefined) {
                await config.update('gemini.apiKey', updates.gemini.apiKey, vscode.ConfigurationTarget.Global);
            }
        }
    }

    /**
     * Get configuration status for display
     */
    public async getConfigStatus(): Promise<{
        projectId: string;
        credentialsStatus: string;
        geminiModel: string;
        geminiApiKeyStatus: string;
        isValid: boolean;
    }> {
        const projectId = await this.getEffectiveProjectId();
        const config = this.getConfig();
        
        // BigQuery/Tool authentication status
        let credentialsStatus = 'Not configured';
        if (config.googleCloud.useApplicationDefaultCredentials) {
            credentialsStatus = 'Using Application Default Credentials';
        } else {
            credentialsStatus = 'Application Default Credentials disabled';
        }

        // Gemini authentication status
        let geminiApiKeyStatus = 'Not configured';
        const geminiApiKey = await this.getEffectiveGeminiApiKey();
        if (geminiApiKey) {
            geminiApiKeyStatus = 'Configured';
        }

        return {
            projectId: projectId || 'Not configured',
            credentialsStatus,
            geminiModel: config.gemini.model,
            geminiApiKeyStatus,
            isValid: (await this.validateConfig()).valid
        };
    }

    /**
     * Show configuration in VS Code settings
     */
    public async openSettings(): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'customChat');
    }

    /**
     * Show configuration status
     */
    public async showConfigStatus(): Promise<void> {
        const status = await this.getConfigStatus();
        const validation = await this.validateConfig();
        
        let message = `🔧 **DataVibe Configuration Status**\n\n`;
        message += `**Google Cloud Project:** ${status.projectId}\n`;
        message += `**BigQuery/Tool Authentication:** ${status.credentialsStatus}\n`;
        message += `**Gemini Model:** ${status.geminiModel}\n`;
        message += `**Gemini Authentication:** ${status.geminiApiKeyStatus}\n\n`;
        
        if (validation.valid) {
            message += `✅ **Configuration is valid**\n`;
            message += `All settings are properly configured and ready to use.`;
        } else {
            message += `❌ **Configuration issues found:**\n`;
            validation.errors.forEach(error => {
                message += `• ${error}\n`;
            });
            message += `\n**Recommended Setup:**\n`;
            message += `• BigQuery/Tools: Use Application Default Credentials (ADC)\n`;
            message += `• Gemini: Set customChat.gemini.apiKey\n\n`;
            message += `Use "DataVibe: Open Settings" to configure.`;
        }

        vscode.window.showInformationMessage(message);
    }
} 