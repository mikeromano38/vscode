/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nodeCrypto from 'crypto';

export const crypto = {
	getRandomValues: (array: Uint8Array): Uint8Array => {
		return nodeCrypto.randomFillSync(array);
	},

	subtle: {
		digest: async (algorithm: string, data: Uint8Array): Promise<ArrayBuffer> => {
			return new Promise((resolve, reject) => {
				try {
					const hash = nodeCrypto.createHash(algorithm.replace('-', ''));
					hash.update(data);
					const digest = hash.digest();
					// Convert to ArrayBuffer using Uint8Array
					const uint8Array = new Uint8Array(digest);
					resolve(uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength));
				} catch (error) {
					reject(error);
				}
			});
		}
	}
}; 