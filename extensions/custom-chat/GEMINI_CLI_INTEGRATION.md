# Gemini CLI Integration with Custom Chat Extension

This document describes the integration of [Gemini CLI](https://github.com/google-gemini/gemini-cli) with the custom-chat extension to enable AI-powered BigQuery data analysis through the genai-toolbox MCP server.

## Overview

The Gemini CLI integration provides:

- **AI-Powered Data Analysis**: Use Gemini AI to analyze BigQuery data through natural language
- **MCP Server Integration**: Seamless connection to genai-toolbox MCP server
- **Automated Installation**: Automatic installation and configuration of Gemini CLI
- **VS Code Integration**: Direct integration with the custom-chat extension
- **BigQuery Connectivity**: Full access to BigQuery datasets and tables

## Architecture

### Components

1. **GeminiCliService** (`src/geminiCliService.ts`)
   - Manages Gemini CLI installation and configuration
   - Configures MCP servers for genai-toolbox integration
   - Provides execution interface for Gemini CLI commands
   - Handles authentication and project configuration

2. **MCP Server Integration**
   - Uses genai-toolbox as MCP server for BigQuery
   - Configures STDIO communication for seamless integration
   - Provides BigQuery tools to Gemini AI

3. **Extension Integration** (`src/extension.ts`)
   - Initializes Gemini CLI service on extension activation
   - Provides test and refresh commands
   - Integrates with existing chat functionality

### Data Flow

```
VS Code Extension
       ↓
GeminiCliService
       ↓
Gemini CLI
       ↓
MCP Server (genai-toolbox)
       ↓
BigQuery API
```

## Installation

### Automatic Installation

The extension automatically installs and configures Gemini CLI:

```bash
# Run the installation script
cd vscode/extensions/custom-chat
./scripts/install-toolbox.sh
```

The script will:
1. Install Google GenAI Toolbox
2. Install Gemini CLI (npm, npx, or Homebrew)
3. Configure MCP servers
4. Set up Google Cloud authentication

### Manual Installation

If automatic installation fails, install manually:

### Configuration Reset

If you encounter MCP server issues, use the reset script:

```bash
cd vscode/extensions/custom-chat
./scripts/reset-gemini-config.sh
```

This script will:
- Backup your existing configuration
- Find the correct genai-toolbox path
- Create a new configuration with full paths
- Test the configuration

#### Option 1: npm
```bash
npm install -g @google/gemini-cli
```

#### Option 2: Homebrew
```bash
brew install gemini-cli
```

#### Option 3: npx
```bash
npx @google/gemini-cli
```

## Configuration

### MCP Server Configuration

The extension automatically configures Gemini CLI to use the genai-toolbox MCP server:

```json
{
  "mcpServers": {
    "bigquery": {
      "command": "genai-toolbox",
      "args": [
        "serve",
        "--prebuilt",
        "bigquery",
        "--stdio"
      ],
      "env": {
        "BIGQUERY_PROJECT": "your-project-id",
        "GOOGLE_APPLICATION_CREDENTIALS": "path/to/credentials"
      }
    }
  }
}
```

### Google Cloud Authentication

Gemini CLI uses the same Google Cloud authentication as the extension:

1. **OAuth Personal Account**: Default authentication method
2. **API Key**: Set `GEMINI_API_KEY` environment variable
3. **Vertex AI**: Set `GOOGLE_API_KEY` and `GOOGLE_GENAI_USE_VERTEXAI=true`

### Project Configuration

Set your Google Cloud project ID in VS Code settings:

```json
{
  "google-cloud.projectId": "your-project-id"
}
```

## Usage

### Available Commands

#### Test Gemini CLI Integration
```bash
# Command Palette: "DataVibe: Test Gemini CLI Integration"
# Tests the Gemini CLI connection and BigQuery integration
```

#### Refresh Gemini CLI Integration
```bash
# Command Palette: "DataVibe: Refresh Gemini CLI Integration"
# Reconfigures Gemini CLI with current settings
```

### BigQuery Analysis Examples

Once configured, you can use Gemini CLI to analyze BigQuery data:

#### Basic Queries
```bash
# Start Gemini CLI
gemini

# Ask about your data
> List all datasets in the current BigQuery project
> Show me the top 10 records from the sales table
> What's the average revenue by region?
> Create a summary of user activity for the last 30 days
```

#### Advanced Analysis
```bash
> Analyze the sales data and identify trends
> Compare performance between different product categories
> Generate insights about customer behavior patterns
> Create a data quality report for the analytics dataset
```

#### Data Exploration
```bash
> Explore the schema of the users table
> Find tables related to customer data
> Show me the data types and null values in the transactions table
> Identify potential data quality issues
```

### Integration with VS Code

The Gemini CLI integration provides:

1. **Seamless Workflow**: Use Gemini CLI directly from VS Code
2. **Context Awareness**: Gemini CLI can access your current workspace
3. **File Integration**: Analyze code and data files together
4. **Terminal Integration**: Run Gemini CLI commands in VS Code terminal

## Features

### AI-Powered Data Analysis

- **Natural Language Queries**: Ask questions about your data in plain English
- **Intelligent Insights**: Get AI-generated insights and recommendations
- **Data Exploration**: Explore datasets and schemas automatically
- **Trend Analysis**: Identify patterns and trends in your data

### BigQuery Integration

- **Direct Access**: Full access to BigQuery datasets and tables
- **SQL Generation**: Automatic SQL query generation and optimization
- **Schema Analysis**: Intelligent schema exploration and documentation
- **Data Quality**: Automated data quality assessment

### MCP Server Benefits

- **Tool Integration**: Access to all genai-toolbox BigQuery tools
- **Real-time Queries**: Execute queries and get results immediately
- **Error Handling**: Comprehensive error handling and debugging
- **Performance**: Optimized query execution and result processing

## Configuration Details

### Settings File Location

Gemini CLI settings are stored in:
```
~/.gemini/settings.json
```

### Environment Variables

The extension automatically sets these environment variables:

- `BIGQUERY_PROJECT`: Your Google Cloud project ID
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to credentials file
- `GEMINI_API_KEY`: Gemini API key (if using API key authentication)

### MCP Server Configuration

The MCP server configuration includes:

- **Command**: `genai-toolbox` (the BigQuery MCP server)
- **Arguments**: `serve --prebuilt bigquery --stdio`
- **Environment**: Project ID and credentials
- **Communication**: STDIO for seamless integration

## Troubleshooting

### Common Issues

#### 1. "Gemini CLI not found"

**Solution:**
```bash
# Install via npm
npm install -g @google/gemini-cli

# Or via Homebrew
brew install gemini-cli

# Or use npx
npx @google/gemini-cli
```

#### 2. "MCP server configuration failed"

**Solution:**
- Ensure genai-toolbox is installed and in PATH
- Check Google Cloud project configuration
- Verify authentication credentials
- Run the reset script: `./scripts/reset-gemini-config.sh`

#### 3. "BigQuery access denied"

**Solution:**
- Verify Google Cloud authentication
- Check BigQuery permissions
- Ensure project ID is correctly configured

#### 4. "Gemini CLI authentication failed"

**Solution:**
```bash
# Set up API key
export GEMINI_API_KEY="your-api-key"

# Or use OAuth (default)
gemini
# Follow authentication prompts
```

### Debug Information

Enable debug logging to see detailed information:

```typescript
// Check Gemini CLI status
const geminiCliService = GeminiCliService.getInstance();
const config = geminiCliService.getConfiguration();
console.log('Gemini CLI config:', config);

// Test BigQuery integration
const result = await geminiCliService.testBigQueryIntegration();
console.log('Test result:', result);
```

### Logs

Check the VS Code developer console for detailed logs:

- Gemini CLI installation and configuration
- MCP server setup and communication
- BigQuery query execution
- Error messages and stack traces

## Development

### Adding New Features

To extend the Gemini CLI integration:

1. **Modify GeminiCliService**: Add new methods for additional functionality
2. **Update MCP Configuration**: Add new MCP servers or tools
3. **Extend Commands**: Add new VS Code commands for testing and management

### Testing

Use the provided test commands:

```bash
# Test Gemini CLI integration
DataVibe: Test Gemini CLI Integration

# Test MCP integration
DataVibe: Test MCP Integration Service

# Refresh configurations
DataVibe: Refresh Gemini CLI Integration
```

### Customization

The integration is designed to be extensible:

1. **Additional MCP Servers**: Add support for other data sources
2. **Custom Tools**: Create custom BigQuery analysis tools
3. **Advanced Queries**: Implement complex query patterns
4. **Result Processing**: Add custom result formatting and analysis

## Security Considerations

### Authentication

- Uses Google Cloud application default credentials
- Supports OAuth personal accounts and API keys
- Respects existing VS Code Google Cloud authentication
- No additional authentication required

### Permissions

- Gemini CLI runs with user permissions
- BigQuery access follows Google Cloud IAM policies
- MCP server communication is local (STDIO)
- No external network communication for MCP

### Data Privacy

- All BigQuery queries are executed through Google Cloud APIs
- No data is stored locally by the extension
- Gemini CLI queries are processed by Google's AI services
- Follows Google's privacy and security policies

## Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Machine learning model integration
   - Predictive analytics capabilities
   - Automated report generation

2. **Enhanced Integration**
   - Direct chat interface integration
   - Real-time data streaming
   - Collaborative analysis features

3. **Additional Data Sources**
   - Support for other databases
   - Cloud storage integration
   - Real-time data sources

### Integration Opportunities

1. **AI Framework Integration**
   - LangChain integration
   - OpenAI function calling
   - Anthropic Claude tools

2. **Visualization Integration**
   - Chart generation
   - Interactive dashboards
   - Data storytelling

3. **Workflow Automation**
   - Scheduled analysis
   - Automated insights
   - Alert generation

## References

- [Gemini CLI Documentation](https://github.com/google-gemini/gemini-cli)
- [Google GenAI Toolbox](https://github.com/googleapis/genai-toolbox)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [Gemini API Documentation](https://ai.google.dev/docs) 