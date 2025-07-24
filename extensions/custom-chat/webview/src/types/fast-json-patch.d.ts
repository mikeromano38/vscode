declare module 'fast-json-patch/index.mjs' {
  export interface Operation {
    op: string;
    path: string;
    value?: any;
    from?: string;
  }
  
  export function applyPatch(document: any, patch: Operation[]): any;
  export function createPatch(document: any, newDocument: any): Operation[];
  export function validatePatch(patch: Operation[]): any;
} 