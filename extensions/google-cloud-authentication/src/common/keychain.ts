/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export class Keychain {
	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly serviceId: string
	) { }

	async getToken(): Promise<string | undefined> {
		try {
			return await this.context.secrets.get(this.serviceId);
		} catch (e) {
			// Ignore errors
			return undefined;
		}
	}

	async setToken(token: string): Promise<void> {
		try {
			await this.context.secrets.store(this.serviceId, token);
		} catch (e) {
			// Ignore errors
		}
	}

	async deleteToken(): Promise<void> {
		try {
			await this.context.secrets.delete(this.serviceId);
		} catch (e) {
			// Ignore errors
		}
	}
} 