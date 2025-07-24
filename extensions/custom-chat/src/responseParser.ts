import { 
  StreamResponse, 
  SystemMessage, 
  TextResponse, 
  SchemaResponse, 
  DataResponse, 
  ChartResponse, 
  ErrorResponse,
  ParsedStreamResponse,
  MessageContentType,
  DataSource,
  SchemaField
} from './types/responseTypes';

export class ResponseParser {
  private buffer = '';

  /**
   * Parse a line from the streaming response
   * Based on the Python implementation but converted to TypeScript
   */
  parseStreamLine(line: string): ParsedStreamResponse | null {
    console.log('=== Parsing stream line ===');
    console.log('Line:', line);
    console.log('Current buffer:', this.buffer);
    
    if (!line) {
      console.log('Empty line, returning null');
      return null;
    }

    // Handle the streaming JSON format
    if (line === '[{') {
      console.log('Starting new JSON object');
      this.buffer = '{';
      return null;
    } else if (line === '}]') {
      console.log('Ending JSON object');
      this.buffer += '}';
    } else if (line === ',') {
      console.log('Comma separator, continuing');
      return null;
    } else {
      console.log('Adding line to buffer');
      this.buffer += line;
    }

    console.log('Buffer after processing:', this.buffer);

    // Check if we have valid JSON
    if (!this.isValidJson(this.buffer)) {
      console.log('Buffer is not valid JSON yet');
      return null;
    }

    try {
      console.log('Parsing JSON from buffer');
      const data = JSON.parse(this.buffer);
      console.log('Parsed data:', JSON.stringify(data, null, 2));
      this.buffer = ''; // Reset buffer after successful parse
      const result = this.parseResponse(data);
      console.log('Parse result:', result);
      return result;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return null;
    }
  }

  private isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  public parseResponse(data: any): ParsedStreamResponse | null {
    console.log('=== Parsing response ===');
    console.log('Data keys:', Object.keys(data));
    
    // Check for error first
    if (data.error) {
      console.log('Found error in response');
      return {
        type: 'error',
        data: this.handleError(data.error),
        rawResponse: data
      };
    }

    // Check for system message
    if (data.systemMessage) {
      console.log('Found system message in response');
      return this.handleSystemMessage(data.systemMessage);
    }

    // If we can't parse it, return as raw JSON
    console.log('No recognized response type, returning as code');
    return {
      type: 'code',
      data: {
        language: 'json',
        code: JSON.stringify(data, null, 2)
      },
      rawResponse: data
    };
  }

  private handleSystemMessage(systemMessage: SystemMessage): ParsedStreamResponse | null {
    console.log('=== Handling system message ===');
    console.log('System message keys:', Object.keys(systemMessage));
    
    if (systemMessage.text) {
      console.log('Found text response');
      return {
        type: 'text',
        data: this.handleTextResponse(systemMessage.text),
        rawResponse: systemMessage
      };
    } else if (systemMessage.schema) {
      console.log('Found schema response');
      return {
        type: 'schema',
        data: this.handleSchemaResponse(systemMessage.schema),
        rawResponse: systemMessage
      };
    } else if (systemMessage.data) {
      console.log('Found data response');
      return {
        type: 'data',
        data: this.handleDataResponse(systemMessage.data),
        rawResponse: systemMessage
      };
    } else if (systemMessage.chart) {
      console.log('Found chart response');
      return {
        type: 'chart',
        data: this.handleChartResponse(systemMessage.chart),
        rawResponse: systemMessage
      };
    }

    console.log('No recognized system message type');
    return null;
  }

  private handleTextResponse(textResponse: TextResponse): any {
    return {
      content: textResponse.parts.join('')
    };
  }

  private handleSchemaResponse(schemaResponse: SchemaResponse): any {
    const result: any = {};

    if (schemaResponse.query) {
      result.question = schemaResponse.query.question;
    }

    if (schemaResponse.result) {
      result.datasources = schemaResponse.result.datasources.map(datasource => ({
        name: this.formatDataSourceName(datasource),
        schema: datasource.schema ? this.formatSchema(datasource.schema) : null
      }));
    }

    return result;
  }

  private handleDataResponse(dataResponse: DataResponse): any {
    const result: any = {};

    if (dataResponse.query) {
      result.query = {
        name: dataResponse.query.name,
        question: dataResponse.query.question,
        datasources: dataResponse.query.datasources.map(ds => ({
          name: this.formatDataSourceName(ds)
        }))
      };
    }

    if (dataResponse.generatedSql) {
      result.generatedSql = dataResponse.generatedSql;
    }

    if (dataResponse.result) {
      result.data = this.formatDataTable(dataResponse.result);
    }

    return result;
  }

  private handleChartResponse(chartResponse: ChartResponse): any {
    const result: any = {};

    if (chartResponse.query) {
      result.instructions = chartResponse.query.instructions;
    }

    if (chartResponse.result) {
      result.vegaConfig = chartResponse.result.vegaConfig;
    }

    return result;
  }

  private handleError(error: ErrorResponse): any {
    return {
      code: error.code,
      message: error.message
    };
  }

  private formatDataSourceName(datasource: DataSource): string {
    if (datasource.studioDatasourceId) {
      return datasource.studioDatasourceId;
    } else if (datasource.lookerExploreReference) {
      const ref = datasource.lookerExploreReference;
      return `lookmlModel: ${ref.lookmlModel}, explore: ${ref.explore}, lookerInstanceUri: ${ref.lookerInstanceUri}`;
    } else if (datasource.bigqueryTableReference) {
      const ref = datasource.bigqueryTableReference;
      return `${ref.projectId}.${ref.datasetId}.${ref.tableId}`;
    }
    return 'Unknown data source';
  }

  private formatSchema(schema: any): any {
    return {
      fields: schema.fields.map((field: SchemaField) => ({
        name: field.name || '',
        type: field.type || '',
        description: field.description || '-',
        mode: field.mode || ''
      }))
    };
  }

  private formatDataTable(result: any): any {
    if (!result.schema || !result.data) {
      return { error: 'No data available' };
    }

    const fields = result.schema.fields.map((field: SchemaField) => field.name);
    
    if (fields.length === 0) {
      return { error: 'No columns available' };
    }

    return {
      columns: fields,
      rows: result.data.map((row: any) => 
        fields.map((fieldName: string) => row[fieldName] || '')
      )
    };
  }
} 