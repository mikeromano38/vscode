# Conversational Analytics API Backend

This extension now includes a new backend implementation that uses Google's Conversational Analytics API to provide intelligent data analysis capabilities directly within VS Code.

## Features

- **Streaming Responses**: Real-time streaming of analysis results
- **BigQuery Integration**: Direct access to BigQuery datasets
- **Python Analysis**: Optional Python-based advanced analysis
- **Rich Output**: Formatted tables, SQL queries, and chart configurations
- **Google Cloud Authentication**: Seamless integration with Google Cloud credentials

## Setup

### 1. Google Cloud Authentication

First, ensure you're signed in to Google Cloud in VS Code:

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run "Developer: Reload Window" to ensure the extension is loaded
3. The extension will automatically prompt for Google Cloud authentication when needed

### 2. Configure Google Cloud Project

You need to set your Google Cloud project ID. The extension uses the same project configuration as the Google Cloud Authentication extension:

1. Open the Command Palette
2. Run "Custom Chat: Configure Google Cloud Project"
3. Enter your project ID (e.g., `my-project-123456`)

Alternatively, you can configure it in VS Code settings:

```json
{
    "google-cloud.projectId": "your-project-id"
}
```

### 3. Data Sources Configuration

By default, the extension uses a sample BigQuery dataset. You can configure custom data sources in settings:

```json
{
    "customChat.dataSources": {
        "bq": {
            "tableReferences": [
                {
                    "projectId": "your-project",
                    "datasetId": "your-dataset",
                    "tableId": "your-table"
                }
            ]
        }
    }
}
```

## Usage

### Basic Usage

1. Open the Chat panel in VS Code (Custom Chat view)
2. Ask questions about your data, for example:
   - "Show me the top 10 records from the street trees dataset"
   - "Create a bar chart of tree species by count"
   - "What's the average tree height by species?"

### Advanced Analysis

Enable Python analysis for more advanced capabilities:

```json
{
    "customChat.enablePythonAnalysis": true
}
```

This allows the API to use Python for complex data transformations and analysis.

## API Response Types

The extension handles several types of responses from the Conversational Analytics API:

### Text Responses
Simple text explanations and analysis results.

### Schema Responses
Information about data source schemas, including:
- Column names and types
- Field descriptions
- Data source references

### Data Responses
Query results including:
- Generated SQL queries
- Retrieved data in table format
- Data source information

### Chart Responses
Visualization configurations:
- Vega-Lite chart specifications
- Chart instructions
- Interactive chart data

## Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `google-cloud.projectId` | string | `""` | Google Cloud project ID (shared with Google Cloud Authentication extension) |
| `customChat.enablePythonAnalysis` | boolean | `true` | Enable Python analysis capabilities |
| `customChat.dataSources` | object | `{}` | Custom data sources configuration |

## Commands

- **Custom Chat: Configure Google Cloud Project** - Set up your Google Cloud project
- **Custom Chat: Refresh Token** - Refresh your Google Cloud authentication
- **Custom Chat: Get More Suggestions** - Request additional analysis suggestions

## Error Handling

The extension provides clear error messages for common issues:

- **Authentication Errors**: When Google Cloud credentials are missing or invalid
- **Configuration Errors**: When billing project is not configured
- **API Errors**: When the Conversational Analytics API returns errors
- **Network Errors**: When there are connectivity issues

## Example Queries

Here are some example queries you can try:

### Data Exploration
```
"Show me the first 5 rows of the street trees dataset"
"What columns are available in the dataset?"
"Give me a summary of the data"
```

### Analysis
```
"What's the distribution of tree species?"
"Which species has the most trees?"
"Create a histogram of tree heights"
```

### Visualizations
```
"Make a bar chart of tree species by count"
"Create a scatter plot of tree height vs diameter"
"Show me a pie chart of tree conditions"
```

## Troubleshooting

### Authentication Issues
- Ensure you're signed in to Google Cloud in VS Code
- Check that your account has the necessary permissions
- Try refreshing your authentication token

### Configuration Issues
- Verify your Google Cloud project ID is correct
- Ensure the project has the Conversational Analytics API enabled
- Check that you have billing enabled on the project

### API Errors
- Verify your data sources are accessible
- Check that the datasets exist and are public (for public datasets)
- Ensure you have the necessary permissions to access the data

## Development

The implementation includes:

- **TypeScript Interfaces**: Full type safety for API requests and responses
- **Streaming Support**: Real-time processing of server-sent events
- **Error Handling**: Comprehensive error handling and user feedback
- **Configuration Management**: Flexible configuration system
- **Markdown Output**: Rich formatting for analysis results

## API Reference

The extension uses the Conversational Analytics API v1alpha:

- **Base URL**: `https://geminidataanalytics.googleapis.com/v1alpha`
- **Authentication**: Bearer token from Google Cloud
- **Response Format**: Server-sent events (SSE)
- **Data Sources**: BigQuery, Looker, and custom data sources

For more information about the API, see the [Google Cloud documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/data-analytics). 