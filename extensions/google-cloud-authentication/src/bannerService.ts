/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { GoogleCloudAuthenticationProvider } from './googleCloud';

export class GoogleCloudBannerService implements vscode.Disposable {
	private readonly _disposable: vscode.Disposable;
	private _currentBannerId: string | undefined;

	constructor(
		_context: vscode.ExtensionContext,
		private readonly authProvider: GoogleCloudAuthenticationProvider
	) {
		this._disposable = vscode.Disposable.from(
			// Listen for authentication changes
			this.authProvider.onDidChangeSessions(() => {
				this.updateBannerVisibility();
			})
		);
	}

	dispose() {
		this._disposable.dispose();
		this.hideCurrentBanner();
	}

	async showAuthenticationBanner(): Promise<void> {
		// Hide any existing banner first
		this.hideCurrentBanner();

		// Check if we already have a valid session
		const sessions = await this.authProvider.getSessions(['https://www.googleapis.com/auth/cloud-platform']);
		if (sessions.length > 0) {
			return; // Already authenticated
		}

		// Show the authentication banner
		this._currentBannerId = 'google-cloud-auth-banner';
		
		// Use notifications since banner service is not directly accessible
		const result = await vscode.window.showInformationMessage(
			'Sign in to Google Cloud to access GCP services and manage your projects.',
			'Sign In',
			'Learn More',
			'Not Now'
		);

		if (result === 'Sign In') {
			vscode.commands.executeCommand('google-cloud.authenticate');
		} else if (result === 'Learn More') {
			vscode.env.openExternal(vscode.Uri.parse('https://cloud.google.com/docs/authentication'));
		}
	}

	// Project selection is now handled through settings, not banners

	private async updateBannerVisibility(): Promise<void> {
		const sessions = await this.authProvider.getSessions(['https://www.googleapis.com/auth/cloud-platform']);
		
		if (sessions.length === 0) {
			// No sessions, show authentication banner
			await this.showAuthenticationBanner();
		} else {
			// Has sessions, hide any banners (project selection is handled through settings)
			this.hideCurrentBanner();
		}
	}

	private hideCurrentBanner(): void {
		if (this._currentBannerId) {
			// Since we can't access the banner service directly, we just clear the ID
			this._currentBannerId = undefined;
		}
	}
} 