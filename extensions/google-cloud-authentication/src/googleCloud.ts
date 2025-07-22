/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as http from 'http';
import * as url from 'url';
import { Keychain } from './common/keychain';
import { arrayEquals } from './common/utils';
import { Log } from './common/logger';
import { crypto } from './node/crypto';

interface SessionData {
	id: string;
	account: {
		label: string;
		displayName: string;
		id: string;
	};
	scopes: string[];
	accessToken: string;
	refreshToken?: string | undefined;
	expiresAt?: number | undefined;
	projectId?: string | undefined;
}

interface GoogleCloudTokenResponse {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	token_type: string;
	scope: string;
}

interface GoogleCloudUserInfo {
	id: string;
	email: string;
	verified_email: boolean;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	locale: string;
}

export class GoogleCloudAuthenticationProvider implements vscode.AuthenticationProvider, vscode.Disposable {
	private readonly _sessionChangeEmitter = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
	private readonly _logger: Log;
	private readonly _keychain: Keychain;
	private readonly _disposable: vscode.Disposable;
	private _oauthServer: http.Server | undefined;
	private _serverPort: number = 3000;
	private _pendingAuth: { nonce: string; resolve: (code: string) => void; reject: (error: Error) => void } | undefined;
	private _previousSessions: SessionData[] = [];

