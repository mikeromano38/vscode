// Built by Google
import { Injectable } from '@angular/core';

export interface ChatResponse {
  response: string;
  error?: string;
  suggestions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  
  private tableMetadata: any = null;
  private conversationHistory: Array<{role: string, content: string}> = [];

  setTableMetadata(metadata: any) {
    this.tableMetadata = metadata;
    this.conversationHistory = [];
  }

  async processMessage(message: string): Promise<ChatResponse> {
    try {
      // Add user message to history
      this.conversationHistory.push({ role: 'user', content: message });

      // Generate AI response based on message content and table metadata
      const response = await this.generateResponse(message);

      // Add AI response to history
      this.conversationHistory.push({ role: 'assistant', content: response });

      return { response };
    } catch (error) {
      console.error('Error processing chat message:', error);
      return { 
        response: 'Sorry, I encountered an error while processing your request.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async generateResponse(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    // Handle different types of requests
    if (lowerMessage.includes('schema') || lowerMessage.includes('structure')) {
      return this.generateSchemaResponse();
    } else if (lowerMessage.includes('common') || lowerMessage.includes('frequent') || lowerMessage.includes('values')) {
      return this.generateCommonValuesResponse();
    } else if (lowerMessage.includes('quality') || lowerMessage.includes('issues') || lowerMessage.includes('problems')) {
      return this.generateDataQualityResponse();
    } else if (lowerMessage.includes('query') || lowerMessage.includes('sql')) {
      return this.generateSampleQueryResponse();
    } else if (lowerMessage.includes('explain') || lowerMessage.includes('describe')) {
      return this.generateExplainResponse();
    } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return this.generateHelpResponse();
    } else {
      return this.generateGeneralResponse(message);
    }
  }

  private generateSchemaResponse(): string {
    if (!this.tableMetadata || !this.tableMetadata.schema) {
      return "I don't have access to the table schema at the moment. Please make sure a BigQuery table is open.";
    }

    const schema = this.tableMetadata.schema;
    let response = `📋 **Table Schema for ${this.tableMetadata.tableReference?.tableId || 'Unknown Table'}**\n\n`;
    
    response += `**Columns:**\n`;
    schema.fields?.forEach((field: any, index: number) => {
      const mode = field.mode || 'NULLABLE';
      const description = field.description ? ` - ${field.description}` : '';
      response += `${index + 1}. **${field.name}** (${field.type}${mode !== 'NULLABLE' ? `, ${mode}` : ''})${description}\n`;
    });

    if (this.tableMetadata.description) {
      response += `\n**Table Description:** ${this.tableMetadata.description}\n`;
    }

    if (this.tableMetadata.numRows) {
      response += `\n**Total Rows:** ${this.tableMetadata.numRows.toLocaleString()}\n`;
    }

    if (this.tableMetadata.numBytes) {
      const sizeMB = (this.tableMetadata.numBytes / (1024 * 1024)).toFixed(2);
      response += `**Size:** ${sizeMB} MB\n`;
    }

    return response;
  }

  private generateCommonValuesResponse(): string {
    if (!this.tableMetadata) {
      return "I don't have access to the table data at the moment. Please make sure a BigQuery table is open.";
    }

    let response = `📊 **Data Analysis for ${this.tableMetadata.tableReference?.tableId || 'Unknown Table'}**\n\n`;
    
    if (this.tableMetadata.schema?.fields) {
      response += `**Column Analysis:**\n`;
      this.tableMetadata.schema.fields.forEach((field: any) => {
        response += `• **${field.name}**: ${field.type} field`;
        if (field.mode && field.mode !== 'NULLABLE') {
          response += ` (${field.mode})`;
        }
        response += `\n`;
      });
    }

    response += `\n💡 **Suggestions for finding common values:**\n`;
    response += `• Use \`SELECT column_name, COUNT(*) as count FROM table GROUP BY column_name ORDER BY count DESC LIMIT 10\`\n`;
    response += `• For date columns, consider grouping by date parts (YEAR, MONTH, etc.)\n`;
    response += `• For numeric columns, consider creating histogram buckets\n`;

    return response;
  }

  private generateDataQualityResponse(): string {
    if (!this.tableMetadata) {
      return "I don't have access to the table data at the moment. Please make sure a BigQuery table is open.";
    }

    let response = `🔍 **Data Quality Assessment for ${this.tableMetadata.tableReference?.tableId || 'Unknown Table'}**\n\n`;
    
    response += `**Potential Quality Checks:**\n`;
    response += `1. **Null Values**: Check for unexpected NULL values in required fields\n`;
    response += `2. **Data Types**: Verify data types match expected formats\n`;
    response += `3. **Duplicates**: Look for duplicate records\n`;
    response += `4. **Outliers**: Identify unusual values in numeric columns\n`;
    response += `5. **Consistency**: Check for inconsistent formatting\n\n`;

    response += `**Sample Quality Queries:**\n`;
    response += `\`\`\`sql
-- Check for NULL values
SELECT column_name, COUNT(*) as null_count 
FROM table 
WHERE column_name IS NULL 
GROUP BY column_name;

-- Check for duplicates
SELECT column1, column2, COUNT(*) as duplicate_count
FROM table 
GROUP BY column1, column2 
HAVING COUNT(*) > 1;

-- Check for outliers (example for numeric column)
SELECT column_name, 
       AVG(column_name) as avg_value,
       STDDEV(column_name) as std_dev
FROM table 
WHERE column_name IS NOT NULL;
\`\`\``;

    return response;
  }

  private generateSampleQueryResponse(): string {
    if (!this.tableMetadata || !this.tableMetadata.schema) {
      return "I don't have access to the table schema at the moment. Please make sure a BigQuery table is open.";
    }

    const tableName = this.tableMetadata.tableReference?.tableId || 'your_table';
    const schema = this.tableMetadata.schema;
    
    let response = `💡 **Sample Queries for ${tableName}**\n\n`;

    // Generate sample queries based on schema
    if (schema.fields && schema.fields.length > 0) {
      const stringFields = schema.fields.filter((f: any) => f.type === 'STRING');
      const numericFields = schema.fields.filter((f: any) => ['INTEGER', 'FLOAT', 'NUMERIC'].includes(f.type));
      const dateFields = schema.fields.filter((f: any) => ['DATE', 'DATETIME', 'TIMESTAMP'].includes(f.type));

      response += `**1. Basic SELECT Query:**\n`;
      response += `\`\`\`sql
SELECT * 
FROM \`${tableName}\` 
LIMIT 100;
\`\`\`\n`;

      if (stringFields.length > 0) {
        response += `**2. String Column Analysis:**\n`;
        response += `\`\`\`sql
SELECT ${stringFields[0].name}, COUNT(*) as count
FROM \`${tableName}\`
GROUP BY ${stringFields[0].name}
ORDER BY count DESC
LIMIT 10;
\`\`\`\n`;
      }

      if (numericFields.length > 0) {
        response += `**3. Numeric Column Statistics:**\n`;
        response += `\`\`\`sql
SELECT 
  AVG(${numericFields[0].name}) as avg_value,
  MIN(${numericFields[0].name}) as min_value,
  MAX(${numericFields[0].name}) as max_value,
  COUNT(*) as total_rows
FROM \`${tableName}\`
WHERE ${numericFields[0].name} IS NOT NULL;
\`\`\`\n`;
      }

      if (dateFields.length > 0) {
        response += `**4. Date Column Analysis:**\n`;
        response += `\`\`\`sql
SELECT 
  DATE(${dateFields[0].name}) as date_only,
  COUNT(*) as daily_count
FROM \`${tableName}\`
WHERE ${dateFields[0].name} IS NOT NULL
GROUP BY DATE(${dateFields[0].name})
ORDER BY date_only DESC
LIMIT 30;
\`\`\`\n`;
      }
    }

    return response;
  }

  private generateExplainResponse(): string {
    if (!this.tableMetadata) {
      return "I don't have access to the table data at the moment. Please make sure a BigQuery table is open.";
    }

    let response = `📝 **Table Overview: ${this.tableMetadata.tableReference?.tableId || 'Unknown Table'}**\n\n`;
    
    if (this.tableMetadata.description) {
      response += `**Description:** ${this.tableMetadata.description}\n\n`;
    }

    if (this.tableMetadata.schema?.fields) {
      response += `**Structure:** This table contains ${this.tableMetadata.schema.fields.length} columns:\n`;
      this.tableMetadata.schema.fields.forEach((field: any, index: number) => {
        response += `• ${field.name}: ${field.type}${field.mode && field.mode !== 'NULLABLE' ? ` (${field.mode})` : ''}\n`;
      });
    }

    if (this.tableMetadata.numRows) {
      response += `\n**Data Volume:** ${this.tableMetadata.numRows.toLocaleString()} rows\n`;
    }

    if (this.tableMetadata.numBytes) {
      const sizeMB = (this.tableMetadata.numBytes / (1024 * 1024)).toFixed(2);
      response += `**Storage:** ${sizeMB} MB\n`;
    }

    response += `\n**Use Cases:** This table appears to be suitable for:\n`;
    response += `• Data analysis and reporting\n`;
    response += `• Business intelligence queries\n`;
    response += `• Data quality assessments\n`;
    response += `• Performance monitoring\n`;

    return response;
  }

  private generateHelpResponse(): string {
    let response = `🤖 **BigQuery Data Assistant Help**\n\n`;
    response += `I can help you with:\n\n`;
    response += `📋 **Schema Analysis**\n`;
    response += `• "Show me the schema of this table"\n`;
    response += `• "What columns are in this table?"\n\n`;
    
    response += `📊 **Data Analysis**\n`;
    response += `• "What are the most common values?"\n`;
    response += `• "Show me data distribution"\n`;
    response += `• "Find outliers in the data"\n\n`;
    
    response += `🔍 **Data Quality**\n`;
    response += `• "Find potential data quality issues"\n`;
    response += `• "Check for missing values"\n`;
    response += `• "Identify duplicate records"\n\n`;
    
    response += `💡 **Query Generation**\n`;
    response += `• "Generate a sample query"\n`;
    response += `• "Write a query to analyze trends"\n`;
    response += `• "Create a query for data validation"\n\n`;
    
    response += `📝 **General Questions**\n`;
    response += `• "Explain this table structure"\n`;
    response += `• "What can I do with this data?"\n`;
    response += `• "Suggest analysis approaches"\n\n`;
    
    response += `Just ask me anything about your BigQuery data!`;
    return response;
  }

  private generateGeneralResponse(message: string): string {
    let response = `I understand you're asking about "${message}". Let me help you with that!\n\n`;
    response += `Since I don't have specific context about your question, here are some ways I can help:\n\n`;
    response += `• Ask me about the **schema** of your table\n`;
    response += `• Request **sample queries** for analysis\n`;
    response += `• Ask me to **explain the table structure**\n`;
    response += `• Request help with **data quality checks**\n`;
    response += `• Ask for **common value analysis**\n\n`;
    response += `What specific aspect of your BigQuery data would you like to explore?`;
    return response;
  }
} 