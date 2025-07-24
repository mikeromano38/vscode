import * as vscode from 'vscode';
import { ResponseParser } from './responseParser';
import { 
    ParsedStreamResponse, 
    TextResponse, 
    SchemaResponse, 
    DataResponse, 
    SchemaResult, 
    SchemaField 
} from './types/responseTypes';

// Legacy interfaces for backward compatibility
interface BigQueryTableReference {
    projectId: string;
    datasetId: string;
    tableId: string;
}

interface BigQueryDataSource {
    tableReferences: BigQueryTableReference[];
}

interface DataSourceReferences {
    bq?: {
        tableReferences: BigQueryTableReference[];
    };
}

interface AnalysisOptions {
    python?: {
        enabled: boolean;
    };
}

interface InlineContext {
    datasourceReferences: DataSourceReferences;
    options?: {
        analysis?: AnalysisOptions;
    };
}

interface UserMessage {
    text: string;
}

interface ChatMessage {
    userMessage: UserMessage;
}

interface ChatPayload {
    parent: string;
    messages: ChatMessage[];
    inlineContext: InlineContext;
}

interface ChartResponse {
    query?: {
        instructions: string;
    };
    result?: {
        vegaConfig: any;
    };
}

interface ErrorResponse {
    code: string;
    message: string;
}

interface SystemMessage {
    text?: TextResponse;
    schema?: SchemaResponse;
    data?: DataResponse;
    chart?: ChartResponse;
}

interface StreamResponse {
    systemMessage?: SystemMessage;
    error?: ErrorResponse;
}

export class ConversationalAnalyticsService {
    private readonly baseUrl = 'https://geminidataanalytics.googleapis.com/v1alpha';
    private readonly location = 'global';
    private readonly responseParser = new ResponseParser();

    constructor(
        private readonly billingProject: string,
        private readonly systemInstruction: string = 'Help the user in analyzing their data'
    ) {}

    async streamChatResponse(
        userMessage: string,
        session: vscode.AuthenticationSession,
        dataSources: DataSourceReferences,
        options?: { analysis?: AnalysisOptions },
        token?: vscode.CancellationToken
    ): Promise<AsyncGenerator<ParsedStreamResponse, void, unknown>> {
        console.log('=== ConversationalAnalyticsService.streamChatResponse ===');
        console.log('User message:', userMessage);
        console.log('Billing project:', this.billingProject);
        console.log('Location:', this.location);
        console.log('Base URL:', this.baseUrl);
        
        const chatUrl = `${this.baseUrl}/projects/${this.billingProject}/locations/${this.location}:chat`;
        console.log('Chat URL:', chatUrl);
        
        const payload: ChatPayload = {
            parent: `projects/${this.billingProject}/locations/${this.location}`,
            messages: [
                {
                    userMessage: {
                        text: userMessage
                    }
                }
            ],
            inlineContext: {
                datasourceReferences: dataSources,
                options: options
            }
        };

        console.log('=== PAYLOAD DETAILS ===');
        console.log('Parent:', payload.parent);
        console.log('Messages count:', payload.messages.length);
        console.log('First message text:', payload.messages[0].userMessage.text);
        console.log('Data sources:', JSON.stringify(dataSources, null, 2));
        console.log('Data sources type:', typeof dataSources);
        console.log('Data sources keys:', Object.keys(dataSources));
        console.log('Data sources bq:', dataSources.bq);
        console.log('Data sources bq type:', typeof dataSources.bq);
        console.log('Data sources bq keys:', dataSources.bq ? Object.keys(dataSources.bq) : 'undefined');
        console.log('Data sources bq tableReferences:', dataSources.bq?.tableReferences);
        console.log('Data sources bq tableReferences length:', dataSources.bq?.tableReferences?.length);
        console.log('Options:', JSON.stringify(options, null, 2));
        console.log('Inline context:', JSON.stringify(payload.inlineContext, null, 2));
        console.log('Full payload:', JSON.stringify(payload, null, 2));
        console.log('=== END PAYLOAD DETAILS ===');
        
        console.log('Access token length:', session.accessToken.length);

        return this.getStream(chatUrl, payload, session.accessToken, token);
    }

