# BigQuery Data Assistant - Chat Participant

## Overview

The BigQuery Data Assistant is an AI-powered chat interface that helps you understand and analyze your BigQuery data. It provides intelligent insights, generates sample queries, and helps with data quality assessments.

## Features

### 🤖 AI-Powered Data Analysis
- **Schema Analysis**: Get detailed information about table structure and columns
- **Data Quality Assessment**: Identify potential data quality issues and get suggestions
- **Query Generation**: Generate sample SQL queries based on your table schema
- **Common Values Analysis**: Get suggestions for finding patterns in your data
- **Table Explanation**: Understand the purpose and structure of your tables

### 💬 Interactive Chat Interface
- **Real-time Chat**: Ask questions about your BigQuery data in natural language
- **Quick Suggestions**: Click on predefined suggestions to get instant insights
- **Context-Aware**: The assistant understands your current table context
- **Copy Responses**: Easily copy generated queries and responses to clipboard

### 🔄 Multiple Access Methods
- **From Table View**: Switch to chat mode when viewing a BigQuery table
- **Standalone Chat**: Open the chat assistant directly from the BigQuery explorer
- **Command Palette**: Use "BigQuery: Open BigQuery Data Assistant" command

## How to Use

### 1. From BigQuery Table
1. Open a BigQuery table in VS Code
2. Click the "🤖 Chat" button in the view toggle
3. Start asking questions about your data

### 2. Standalone Chat
1. Open the BigQuery explorer (View → BigQuery)
2. Click the "🤖" button in the explorer toolbar
3. Or use Command Palette: `BigQuery: Open BigQuery Data Assistant`

### 3. Sample Questions You Can Ask

#### Schema Analysis
- "Show me the schema of this table"
- "What columns are in this table?"
- "Explain the table structure"

#### Data Analysis
- "What are the most common values?"
- "Show me data distribution"
- "Find outliers in the data"

#### Data Quality
- "Find potential data quality issues"
- "Check for missing values"
- "Identify duplicate records"

#### Query Generation
- "Generate a sample query"
- "Write a query to analyze trends"
- "Create a query for data validation"

#### General Questions
- "What can I do with this data?"
- "Suggest analysis approaches"
- "Help me understand this table"

## Technical Details

### Architecture
- **Frontend**: Angular-based webview with modern chat UI
- **Backend**: VS Code extension with rule-based AI response system
- **Integration**: Seamless integration with BigQuery explorer and table views

### Response Types
The assistant can generate:
- **Markdown-formatted responses** with syntax highlighting
- **SQL code blocks** for sample queries
- **Structured data analysis** suggestions
- **Data quality assessment** reports

### Context Awareness
- Automatically detects table metadata when available
- Provides table-specific suggestions and queries
- Maintains conversation context within each session

## Configuration

No additional configuration is required. The chat assistant works with your existing BigQuery project configuration.

## Troubleshooting

### Chat Not Responding
1. Ensure you're signed in to Google Cloud
2. Check that your BigQuery projects are configured
3. Verify the extension is properly activated

### No Table Context
- Make sure you have a BigQuery table open for table-specific responses
- The assistant can still provide general BigQuery guidance without table context

### Build Issues
- Ensure both webview and extension are built: `npm run build` in both directories
- Check that all Angular dependencies are installed

## Future Enhancements

- Integration with external AI services for more advanced responses
- Query execution and result visualization
- Data profiling and statistical analysis
- Custom query templates and saved conversations
- Multi-language support for international users

## Contributing

The chat participant feature is built with extensibility in mind. New response types and AI capabilities can be easily added to the `generateAIResponse` function in `extension.ts`. 