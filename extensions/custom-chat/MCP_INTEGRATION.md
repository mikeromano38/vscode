# MCP Integration with Google GenAI Toolbox

This document describes the integration of the Google GenAI Toolbox MCP (Model Context Protocol) server with the custom-chat extension to enable BigQuery connectivity and advanced data analysis capabilities.

## Overview

The MCP integration allows the custom-chat extension to:

- **Start and manage Google GenAI Toolbox MCP servers** automatically
- **Connect to BigQuery tables** that are currently open in VS Code
- **Execute SQL queries** through the MCP server
- **Provide tools for AI agents** to interact with BigQuery data
- **Integrate with existing chat functionality** for seamless data analysis

## Architecture

### Components

1. **MCPServerManager** (`src/mcpServerManager.ts`)
   - Manages the lifecycle of MCP servers
   - Handles server startup, shutdown, and monitoring
   - Generates configuration files for BigQuery tools
   - Locates and installs the Google GenAI Toolbox binary

2. **MCPIntegrationService** (`src/mcpIntegrationService.ts`)
   - High-level integration service
   - Coordinates between BigQuery tables and MCP servers
   - Provides tool execution interface
   - Manages server status and tool availability

3. **Extension Integration** (`src/extension.ts`)
   - Initializes MCP services on extension activation
   - Provides test commands for debugging
   - Handles cleanup on extension deactivation

### Data Flow

```
VS Code Extension
       ↓
MCPIntegrationService
       ↓
MCPServerManager
       ↓
Google GenAI Toolbox (MCP Server)
       ↓
BigQuery API
```

## Installation

### Prerequisites

1. **Go Programming Language**
   ```bash
   # Install Go from https://golang.org/doc/install
   # Verify installation
   go version
   ```

2. **Google Cloud Authentication**
   - Sign in to Google Cloud in VS Code
   - Configure your Google Cloud project ID
   - Ensure you have BigQuery access

### Automatic Installation

The extension will automatically attempt to install the Google GenAI Toolbox:

```bash
go install github.com/googleapis/genai-toolbox@latest
```

### Manual Installation

If automatic installation fails, install manually:

```bash
# Install Go if not already installed
# macOS
brew install go

# Linux
sudo apt-get install golang-go

# Install the toolbox
go install github.com/googleapis/genai-toolbox@latest

# Add Go bin to PATH (if not already done)
export PATH=$PATH:$(go env GOPATH)/bin
```

## Configuration

### Google Cloud Project

Set your Google Cloud project ID in VS Code settings:

```json
{
  "google-cloud.projectId": "your-project-id"
}
```

Or use the custom configuration:

```json
{
  "customChat.googleCloudProjectId": "your-project-id"
}
```

### BigQuery Tables

The MCP integration automatically detects BigQuery tables that are currently open in VS Code. To use the integration:

1. Open a BigQuery table using the BigQuery extension
2. The MCP server will automatically configure tools for that table
3. Tools will be available for AI agents to query the table

## Usage

### Starting the MCP Server

The MCP server starts automatically when:

1. The extension is activated
2. BigQuery tables are open in VS Code
3. Google GenAI Toolbox is installed
4. Google Cloud project is configured

### Available Commands

#### Test MCP Integration
```bash
# Command Palette: "DataVibe: Test MCP Integration Service"
# Tests the MCP server connection and available tools
```

#### Refresh MCP Integration
```bash
# Command Palette: "DataVibe: Refresh MCP Integration Service"
# Restarts the MCP server with current BigQuery tables
```

### Tool Configuration

The MCP server automatically creates tools for each open BigQuery table:

#### Table-Specific Tools
```yaml
tools:
  query-dataset-table:
    kind: bigquery-sql
    source: bigquery-source
    description: "Query the table table in dataset dataset"
    parameters:
      - name: query
        type: string
        description: "SQL query to execute on the table"
    statement: "SELECT * FROM `project.dataset.table` WHERE 1=1"
```

#### General BigQuery Tool
```yaml
tools:
  bigquery-general:
    kind: bigquery-sql
    source: bigquery-source
    description: "Execute general BigQuery SQL queries"
    parameters:
      - name: query
        type: string
        description: "SQL query to execute"
    statement: "${query}"
```

### Tool Execution

Tools can be executed through the MCP server:

```typescript
// Example tool execution
const execution = {
  toolName: 'bigquery-general',
  parameters: {
    query: 'SELECT COUNT(*) FROM `project.dataset.table`'
  }
};

const result = await mcpService.executeTool(execution);
```