    private async *getStream(
        url: string,
        payload: ChatPayload,
        accessToken: string,
        token?: vscode.CancellationToken
    ): AsyncGenerator<ParsedStreamResponse, void, unknown> {
        console.log('=== getStream method ===');
        console.log('URL:', url);
        console.log('Making fetch request...');
        
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };

        console.log('=== REQUEST DETAILS ===');
        console.log('Method: POST');
        console.log('URL:', url);
        console.log('Headers:', JSON.stringify(headers, null, 2));
        console.log('Payload stringified:', JSON.stringify(payload, null, 2));
        console.log('Access Token (first 20 chars):', accessToken.substring(0, 20) + '...');
        console.log('Access Token length:', accessToken.length);
        console.log('=== END REQUEST DETAILS ===');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            if (!response.body) {
                throw new Error('No response body available');
            }

            console.log('Starting to read response stream...');
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let chunkCount = 0;

            try {
                while (true) {
                    if (token?.isCancellationRequested) {
                        console.log('Stream cancelled by token');
                        break;
                    }

                    const { done, value } = await reader.read();
                    
                    if (done) {
                        console.log('Stream reading completed');
                        break;
                    }

                    chunkCount++;
                    console.log(`=== Processing chunk ${chunkCount} ===`);
                    
                    // Decode the chunk
                    const chunk = decoder.decode(value, { stream: true });
                    console.log('=== Raw chunk ===');
                    console.log('Chunk length:', chunk.length);
                    console.log('Chunk content:', JSON.stringify(chunk));
                    console.log('Chunk bytes:', Array.from(value).map(b => b.toString(16).padStart(2, '0')).join(' '));
                    
                    buffer += chunk;
                    console.log('Buffer after adding chunk (length):', buffer.length);
                    console.log('Buffer after adding chunk (content):', JSON.stringify(buffer));

                    // Process complete JSON objects from the buffer
                    const parsedResponses = this.processBuffer(buffer);
                    buffer = parsedResponses.remainingBuffer;
                    
                    // Yield each parsed response immediately
                    for (const response of parsedResponses.responses) {
                        console.log(`Yielding response:`, response.type, response.data);
                        yield response;
                    }
                }
            } finally {
                console.log(`Total chunks processed: ${chunkCount}`);
                reader.releaseLock();
            }
        } catch (error) {
            console.error('=== Stream error ===');
            console.error('Error details:', error);
            throw error;
        }
    }

    private processBuffer(buffer: string): { responses: ParsedStreamResponse[], remainingBuffer: string } {
        console.log('=== Processing buffer ===');
        console.log('Input buffer length:', buffer.length);
        console.log('Input buffer:', JSON.stringify(buffer));
        
        const responses: ParsedStreamResponse[] = [];
        let remainingBuffer = buffer;
        
        // Remove leading whitespace
        remainingBuffer = remainingBuffer.trim();
        console.log('Buffer after trim:', JSON.stringify(remainingBuffer));
        
        // Look for complete JSON objects in the buffer
        // The API sends: [{...},{...},{...}]
        // We want to extract each {...} as it becomes complete
        
        let braceCount = 0;
        let startIndex = -1;
        let processedIndex = 0;
        
        for (let i = 0; i < remainingBuffer.length; i++) {
            const char = remainingBuffer[i];
            
            if (char === '{') {
                if (braceCount === 0) {
                    startIndex = i;
                }
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0 && startIndex !== -1) {
                    // We found a complete JSON object
                    const jsonStr = remainingBuffer.substring(startIndex, i + 1);
                    console.log('Found complete JSON object:', jsonStr);
                    
                    try {
                        const data = JSON.parse(jsonStr);
                        console.log('Parsed JSON object:', JSON.stringify(data, null, 2));
                        
                        const response = this.responseParser.parseResponse(data);
                        console.log('Parsed response:', response);
                        if (response) {
                            responses.push(response);
                            console.log('Added response to array');
                        }
                        
                        // Mark this position as processed
                        processedIndex = i + 1;
                        startIndex = -1; // Reset for next object
                    } catch (error) {
                        console.log('Error parsing JSON object:', error);
                        // Continue looking for more objects
                    }
                }
            }
        }
        
        // Remove processed content from buffer
        if (processedIndex > 0) {
            remainingBuffer = remainingBuffer.substring(processedIndex);
            console.log('Remaining buffer after processing:', JSON.stringify(remainingBuffer));
        }
        
        console.log('Final processed responses count:', responses.length);
        console.log('Final remaining buffer:', JSON.stringify(remainingBuffer));
        
        return { responses, remainingBuffer };
    }





    private handleSystemMessage(systemMessage: SystemMessage): string {
        if (systemMessage.text) {
            return this.handleTextResponse(systemMessage.text);
        } else if (systemMessage.schema) {
            return this.handleSchemaResponse(systemMessage.schema);
        } else if (systemMessage.data) {
            return this.handleDataResponse(systemMessage.data);
        } else if (systemMessage.chart) {
            return this.handleChartResponse(systemMessage.chart);
        }

        return '';
    }

    private handleTextResponse(textResponse: TextResponse): string {
        return textResponse.parts.join('');
    }

    private handleSchemaResponse(schemaResponse: SchemaResponse): string {
        let output = '';

        if (schemaResponse.query) {
            output += `**Question**: ${schemaResponse.query.question}\n\n`;
        }

        if (schemaResponse.result) {
            output += '## Schema Resolved\n\n';
            output += '**Data sources:**\n\n';

            for (const datasource of schemaResponse.result.datasources) {
                const sourceName = this.formatDataSourceName(datasource);
                output += `**${sourceName}**\n\n`;

                if (datasource.schema) {
                    output += this.formatSchema(datasource.schema);
                }
            }
        }

        return output;
    }

    private handleDataResponse(dataResponse: DataResponse): string {
        let output = '';

        if (dataResponse.query) {
            output += '## Retrieval Query\n\n';
            output += `**Query name**: ${dataResponse.query.name}\n`;
            output += `**Question**: ${dataResponse.query.question}\n\n`;
            output += '**Data sources:**\n\n';

            for (const datasource of dataResponse.query.datasources) {
                const sourceName = this.formatDataSourceName(datasource);
                output += `- ${sourceName}\n`;
            }
            output += '\n';
        }

        if (dataResponse.generatedSql) {
            output += '## SQL Generated\n\n';
            output += '```sql\n';
            output += dataResponse.generatedSql;
            output += '\n```\n\n';
        }

        if (dataResponse.result) {
            output += '## Data Retrieved\n\n';
            output += this.formatDataTable(dataResponse.result);
        }

        return output;
    }

    private handleChartResponse(chartResponse: ChartResponse): string {
        let output = '';

        if (chartResponse.query) {
            output += `**Instructions**: ${chartResponse.query.instructions}\n\n`;
        }

        if (chartResponse.result) {
            output += '## Chart Generated\n\n';
            output += '```json\n';
            output += JSON.stringify(chartResponse.result.vegaConfig, null, 2);
            output += '\n```\n\n';
            output += '*Chart visualization would be displayed here in a full implementation.*\n';
        }

        return output;
    }

    private formatError(error: ErrorResponse): string {
        return `## Error\n\n**Code**: ${error.code}\n**Message**: ${error.message}`;
    }

    private formatDataSourceName(datasource: any): string {
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

    private formatSchema(schema: SchemaResult): string {
        let output = '| Column | Type | Description | Mode |\n';
        output += '|--------|------|-------------|------|\n';

        for (const field of schema.fields) {
            const name = field.name || '';
            const type = field.type || '';
            const description = field.description || '-';
            const mode = field.mode || '';
            
            output += `| ${name} | ${type} | ${description} | ${mode} |\n`;
        }

        output += '\n';
        return output;
    }

    private formatDataTable(result: any): string {
        if (!result.schema || !result.data) {
            return 'No data available\n';
        }

        const fields = result.schema.fields.map((field: SchemaField) => field.name);
        
        if (fields.length === 0) {
            return 'No columns available\n';
        }

        let output = '| ' + fields.join(' | ') + ' |\n';
        output += '|' + fields.map(() => '---').join('|') + '|\n';

        for (const row of result.data) {
            const values = fields.map((fieldName: string) => row[fieldName] || '');
            output += '| ' + values.join(' | ') + ' |\n';
        }

        output += '\n';
        return output;
    }
} 