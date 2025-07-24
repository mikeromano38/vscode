import * as vscode from 'vscode';
import { GOOGLE_CLOUD_SCOPES, GOOGLE_CLOUD_AUTH_PROVIDER } from './shared-constants';

/**
 * Shared Google Cloud Authentication Service
 * 
 * This service manages a single Google Cloud session with a superset of all required scopes
 * to ensure consistency across all extensions and avoid scope mismatches.
 */
export class SharedAuthService {
    private static instance: SharedAuthService;
    private cachedSession: vscode.AuthenticationSession | undefined = undefined;
    private sessionPromise: Promise<vscode.AuthenticationSession | undefined> | null = null;

    // Use shared constants for scopes
    private static readonly REQUIRED_SCOPES = GOOGLE_CLOUD_SCOPES;

    private constructor() {}

    public static getInstance(): SharedAuthService {
        if (!SharedAuthService.instance) {
            SharedAuthService.instance = new SharedAuthService();
        }
        return SharedAuthService.instance;
    }

    /**
     * Get the current Google Cloud session
     * This method ensures only one session is created and cached
     */
    public async getSession(): Promise<vscode.AuthenticationSession | undefined> {
        // If we already have a cached session, return it
        if (this.cachedSession) {
            return this.cachedSession;
        }

        // If there's already a session request in progress, wait for it
        if (this.sessionPromise) {
            return this.sessionPromise;
        }

        // Create a new session request
        this.sessionPromise = this.createSession();
        
        try {
            this.cachedSession = await this.sessionPromise;
            return this.cachedSession;
        } finally {
            this.sessionPromise = null;
        }
    }

    /**
     * Create a new Google Cloud session
     */
    private async createSession(): Promise<vscode.AuthenticationSession | undefined> {
        try {
            console.log('[SharedAuthService] Attempting to get Google Cloud session...');
            console.log('[SharedAuthService] Requested scopes:', SharedAuthService.REQUIRED_SCOPES);

            // First try to get an existing session silently
            let session = await vscode.authentication.getSession(GOOGLE_CLOUD_AUTH_PROVIDER, SharedAuthService.REQUIRED_SCOPES, { silent: true });
            
            if (session) {
                console.log('[SharedAuthService] Found existing session:', session.account.label);
                console.log('[SharedAuthService] Session scopes:', session.scopes);
                return session;
            }

            // If no session exists, create a new one
            console.log('[SharedAuthService] No existing session found, creating new session...');
            session = await vscode.authentication.getSession(GOOGLE_CLOUD_AUTH_PROVIDER, SharedAuthService.REQUIRED_SCOPES, { createIfNone: true });
            
            if (session) {
                console.log('[SharedAuthService] Created new session:', session.account.label);
                console.log('[SharedAuthService] Session scopes:', session.scopes);
            } else {
                console.log('[SharedAuthService] Failed to create session');
            }

            return session;
        } catch (error) {
            console.error('[SharedAuthService] Failed to get Google Cloud session:', error);
            return undefined;
        }
    }

    /**
     * Clear the cached session (useful for testing or when user signs out)
     */
    public clearCache(): void {
        this.cachedSession = undefined;
        this.sessionPromise = null;
        console.log('[SharedAuthService] Session cache cleared');
    }

    /**
     * Check if the user is authenticated
     */
    public async isAuthenticated(): Promise<boolean> {
        const session = await this.getSession();
        return !!session;
    }

    /**
     * Get the access token from the current session
     */
    public async getAccessToken(): Promise<string | undefined> {
        const session = await this.getSession();
        return session?.accessToken;
    }

    /**
     * Get the account information from the current session
     */
    public async getAccount(): Promise<vscode.AuthenticationSession | undefined> {
        return this.getSession();
    }
} 