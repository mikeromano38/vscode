# Custom Chat Extension for VS Code

This extension provides a custom chat interface for VS Code that integrates with Google's Conversational Analytics API for intelligent data analysis, with support for custom backend services using Google Cloud authentication.

## Features

- ✅ **Conversational Analytics API**: Intelligent data analysis using Google's Conversational Analytics API
- ✅ **BigQuery Integration**: Direct access to BigQuery datasets for analysis
- ✅ **Streaming Responses**: Real-time streaming of analysis results
- ✅ **Rich Output**: Formatted tables, SQL queries, and chart configurations
- ✅ **Google Cloud Authentication**: Uses existing Google Cloud auth sessions
- ✅ **Python Analysis**: Optional Python-based advanced analysis
- ✅ **Configurable**: Easy to configure data sources and analysis options
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **Interactive Buttons**: Action buttons for additional functionality

## Configuration

### Google Cloud Project

Set your Google Cloud project ID in VS Code settings (shared with Google Cloud Authentication extension):

```json
{
  "google-cloud.projectId": "your-project-id"
}
```

### Python Analysis

Enable or disable Python analysis capabilities:

```json
{
  "customChat.enablePythonAnalysis": true
}
```

### Data Sources

Configure custom BigQuery data sources:

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

## Conversational Analytics API

The extension uses Google's Conversational Analytics API for intelligent data analysis. The API provides:

### Features

- **Natural Language Queries**: Ask questions about your data in plain English
- **SQL Generation**: Automatic SQL query generation for data retrieval
- **Data Visualization**: Chart and graph generation with Vega-Lite specifications
- **Schema Analysis**: Automatic schema discovery and field descriptions
- **Python Integration**: Advanced analysis using Python code

### Example Queries

```
"Show me the top 10 records from the dataset"
"Create a bar chart of species by count"
"What's the average height by species?"
"Generate a scatter plot of height vs diameter"
```

For detailed API documentation, see [CONVERSATIONAL_ANALYTICS.md](./CONVERSATIONAL_ANALYTICS.md).

## Authentication

The extension automatically uses the existing Google Cloud authentication session from VS Code. No additional login is required if you're already signed in to Google Cloud.

## Usage

1. **Start VS Code**: Run `./scripts/code.sh` from the vscode directory
2. **Configure Google Cloud Project**: Run "Custom Chat: Configure Google Cloud Project" from the Command Palette
3. **Open Chat**: Look for the chat interface in VS Code
4. **Start Analyzing**: Ask questions about your data in natural language

## Error Handling

The extension handles various error scenarios:

- **No Google Cloud Session**: Prompts user to sign in
- **Project Not Configured**: Guides user to configure Google Cloud project
- **API Errors**: Clear error messages for API issues
- **Data Source Errors**: Helpful messages for data access problems
- **Network Errors**: Graceful error messages for connectivity issues

## Development

### Building the Extension

```bash
cd extensions/custom-chat
npm run compile
```

### Testing

1. Update the backend URL in VS Code settings
2. Ensure you have a Google Cloud session active
3. Start VS Code and test the chat functionality

## Example Backend Service

Here's a simple example of what your backend service might look like:

```python
from flask import Flask, request, jsonify
from google.auth.transport import requests
from google.oauth2 import id_token
import json

app = Flask(__name__)

@app.route('/chat', methods=['POST'])
def chat():
    # Verify Google Cloud token
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No valid token'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(token, requests.Request())
        
        # Process the chat request
        data = request.json
        user_prompt = data.get('prompt', '')
        
        # Your AI processing logic here
        response = f"Processed: {user_prompt}"
        
        return jsonify({'response': response})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401

if __name__ == '__main__':
    app.run(debug=True)
```

## Troubleshooting

### Common Issues

1. **"No Google Cloud session found"**
   - Sign in to Google Cloud in VS Code first
   - Use the BigQuery extension to establish a session

2. **"Backend service error"**
   - Check your backend URL configuration
   - Verify your backend service is running
   - Check network connectivity

3. **"Timeout"**
   - Increase the timeout setting
   - Check your backend service performance

### Debug Logs

Check the VS Code developer console for detailed logs about:
- Authentication status
- Backend service calls
- Error details

## License

This extension is part of the VS Code OSS project and follows the same licensing terms. 