## Integration with Chat

### Chat Interface Integration

The MCP integration provides:

1. **Server Status Information**
   - Server running status
   - Available tools count
   - Connection details

2. **Tool Availability**
   - List of available BigQuery tools
   - Tool descriptions and parameters
   - Toolset groupings

3. **Error Handling**
   - Connection failures
   - Tool execution errors
   - Configuration issues

### Example Chat Usage

```
User: "Show me the top 10 records from the sales table"
AI: [Uses MCP tool to execute: SELECT * FROM `project.dataset.sales` LIMIT 10]

User: "What's the average revenue by region?"
AI: [Uses MCP tool to execute: SELECT region, AVG(revenue) FROM `project.dataset.sales` GROUP BY region]
```

## Troubleshooting

### Common Issues

#### 1. "Google GenAI Toolbox not found"

**Solution:**
```bash
# Install Go
brew install go  # macOS
sudo apt-get install golang-go  # Linux

# Install toolbox
go install github.com/googleapis/genai-toolbox/cmd/toolbox@latest

# Add to PATH
export PATH=$PATH:$(go env GOPATH)/bin
```

#### 2. "No Google Cloud project ID configured"

**Solution:**
```json
// VS Code settings.json
{
  "google-cloud.projectId": "your-project-id"
}
```

#### 3. "MCP server failed to start"

**Solution:**
- Check if port 5000 is available
- Verify Google Cloud authentication
- Check BigQuery table access permissions

#### 4. "No BigQuery tables open"

**Solution:**
- Open a BigQuery table using the BigQuery extension
- Run "DataVibe: Refresh MCP Integration Service"

### Debug Information

Enable debug logging to see detailed information:

```typescript
// Check server status
const mcpService = MCPIntegrationService.getInstance();
const serverInfo = mcpService.getServerInfo();
console.log('Server info:', serverInfo);

// Check available tools
const tools = mcpService.getAvailableTools();
console.log('Available tools:', tools);
```

### Logs

Check the VS Code developer console for detailed logs:

- MCP server startup/shutdown
- Tool configuration generation
- Tool execution results
- Error messages and stack traces

## Development

### Adding New Tools

To add new tools to the MCP server:

1. **Modify `createBigQueryToolsConfig`** in `MCPServerManager`
2. **Add tool definitions** to the configuration
3. **Update tool execution logic** in `MCPIntegrationService`

### Extending MCP Integration

The MCP integration is designed to be extensible:

1. **Add new data sources** beyond BigQuery
2. **Support additional tool types** (not just SQL)
3. **Integrate with other MCP servers**
4. **Add authentication methods**

### Testing

Use the provided test commands:

```bash
# Test MCP integration
DataVibe: Test MCP Integration Service

# Test data sources
DataVibe: Test Data Sources

# Refresh integration
DataVibe: Refresh MCP Integration Service
```

## Security Considerations

### Authentication

- Uses Google Cloud application default credentials
- Respects existing VS Code Google Cloud authentication
- No additional authentication required

### Permissions

- MCP server runs with user permissions
- BigQuery access follows Google Cloud IAM policies
- Tools are scoped to configured project and tables

### Network

- MCP server runs locally on port 5000
- No external network communication required
- All BigQuery communication goes through Google Cloud APIs

## Future Enhancements

### Planned Features

1. **Multiple MCP Servers**
   - Support for multiple concurrent MCP servers
   - Load balancing and failover

2. **Advanced Tool Types**
   - Data visualization tools
   - Machine learning model tools
   - Data transformation tools

3. **Real-time Updates**
   - Automatic tool updates when tables change
   - Live schema synchronization

4. **Performance Optimization**
   - Connection pooling
   - Query caching
   - Result streaming

### Integration Opportunities

1. **Other Data Sources**
   - PostgreSQL, MySQL, SQL Server
   - Cloud databases (Spanner, Firestore)
   - Data warehouses (Snowflake, Redshift)

2. **AI Framework Integration**
   - LangChain integration
   - OpenAI function calling
   - Anthropic Claude tools

3. **Visualization Integration**
   - Vega-Lite chart generation
   - Interactive dashboards
   - Real-time data visualization

## References

- [Google GenAI Toolbox Documentation](https://github.com/googleapis/genai-toolbox)
- [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io/)
- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [VS Code Extension API](https://code.visualstudio.com/api) 