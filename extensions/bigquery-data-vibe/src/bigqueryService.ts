import * as vscode from 'vscode';

export interface BigQueryDataset {
  datasetId: string;
  friendlyName?: string;
  description?: string;
  location?: string;
}

export interface BigQueryTable {
  tableId: string;
  friendlyName?: string;
  description?: string;
  type: 'TABLE' | 'VIEW';
  creationTime?: string;
  lastModifiedTime?: string;
}

export interface BigQueryView {
  tableId: string;
  friendlyName?: string;
  description?: string;
  view?: {
    query: string;
    useLegacySql: boolean;
  };
}

export interface BigQueryTableMetadata {
  tableId: string;
  friendlyName?: string;
  description?: string;
  type: 'TABLE' | 'VIEW';
  creationTime?: string;
  lastModifiedTime?: string;
  expirationTime?: string;
  location?: string;
  defaultCollation?: string;
  defaultRoundingMode?: string;
  caseInsensitive?: boolean;
  labels?: { [key: string]: string };
  primaryKeys?: string[];
  schema?: any;
  numBytes?: string;
  numLongTermBytes?: string;
  numRows?: string;
  timePartitioning?: any;
  clustering?: any;
  encryptionConfiguration?: any;
  projectId?: string;
  datasetId?: string;
}

export class BigQueryService {
  private accessToken: string | null = null;

  constructor() {}

  async authenticate(): Promise<boolean> {
    try {
      // Try to get existing session first - don't create a new one
      // Request BigQuery-specific scopes to ensure we have the right permissions
      const session = await vscode.authentication.getSession('google-cloud', [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/bigquery.readonly'
      ], { createIfNone: false });
      
      if (session) {
        this.accessToken = session.accessToken;
        console.log('Using existing Google Cloud session with BigQuery access');
        console.log('Session scopes:', session.scopes);
        return true;
      }
      
      console.log('No existing Google Cloud session found');
      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  private async makeRequest(url: string): Promise<any> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Authentication failed');
      }
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`BigQuery API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async listDatasets(projectId: string): Promise<BigQueryDataset[]> {
    try {
      const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets`;
      const response = await this.makeRequest(url);
      
      return response.datasets?.map((dataset: any) => ({
        datasetId: dataset.datasetReference.datasetId,
        friendlyName: dataset.friendlyName,
        description: dataset.description,
        location: dataset.location
      })) || [];
    } catch (error) {
      console.error('Error listing datasets:', error);
      throw error;
    }
  }

  async listTables(projectId: string, datasetId: string): Promise<BigQueryTable[]> {
    try {
      const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${datasetId}/tables`;
      const response = await this.makeRequest(url);
      
      return response.tables?.filter((table: any) => table.type === 'TABLE').map((table: any) => ({
        tableId: table.tableReference.tableId,
        friendlyName: table.friendlyName,
        description: table.description,
        type: table.type as 'TABLE',
        creationTime: table.creationTime,
        lastModifiedTime: table.lastModifiedTime
      })) || [];
    } catch (error) {
      console.error('Error listing tables:', error);
      throw error;
    }
  }

  async listViews(projectId: string, datasetId: string): Promise<BigQueryView[]> {
    try {
      const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${datasetId}/tables`;
      const response = await this.makeRequest(url);
      
      return response.tables?.filter((table: any) => table.type === 'VIEW').map((table: any) => ({
        tableId: table.tableReference.tableId,
        friendlyName: table.friendlyName,
        description: table.description,
        view: table.view ? {
          query: table.view.query,
          useLegacySql: table.view.useLegacySql
        } : undefined
      })) || [];
    } catch (error) {
      console.error('Error listing views:', error);
      throw error;
    }
  }

  async getTableData(projectId: string, datasetId: string, tableId: string, maxResults: number = 1000): Promise<any[]> {
    try {
      const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` LIMIT ${maxResults}`;
      const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          useLegacySql: false
        })
      });

      if (!response.ok) {
        throw new Error(`BigQuery API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.rows || [];
    } catch (error) {
      console.error('Error getting table data:', error);
      throw error;
    }
  }



  async getTableMetadata(projectId: string, datasetId: string, tableId: string): Promise<BigQueryTableMetadata> {
    try {
      const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${datasetId}/tables/${tableId}`;
      const response = await this.makeRequest(url);
      
      return {
        tableId: response.tableReference.tableId,
        friendlyName: response.friendlyName,
        description: response.description,
        type: response.type as 'TABLE' | 'VIEW',
        creationTime: response.creationTime,
        lastModifiedTime: response.lastModifiedTime,
        expirationTime: response.expirationTime,
        location: response.location,
        defaultCollation: response.defaultCollation,
        defaultRoundingMode: response.defaultRoundingMode,
        caseInsensitive: response.caseInsensitive,
        labels: response.labels,
        primaryKeys: response.primaryKeys?.map((pk: any) => pk.columns?.join(', ')).filter(Boolean) || [],
        schema: response.schema,
        numBytes: response.numBytes,
        numLongTermBytes: response.numLongTermBytes,
        numRows: response.numRows,
        timePartitioning: response.timePartitioning,
        clustering: response.clustering,
        encryptionConfiguration: response.encryptionConfiguration,
        projectId: projectId,
        datasetId: datasetId
      };
    } catch (error) {
      console.error('Error getting table metadata:', error);
      throw error;
    }
  }
} 