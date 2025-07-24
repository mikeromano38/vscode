/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { GOOGLE_CLOUD_SCOPES, GOOGLE_CLOUD_AUTH_PROVIDER, CONFIG_SECTIONS } from './shared-constants';

export interface GoogleCloudProject {
	projectId: string;
	region: string;
}

export interface GoogleCloudCredentials {
	accessToken: string;
	refreshToken?: string;
	expiresAt?: number;
}

export class GoogleCloudService {
	private static instance: GoogleCloudService;

	private constructor() {}

	public static getInstance(): GoogleCloudService {
		if (!GoogleCloudService.instance) {
			GoogleCloudService.instance = new GoogleCloudService();
		}
		return GoogleCloudService.instance;
	}

	/**
	 * Get the current access token for Google Cloud API calls
	 */
	public async getAccessToken(): Promise<string | undefined> {
		try {
			const sessions = await vscode.authentication.getSession(GOOGLE_CLOUD_AUTH_PROVIDER, GOOGLE_CLOUD_SCOPES, { silent: true });
			return sessions?.accessToken;
		} catch (error) {
			console.error('Failed to get access token:', error);
			return undefined;
		}
	}

	/**
	 * Get the current Google Cloud project information
	 */
	public async getCurrentProject(): Promise<GoogleCloudProject | undefined> {
		const projectId = vscode.workspace.getConfiguration(CONFIG_SECTIONS.GOOGLE_CLOUD).get('projectId', '');
		const region = vscode.workspace.getConfiguration(CONFIG_SECTIONS.GOOGLE_CLOUD).get('region', 'us-central1');
		
		if (projectId) {
			return { projectId, region };
		}
		
		return undefined;
	}

	/**
	 * Set the current Google Cloud project
	 */
	public async setCurrentProject(projectId: string, region: string = 'us-central1'): Promise<void> {
		await vscode.workspace.getConfiguration(CONFIG_SECTIONS.GOOGLE_CLOUD).update('projectId', projectId, vscode.ConfigurationTarget.Global);
		await vscode.workspace.getConfiguration(CONFIG_SECTIONS.GOOGLE_CLOUD).update('region', region, vscode.ConfigurationTarget.Global);
	}

	/**
	 * Check if the user is authenticated with Google Cloud
	 */
	public async isAuthenticated(): Promise<boolean> {
		try {
			const sessions = await vscode.authentication.getSession(GOOGLE_CLOUD_AUTH_PROVIDER, GOOGLE_CLOUD_SCOPES, { silent: true });
			return !!sessions;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Authenticate with Google Cloud
	 */
	public async authenticate(): Promise<boolean> {
		try {
			const session = await vscode.authentication.getSession(GOOGLE_CLOUD_AUTH_PROVIDER, GOOGLE_CLOUD_SCOPES, { createIfNone: true });
			return !!session;
		} catch (error) {
			console.error('Authentication failed:', error);
			return false;
		}
	}

	/**
	 * Sign out of Google Cloud
	 */
	public async signOut(): Promise<void> {
		try {
			// Note: VS Code doesn't provide a direct way to get all sessions
			// This is a limitation - we can only sign out the current session
			const session = await vscode.authentication.getSession(GOOGLE_CLOUD_AUTH_PROVIDER, GOOGLE_CLOUD_SCOPES, { silent: true });
			if (session) {
				// VS Code doesn't provide a direct removeSession method
				// The session will be cleared when the user signs out through the extension
				console.log('Session found, but VS Code doesn\'t provide direct session removal');
			}
		} catch (error) {
			console.error('Sign out failed:', error);
		}
	}

	/**
	 * Make an authenticated request to Google Cloud APIs
	 */
	public async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
		const accessToken = await this.getAccessToken();
		if (!accessToken) {
			throw new Error('No access token available. Please authenticate with Google Cloud first.');
		}

		const headers = {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			...options.headers
		};

		return fetch(url, {
			...options,
			headers
		});
	}

	/**
	 * Get a list of available Google Cloud projects
	 */
	public async getProjects(): Promise<any[]> {
		const response = await this.makeAuthenticatedRequest('https://cloudresourcemanager.googleapis.com/v1/projects');
		
		if (!response.ok) {
			throw new Error(`Failed to get projects: ${response.status} ${response.statusText}`);
		}

		const data = await response.json() as any;
		return data.projects || [];
	}

	/**
	 * Get information about a specific project
	 */
	public async getProjectInfo(projectId: string): Promise<any> {
		const response = await this.makeAuthenticatedRequest(`https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}`);
		
		if (!response.ok) {
			throw new Error(`Failed to get project info: ${response.status} ${response.statusText}`);
		}

		return await response.json();
	}
} 