/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export type PromiseAdapter<T, U> = (value: T, resolve: (value: U | PromiseLike<U>) => void, reject: (reason: any) => void) => void;

export function arrayEquals<T>(a: T[], b: T[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

export function promiseFromEvent<T, U>(
	event: vscode.Event<T>,
	adapter: PromiseAdapter<T, U>
): { promise: Promise<U>; cancel: vscode.EventEmitter<void> } {
	let subscription: vscode.Disposable;
	const cancel = new vscode.EventEmitter<void>();
	const promise = new Promise<U>((resolve, reject) => {
		cancel.event(() => {
			subscription.dispose();
			reject(new Error('Cancelled'));
		});
		subscription = event((value: T) => {
			try {
				adapter(value, resolve, reject);
			} catch (error) {
				reject(error);
			}
		});
	}).finally(() => {
		subscription.dispose();
	});
	return { promise, cancel };
} 