	// Google Cloud OAuth configuration for DataVibe in project romanomike-anarres-dev
	private readonly _clientId = '15672683895-jtp6a6qlk16n4nsggu3tncd24a6la2jt.apps.googleusercontent.com'; 
	private readonly _clientSecret = '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';
	private readonly _tokenUri = 'https://oauth2.googleapis.com/token';
	private readonly _userInfoUri = 'https://www.googleapis.com/oauth2/v2/userinfo';

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly uriHandler: UriEventHandler
	) {
		this._logger = new Log('GoogleCloudAuth');
		this._keychain = new Keychain(context, 'google-cloud-auth');

		this._disposable = vscode.Disposable.from(
			vscode.authentication.registerAuthenticationProvider(
				'google-cloud',
				'Google Cloud',
				this,
				{
					supportsMultipleAccounts: true
				}
			),
			this.context.secrets.onDidChange(() => this.checkForUpdates())
		);

		// Initialize previous sessions
		this.initializePreviousSessions();
	}

	async dispose() {
		this._disposable.dispose();
		await this.stopOAuthServer();
	}

	get onDidChangeSessions() {
		return this._sessionChangeEmitter.event;
	}

	async getSessions(scopes: string[] | undefined, _options?: vscode.AuthenticationProviderSessionOptions): Promise<vscode.AuthenticationSession[]> {
		this._logger.info(`Getting sessions with scopes: ${scopes ? scopes.join(', ') : 'undefined'}`);
		const sessions = await this.readSessions();
		this._logger.info(`Found ${sessions.length} total sessions`);
		
		if (scopes) {
			const filteredSessions = sessions.filter(session => {
				// Check if the session has all the requested scopes (subset check)
				const hasAllScopes = scopes.every(requiredScope => 
					session.scopes.includes(requiredScope)
				);
				this._logger.info(`Session ${session.id} scopes: ${session.scopes.join(', ')} - has all required scopes: ${hasAllScopes}`);
				return hasAllScopes;
			});
			this._logger.info(`Returning ${filteredSessions.length} sessions matching requested scopes`);
			return filteredSessions;
		}
		
		this._logger.info(`Returning all ${sessions.length} sessions`);
		return sessions;
	}

	async createSession(scopes: string[], _options?: vscode.AuthenticationProviderSessionOptions): Promise<vscode.AuthenticationSession> {
		this._logger.info(`Creating session for scopes: ${scopes.join(' ')}`);

		const nonce = crypto.getRandomValues(new Uint8Array(16)).join('');
		const codeVerifier = this.generateCodeVerifier();
		const codeChallenge = await this.generateCodeChallenge(codeVerifier);

		// Start the OAuth server
		await this.startOAuthServer();
		
		// Build the OAuth URL
		const redirectUri = this.getRedirectUri();
		this._logger.info(`OAuth redirect URI: ${redirectUri}`);
		
		const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
		authUrl.searchParams.set('client_id', this._clientId);
		authUrl.searchParams.set('redirect_uri', redirectUri);
		authUrl.searchParams.set('response_type', 'code');
		authUrl.searchParams.set('scope', scopes.join(' '));
		authUrl.searchParams.set('state', nonce);
		authUrl.searchParams.set('code_challenge', codeChallenge);
		authUrl.searchParams.set('code_challenge_method', 'S256');
		authUrl.searchParams.set('access_type', 'offline');
		authUrl.searchParams.set('prompt', 'consent');

		return await vscode.window.withProgress<vscode.AuthenticationSession>({
			location: vscode.ProgressLocation.Notification,
			title: 'Signing in to Google Cloud...',
			cancellable: true
		}, async (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => {
			// Add a timeout to the entire authentication process
			const authTimeout = setTimeout(() => {
				this._logger.error('Authentication process timeout - forcing completion');
				// Force stop OAuth server
				this.stopOAuthServer().catch(err => this._logger.error(`Error stopping OAuth server: ${err}`));
			}, 180000); // 3 minutes total timeout

			try {
				// Open the browser for authentication
				progress.report({ message: 'Opening browser for authentication...' });
				await vscode.env.openExternal(vscode.Uri.parse(authUrl.toString()));
				
				// Wait for the callback with the authorization code
				this._logger.info('Waiting for OAuth callback...');
				progress.report({ message: 'Waiting for authentication callback...' });
				const code = await this.waitForOAuthCode(nonce, token);
				this._logger.info('OAuth code received, exchanging for token...');
				progress.report({ message: 'Exchanging authorization code for token...' });
				const tokenResponse = await this.exchangeCodeForToken(code, codeVerifier);
							this._logger.info('Token received, getting user info...');
				progress.report({ message: 'Getting user information...' });
			let userInfo: GoogleCloudUserInfo;
			
			try {
				userInfo = await this.getUserInfo(tokenResponse.access_token);
			} catch (error) {
				this._logger.warn(`Failed to get user info, using fallback approach: ${error}`);
				// Fallback: create a basic user info object
				userInfo = {
					id: 'unknown',
					email: 'authenticated@google.com',
					verified_email: false,
					name: 'Google Cloud User',
					given_name: 'Google',
					family_name: 'Cloud',
					picture: '',
					locale: 'en'
				};
				
				// Try to get user info from Google Cloud APIs as fallback
				try {
					this._logger.info('Trying to get user info from Google Cloud APIs...');
					const cloudResponse = await fetch('https://cloudresourcemanager.googleapis.com/v1/projects', {
						headers: {
							'Authorization': `Bearer ${tokenResponse.access_token}`
						}
					});
					
					if (cloudResponse.ok) {
						this._logger.info('Successfully accessed Google Cloud APIs');
						userInfo.email = 'gcp-user@google.com';
						userInfo.name = 'Google Cloud Platform User';
					}
				} catch (cloudError) {
					this._logger.warn(`Failed to access Google Cloud APIs: ${cloudError}`);
				}
			}
			
			this._logger.info(`Creating session for user: ${userInfo.email}`);
			this._logger.info(`Token response scopes: ${tokenResponse.scope}`);
			this._logger.info(`Requested scopes: ${scopes.join(' ')}`);
			
			// Use the actual granted scopes from the token response, not the requested scopes
			const grantedScopes = tokenResponse.scope.split(' ').filter(scope => scope.trim() !== '');
			this._logger.info(`Granted scopes: ${grantedScopes.join(' ')}`);
			
			const session: SessionData = {
				id: crypto.getRandomValues(new Uint8Array(16)).join(''),
				account: {
					label: userInfo.email,
					displayName: userInfo.name,
					id: userInfo.id
				},
				scopes: grantedScopes,
				accessToken: tokenResponse.access_token,
				refreshToken: tokenResponse.refresh_token,
				expiresAt: tokenResponse.expires_in ? Date.now() + (tokenResponse.expires_in * 1000) : undefined
			};

				this._logger.info('Storing session...');
				progress.report({ message: 'Storing authentication session...' });
				const sessions = await this.readSessions();
				sessions.push(session);
				await this.storeSessions(sessions);

				this._logger.info('Session created successfully');
				this._sessionChangeEmitter.fire({ added: [this.convertToSession(session)], removed: [], changed: [] });

				// Stop the OAuth server after successful authentication
				progress.report({ message: 'Completing authentication...' });
				await this.stopOAuthServer();

				return this.convertToSession(session);
			} catch (error) {
				this._logger.error(`Authentication failed: ${error}`);
				// Clean up pending auth if there's an error
				if (this._pendingAuth) {
					this._pendingAuth.reject(error as Error);
					this._pendingAuth = undefined;
				}
				// Stop the OAuth server on error
				await this.stopOAuthServer();
				throw error;
			} finally {
				// Always clear the timeout
				clearTimeout(authTimeout);
			}
		});
	}

	async removeSession(id: string): Promise<void> {
		this._logger.info(`Removing session ${id}`);
		const sessions = await this.readSessions();
		const sessionIndex = sessions.findIndex(s => s.id === id);
		if (sessionIndex !== -1) {
			const session = sessions[sessionIndex];
			sessions.splice(sessionIndex, 1);
			await this.storeSessions(sessions);
			this._sessionChangeEmitter.fire({ added: [], removed: [this.convertToSession(session)], changed: [] });
		}
	}

	private async startOAuthServer(): Promise<void> {
		if (this._oauthServer) {
			this._logger.info('OAuth server already running');
			return; // Server already running
		}

		this._logger.info('Starting OAuth server...');
		return new Promise((resolve, reject) => {
			this._oauthServer = http.createServer((req, res) => {
				this._logger.info(`HTTP request received: ${req.method} ${req.url}`);
				
				if (req.url) {
					const parsedUrl = url.parse(req.url, true);
					
					if (parsedUrl.pathname === '/callback') {
						// Set CORS headers
						res.setHeader('Access-Control-Allow-Origin', '*');
						res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
						res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
						
						// Handle preflight requests
						if (req.method === 'OPTIONS') {
							res.writeHead(200);
							res.end();
							return;
						}

						// Handle OAuth callback
						const code = parsedUrl.query.code as string;
						const state = parsedUrl.query.state as string;
						const error = parsedUrl.query.error as string;

						this._logger.info(`OAuth callback received - code: ${code ? 'present' : 'missing'}, state: ${state}, error: ${error || 'none'}`);
						this._logger.info(`Pending auth: ${this._pendingAuth ? 'exists' : 'none'}, expected nonce: ${this._pendingAuth?.nonce}`);

						if (error) {
							this._logger.error(`OAuth error: ${error}`);
							if (this._pendingAuth) {
								this._pendingAuth.reject(new Error(`OAuth error: ${error}`));
								this._pendingAuth = undefined;
							}
							res.writeHead(400, { 'Content-Type': 'text/html' });
							res.end(`
								<!DOCTYPE html>
								<html>
								<head>
									<title>Authentication Failed</title>
									<style>
										body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
										.error { color: red; font-size: 24px; }
										.message { margin: 20px 0; }
									</style>
								</head>
								<body>
									<div class="error">❌ Authentication Failed</div>
									<div class="message">Error: ${error}</div>
									<div class="message">Please try again.</div>
									<script>
										setTimeout(() => {
											window.close();
										}, 3000);
									</script>
								</body>
								</html>
							`);
							return;
						}

						if (code && state && this._pendingAuth && this._pendingAuth.nonce === state) {
							// Success - resolve the pending authentication
							this._logger.info('OAuth callback successful, resolving authentication');
							this._pendingAuth.resolve(code);
							this._pendingAuth = undefined;

							// Send success page
							res.writeHead(200, { 'Content-Type': 'text/html' });
							res.end(`
								<!DOCTYPE html>
								<html>
								<head>
									<title>Authentication Successful</title>
									<style>
										body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
										.success { color: green; font-size: 24px; }
										.message { margin: 20px 0; }
									</style>
								</head>
								<body>
									<div class="success">✅ Authentication Successful!</div>
									<div class="message">You can now close this window and return to VS Code.</div>
									<div class="message">The authentication process will continue automatically.</div>
									<script>
										// Close the window after 3 seconds
										setTimeout(() => {
											window.close();
										}, 3000);
									</script>
								</body>
								</html>
							`);
						} else {
							// Invalid state or no pending auth
							this._logger.error(`Invalid OAuth callback - code: ${!!code}, state: ${!!state}, pendingAuth: ${!!this._pendingAuth}, nonceMatch: ${this._pendingAuth ? this._pendingAuth.nonce === state : 'N/A'}`);
							res.writeHead(400, { 'Content-Type': 'text/html' });
							res.end(`
								<!DOCTYPE html>
								<html>
								<head>
									<title>Authentication Failed</title>
									<style>
										body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
										.error { color: red; font-size: 24px; }
										.message { margin: 20px 0; }
									</style>
								</head>
								<body>
									<div class="error">❌ Authentication Failed</div>
									<div class="message">Invalid authentication state.</div>
									<div class="message">Please try again.</div>
									<script>
										setTimeout(() => {
											window.close();
										}, 3000);
									</script>
								</body>
								</html>
							`);
						}
					} else {
						res.writeHead(404);
						res.end('Not Found');
					}
				}
			});

			this._oauthServer.listen(this._serverPort, () => {
				this._logger.info(`OAuth server listening on port ${this._serverPort}`);
				this._logger.info(`Redirect URI will be: ${this.getRedirectUri()}`);
				resolve();
			});

			this._oauthServer.on('error', (err) => {
				this._logger.error(`OAuth server error: ${err}`);
				if ((err as any).code === 'EADDRINUSE') {
					// Port is in use, try the next port
					this._serverPort++;
					this._logger.info(`Port in use, trying port ${this._serverPort}`);
					this._oauthServer?.listen(this._serverPort);
				} else {
					reject(err);
				}
			});
		});
	}

	private async stopOAuthServer(): Promise<void> {
		return new Promise((resolve) => {
			// Clean up any pending authentication
			if (this._pendingAuth) {
				this._pendingAuth.reject(new Error('OAuth server stopped'));
				this._pendingAuth = undefined;
			}

			if (this._oauthServer) {
				// Add a timeout to prevent hanging
				const timeout = setTimeout(() => {
					this._logger.warn('OAuth server close timeout, forcing close');
					this._oauthServer = undefined;
					resolve();
				}, 5000); // 5 second timeout

				this._oauthServer.close(() => {
					clearTimeout(timeout);
					this._logger.info('OAuth server stopped');
					this._oauthServer = undefined;
					resolve();
				});

				// Also handle any errors during close
				this._oauthServer.on('error', (err) => {
					clearTimeout(timeout);
					this._logger.warn(`OAuth server close error: ${err}`);
					this._oauthServer = undefined;
					resolve();
				});
			} else {
				resolve();
			}
		});
	}

	private getRedirectUri(): string {
		return `http://localhost:${this._serverPort}/callback`;
	}

	private async waitForOAuthCode(nonce: string, token: vscode.CancellationToken): Promise<string> {
		this._logger.info(`Waiting for OAuth code with nonce: ${nonce}`);
		return new Promise((resolve, reject) => {
			// Store the pending authentication
			this._pendingAuth = { nonce, resolve, reject };
			
			// Add a timeout to help debug if the callback never comes
			const timeout = setTimeout(() => {
				this._logger.error(`OAuth code wait timeout - no callback received within 2 minutes`);
				if (this._pendingAuth) {
					this._pendingAuth.reject(new Error('OAuth timeout - no callback received'));
					this._pendingAuth = undefined;
				}
			}, 120000); // 2 minutes (reduced from 5 minutes)

			// Add polling to check if sessions were created (in case callback failed but auth succeeded)
			const pollInterval = setInterval(async () => {
				try {
					const sessions = await this.readSessions();
					const recentSessions = sessions.filter(session => {
						// Check if this session was created recently (within the last 30 seconds)
						return session.expiresAt && (session.expiresAt - Date.now()) > 0;
					});
					
					if (recentSessions.length > 0) {
						this._logger.info(`Found ${recentSessions.length} recent sessions during polling`);
						// If we found recent sessions, the auth might have succeeded without proper callback
						clearInterval(pollInterval);
						if (this._pendingAuth) {
							this._pendingAuth.reject(new Error('Authentication completed but callback failed - please try again'));
							this._pendingAuth = undefined;
						}
					}
				} catch (error) {
					this._logger.warn(`Error during session polling: ${error}`);
				}
			}, 5000); // Check every 5 seconds

			// Set up cancellation
			const disposable = token.onCancellationRequested(() => {
				this._pendingAuth = undefined;
				clearInterval(pollInterval);
				reject(new Error('Cancelled'));
			});

			// Clean up on completion
			const cleanup = () => {
				clearTimeout(timeout);
				clearInterval(pollInterval);
				disposable.dispose();
			};

			// Override the resolve/reject to include cleanup
			const originalResolve = resolve;
			const originalReject = reject;
			this._pendingAuth.resolve = (code: string) => {
				cleanup();
				originalResolve(code);
			};
			this._pendingAuth.reject = (error: Error) => {
				cleanup();
				originalReject(error);
			};
		});
	}

	private async readSessions(): Promise<SessionData[]> {
		try {
			const stored = await this._keychain.getToken();
			this._logger.info(`Read sessions from storage: ${stored ? 'present' : 'none'}`);
			
			if (stored) {
				const sessions: SessionData[] = JSON.parse(stored);
				this._logger.info(`Parsed ${sessions.length} sessions from storage`);
				
				// Filter out expired sessions
				const validSessions = sessions.filter(session => {
					if (!session.expiresAt) return true;
					const isValid = session.expiresAt > Date.now();
					if (!isValid) {
						this._logger.info(`Session ${session.id} expired at ${new Date(session.expiresAt)}`);
					}
					return isValid;
				});
				
				this._logger.info(`Found ${validSessions.length} valid sessions`);
				
				// If we filtered out expired sessions, update storage
				if (validSessions.length !== sessions.length) {
					this._logger.info(`Updating storage to remove ${sessions.length - validSessions.length} expired sessions`);
					await this.storeSessions(validSessions);
				}
				
				return validSessions;
			}
		} catch (e) {
			this._logger.error(`Error reading sessions: ${e}`);
		}
		return [];
	}

	private async storeSessions(sessions: SessionData[]): Promise<void> {
		try {
			this._logger.info(`Storing ${sessions.length} sessions`);
			const sessionData = JSON.stringify(sessions);
			this._logger.info(`Session data length: ${sessionData.length} characters`);
			await this._keychain.setToken(sessionData);
			this._logger.info('Sessions stored successfully');
		} catch (e) {
			this._logger.error(`Error storing sessions: ${e}`);
		}
	}

	private async checkForUpdates(): Promise<void> {
		const currentSessions = await this.readSessions();
		
		if (!arrayEquals(this._previousSessions, currentSessions)) {
			this._logger.info(`Session change detected: ${this._previousSessions.length} -> ${currentSessions.length} sessions`);
			this._sessionChangeEmitter.fire({
				added: currentSessions.map(s => this.convertToSession(s)),
				removed: [],
				changed: []
			});
			this._previousSessions = [...currentSessions]; // Update the previous sessions
		}
	}

	private convertToSession(session: SessionData): vscode.AuthenticationSession {
		return {
			id: session.id,
			accessToken: session.accessToken,
			account: session.account,
			scopes: session.scopes
		};
	}

	private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<GoogleCloudTokenResponse> {
		this._logger.info('Exchanging authorization code for token');
		const redirectUri = this.getRedirectUri();
		this._logger.info(`Using redirect URI: ${redirectUri}`);
		
		const body = new URLSearchParams([
			['client_id', this._clientId],
			['client_secret', this._clientSecret],
			['code', code],
			['grant_type', 'authorization_code'],
			['redirect_uri', redirectUri],
			['code_verifier', codeVerifier]
		]);

		const response = await fetch(this._tokenUri, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: body.toString()
		});

		if (!response.ok) {
			const errorText = await response.text();
			this._logger.error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
			throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`);
		}

		this._logger.info('Token exchange successful');
		const tokenResponse = await response.json() as GoogleCloudTokenResponse;
		this._logger.info(`Token response - scope: ${tokenResponse.scope}, expires_in: ${tokenResponse.expires_in}`);
		return tokenResponse;
	}

	private async getUserInfo(accessToken: string): Promise<GoogleCloudUserInfo> {
		this._logger.info('Getting user info from Google');
		this._logger.info(`User info URI: ${this._userInfoUri}`);
		this._logger.info(`Access token length: ${accessToken.length}`);
		
		// Try the userinfo endpoint first
		const response = await fetch(this._userInfoUri, {
			headers: {
				'Authorization': `Bearer ${accessToken}`
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			this._logger.error(`Failed to get user info: ${response.status} ${response.statusText} - ${errorText}`);
			
			// If userinfo fails, try to get user info from the token itself
			this._logger.info('Trying to extract user info from token...');
			throw new Error(`Failed to get user info: ${response.status} ${response.statusText} - ${errorText}`);
		}

		this._logger.info('User info retrieved successfully');
		const userInfo = await response.json() as GoogleCloudUserInfo;
		this._logger.info(`User info: ${userInfo.email} (${userInfo.name})`);
		return userInfo;
	}

	private generateCodeVerifier(): string {
		const array = new Uint8Array(32);
		crypto.getRandomValues(array);
		return this.base64URLEncode(array);
	}

	private async generateCodeChallenge(codeVerifier: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(codeVerifier);
		const digest = await crypto.subtle.digest('SHA-256', data);
		return this.base64URLEncode(new Uint8Array(digest));
	}

	private base64URLEncode(buffer: Uint8Array): string {
		return btoa(String.fromCharCode(...buffer))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	}

	// Public method to get current project information
	async getCurrentProject(): Promise<{ projectId: string; region: string } | undefined> {
		const projectId = vscode.workspace.getConfiguration('google-cloud').get('projectId', '');
		const region = vscode.workspace.getConfiguration('google-cloud').get('region', 'us-central1');
		
		if (projectId) {
			return { projectId, region };
		}
		
		return undefined;
	}

	// Public method to get access token for API calls
	async getAccessToken(): Promise<string | undefined> {
		this._logger.info('Getting access token...');
		const sessions = await this.getSessions(undefined);
		this._logger.info(`Found ${sessions.length} sessions for access token`);
		
		if (sessions.length > 0) {
			this._logger.info('Returning access token from first session');
			return sessions[0].accessToken;
		}
		
		this._logger.info('No sessions found, returning undefined');
		return undefined;
	}

	// Public method to force stop OAuth process
	async forceStopOAuth(): Promise<void> {
		this._logger.info('Force stopping OAuth process...');
		
		// Clear any pending authentication
		if (this._pendingAuth) {
			this._pendingAuth.reject(new Error('OAuth process force stopped'));
			this._pendingAuth = undefined;
		}
		
		// Stop the OAuth server
		await this.stopOAuthServer();
		
		this._logger.info('OAuth process force stopped');
	}

	// Initialize previous sessions from storage
	private async initializePreviousSessions(): Promise<void> {
		try {
			this._previousSessions = await this.readSessions();
			this._logger.info(`Initialized with ${this._previousSessions.length} previous sessions`);
		} catch (error) {
			this._logger.error(`Failed to initialize previous sessions: ${error}`);
			this._previousSessions = [];
		}
	}
}

// Simple UriEventHandler for potential future use
export class UriEventHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
	public handleUri(uri: vscode.Uri) {
		this.fire(uri);
	}
} 