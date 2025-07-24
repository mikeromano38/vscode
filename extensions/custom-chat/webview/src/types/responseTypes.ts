// Message content types for the UI
export type MessageContentType = 'text' | 'schema' | 'data' | 'chart' | 'visualization' | 'error' | 'code' | 'markdown';

export interface MessageContent {
  type: MessageContentType;
  data: any;
  timestamp: Date;
}

export interface ParsedStreamResponse {
  type: MessageContentType;
  data: any;
  rawResponse: any;
} 