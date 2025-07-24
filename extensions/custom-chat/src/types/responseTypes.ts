// TypeScript interfaces for streaming response types
// Converted from Python snake_case to camelCase

export interface StreamResponse {
  systemMessage?: SystemMessage;
  error?: ErrorResponse;
}

export interface SystemMessage {
  text?: TextResponse;
  schema?: SchemaResponse;
  data?: DataResponse;
  chart?: ChartResponse;
}

export interface TextResponse {
  parts: string[];
}

export interface SchemaField {
  name: string;
  type: string;
  description?: string;
  mode?: string;
}

export interface SchemaResult {
  fields: SchemaField[];
}

export interface BigQueryTableReference {
  projectId: string;
  datasetId: string;
  tableId: string;
}

export interface BigQueryJob {
  id: string;
  destinationTable?: {
    projectId: string;
    datasetId: string;
    tableId: string;
  };
}

export interface LookerExploreReference {
  lookmlModel: string;
  explore: string;
  lookerInstanceUri: string;
}

export interface DataSource {
  studioDatasourceId?: string;
  lookerExploreReference?: LookerExploreReference;
  bigqueryTableReference?: BigQueryTableReference;
  schema?: SchemaResult;
}

export interface SchemaResponse {
  query?: {
    question: string;
  };
  result?: {
    datasources: DataSource[];
  };
}

export interface DataResponse {
  query?: {
    name: string;
    question: string;
    datasources: DataSource[];
  };
  generatedSql?: string;
  bigQueryJob?: BigQueryJob;
  result?: {
    schema: SchemaResult;
    data: Record<string, any>[];
  };
}

export interface ChartResponse {
  query?: {
    instructions: string;
  };
  result?: {
    vegaConfig: any;
  };
}

export interface ErrorResponse {
  code: string;
  message: string;
}

// Message content types for the UI
export type MessageContentType = 'text' | 'schema' | 'data' | 'chart' | 'error' | 'code' | 'markdown';

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