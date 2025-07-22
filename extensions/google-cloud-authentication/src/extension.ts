/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { GoogleCloudAuthenticationProvider, UriEventHandler } from './googleCloud';
import { GoogleCloudBannerService } from './bannerService';

export function activate(context: vscode.ExtensionContext) {
	// Register the Google Cloud authentication provider
	const googleCloudAuthProvider = new GoogleCloudAuthenticationProvider(context, new UriEventHandler());
	context.subscriptions.push(googleCloudAuthProvider);

	// Register the banner service for authentication prompts
	const bannerService = new GoogleCloudBannerService(context, googleCloudAuthProvider);
	context.subscriptions.push(bannerService);

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('google-cloud.authenticate', async () => {
			try {
				// Check if we already have valid sessions
				const existingSessions = await googleCloudAuthProvider.getSessions(['https://www.googleapis.com/auth/cloud-platform']);
				
				if (existingSessions.length > 0) {
					vscode.window.showInformationMessage(`Already authenticated as ${existingSessions[0].account.label}`);
				} else {
					// Only create a new session if we don't have any
					await googleCloudAuthProvider.createSession(['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']);
					vscode.window.showInformationMessage('Successfully authenticated with Google Cloud');
				}
				
				// Check if project is configured
				const project = await googleCloudAuthProvider.getCurrentProject();
				if (!project) {
					const result = await vscode.window.showInformationMessage(
						'Please configure your Google Cloud project ID in the extension settings.',
						'Open Settings'
					);
					if (result === 'Open Settings') {
						vscode.commands.executeCommand('google-cloud.openSettings');
					}
				}
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to authenticate with Google Cloud: ${error}`);
			}
		})
	);

	// Project selection is now handled through settings, not commands

	context.subscriptions.push(
		vscode.commands.registerCommand('google-cloud.signOut', async () => {
			try {
				const sessions = await googleCloudAuthProvider.getSessions(['https://www.googleapis.com/auth/cloud-platform']);
				for (const session of sessions) {
					await googleCloudAuthProvider.removeSession(session.id);
				}
				vscode.window.showInformationMessage('Signed out of Google Cloud');
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to sign out: ${error}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('google-cloud.clearAllSessions', async () => {
			try {
				// Get all sessions regardless of scope
				const allSessions = await googleCloudAuthProvider.getSessions(undefined);
				for (const session of allSessions) {
					await googleCloudAuthProvider.removeSession(session.id);
				}
				vscode.window.showInformationMessage(`Cleared ${allSessions.length} sessions`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to clear sessions: ${error}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('google-cloud.forceStopOAuth', async () => {
			try {
				// Force stop any running OAuth server and clear pending auth
				await googleCloudAuthProvider.forceStopOAuth();
				vscode.window.showInformationMessage('OAuth process force stopped');
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to force stop OAuth: ${error}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('google-cloud.debug', async () => {
			try {
				const sessions = await googleCloudAuthProvider.getSessions(['https://www.googleapis.com/auth/cloud-platform']);
				const project = await googleCloudAuthProvider.getCurrentProject();
				const accessToken = await googleCloudAuthProvider.getAccessToken();
				
				let message = `Debug Info:\n`;
				message += `Sessions: ${sessions.length}\n`;
				message += `Project: ${project ? `${project.projectId} (${project.region})` : 'None'}\n`;
				message += `Access Token: ${accessToken ? 'Present' : 'None'}\n`;
				
				if (sessions.length > 0) {
					message += `\nSession Details:\n`;
					sessions.forEach((session, index) => {
						message += `Session ${index + 1}: ${session.account.label} (${session.scopes.join(', ')})\n`;
					});
				}
				
				vscode.window.showInformationMessage(message);
			} catch (error) {
				vscode.window.showErrorMessage(`Debug failed: ${error}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('google-cloud.testOAuth', async () => {
			try {
				// Check if we already have valid sessions
				const existingSessions = await googleCloudAuthProvider.getSessions(['https://www.googleapis.com/auth/cloud-platform']);
				
				if (existingSessions.length > 0) {
					vscode.window.showInformationMessage(`Already authenticated as ${existingSessions[0].account.label}. Testing existing session...`);
					
					// Test the existing session by getting user info
					const accessToken = await googleCloudAuthProvider.getAccessToken();
					if (accessToken) {
						vscode.window.showInformationMessage('Existing session is valid and working!');
					} else {
						vscode.window.showErrorMessage('Existing session has no access token');
					}
				} else {
					vscode.window.showInformationMessage('Starting OAuth test... Check the output panel for detailed logs.');
					
					// Try to create a session with cloud-platform and user info scopes
					const session = await googleCloudAuthProvider.createSession(['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']);
					
					vscode.window.showInformationMessage(`OAuth test successful! User: ${session.account.label}`);
				}
				
				// Check if project is configured
				const project = await googleCloudAuthProvider.getCurrentProject();
				if (!project) {
					const result = await vscode.window.showInformationMessage(
						'Please configure your Google Cloud project ID in the extension settings.',
						'Open Settings'
					);
					if (result === 'Open Settings') {
						vscode.commands.executeCommand('google-cloud.openSettings');
					}
				}
			} catch (error) {
				vscode.window.showErrorMessage(`OAuth test failed: ${error}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('google-cloud.showLogs', () => {
			// Show the output panel with logs
			vscode.commands.executeCommand('workbench.action.output.toggleOutput');
			vscode.commands.executeCommand('workbench.action.output.selectOutputChannel', 'Google Cloud Authentication');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('google-cloud.openSettings', () => {
			// Open the settings page for Google Cloud configuration
			vscode.commands.executeCommand('workbench.action.openSettings', 'google-cloud');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('google-cloud.checkStorage', async () => {
			try {
				// This is a debug command to check what's stored in the keychain
				const { Keychain } = await import('./common/keychain');
				const keychain = new Keychain(context, 'google-cloud-auth');
				const stored = await keychain.getToken();
				
				let message = `Storage Debug:\n`;
				message += `Stored data: ${stored ? 'Present' : 'None'}\n`;
				
				if (stored) {
					try {
						const sessions = JSON.parse(stored);
						message += `Parsed sessions: ${sessions.length}\n`;
						if (sessions.length > 0) {
							message += `Session scopes: ${sessions[0].scopes?.join(', ') || 'None'}\n`;
							message += `Session account: ${sessions[0].account?.label || 'None'}\n`;
						}
					} catch (e) {
						message += `Parse error: ${e}\n`;
					}
				}
				
				vscode.window.showInformationMessage(message);
			} catch (error) {
				vscode.window.showErrorMessage(`Storage check failed: ${error}`);
			}
		})
	);

	// Check for authentication on startup
	checkAuthenticationOnStartup(context, googleCloudAuthProvider, bannerService);
}

async function checkAuthenticationOnStartup(
	_context: vscode.ExtensionContext,
	authProvider: GoogleCloudAuthenticationProvider,
	bannerService: GoogleCloudBannerService
) {
	// Wait a bit for the workbench to be ready
	setTimeout(async () => {
		const autoAuthenticate = vscode.workspace.getConfiguration('google-cloud').get('autoAuthenticate', true);
		
		if (autoAuthenticate) {
			const sessions = await authProvider.getSessions(['https://www.googleapis.com/auth/cloud-platform']);
			if (sessions.length === 0) {
				// Show banner to prompt for authentication
				bannerService.showAuthenticationBanner();
			}
			// Note: Project selection is now handled through settings, not prompts
		}
	}, 2000);
}

 