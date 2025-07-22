/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class Log {
	constructor(private readonly prefix: string) { }

	info(message: string): void {
		console.log(`[${this.prefix}] ${message}`);
	}

	error(message: string): void {
		console.error(`[${this.prefix}] ${message}`);
	}

	warn(message: string): void {
		console.warn(`[${this.prefix}] ${message}`);
	}

	debug(message: string): void {
		console.debug(`[${this.prefix}] ${message}`);
	}

	trace(message: string): void {
		console.trace(`[${this.prefix}] ${message}`);
	}
} 