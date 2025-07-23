# BigQuery Data Vibe

A VS Code extension that provides a BigQuery resource explorer and CSV data viewer with support for multiple Google Cloud projects.

## Features

### BigQuery Resource Explorer
- **Multi-Project Support**: Browse multiple Google Cloud projects in a single view
- **Project Management**: Add, remove, enable, and disable projects easily
- **Dataset Explorer**: View datasets within your projects
- **Table & View Browser**: Explore tables and views within datasets
- **Lazy Loading**: Resources are fetched only when expanded for better performance
- **Authentication**: Uses Google Cloud authentication for secure access

### CSV Data Viewer
- **Tabular Display**: View CSV files in a clean, tabular format
- **BigQuery Integration**: Open BigQuery table data as CSV files
- **Query Results**: Execute BigQuery queries and view results as CSV

## Getting Started

### Prerequisites
1. **Google Cloud Project**: You need at least one Google Cloud project with BigQuery enabled
2. **Authentication**: The extension handles Google Cloud authentication internally
3. **BigQuery API**: Ensure BigQuery API is enabled in your project(s)

### Configuration

#### Adding Projects
You can add Google Cloud projects in several ways:

1. **Quick Add**: Use the "Add Project" button in the BigQuery explorer
2. **Settings**: Use "Add More Projects" to open settings and configure multiple projects
3. **Auto-Configuration**: The extension can auto-detect projects from your Google Cloud configuration

#### Project Configuration Format
In your VS Code settings, projects are configured as an array:

```json
{
  "bigquery.projects": [
    {
      "projectId": "my-project-id",
      "name": "My Project Display Name",
      "enabled": true
    },
    {
      "projectId": "another-project",
      "name": "Another Project",
      "enabled": true
    }
  ],
  "bigquery.defaultProjectId": "my-project-id"
}
```

### Usage

#### BigQuery Explorer
1. Open the BigQuery panel in the activity bar
2. Add your GCP projects using the "Add Project" or "Add More Projects" buttons
3. Sign in to Google Cloud when prompted
4. Expand projects to see datasets
5. Expand datasets to see tables and views
6. Right-click on projects to disable or remove them
7. Right-click on tables/views to:
   - Open table data as CSV
   - Run custom queries

#### CSV Viewer
- Open any `.csv` file to view it in tabular format
- BigQuery table data opens automatically as CSV files

## Commands

- `bigquery.refresh`: Refresh the BigQuery explorer
- `bigquery.addProject`: Add a single project through a quick dialog
- `bigquery.configureProject`: Open settings to manage multiple projects
- `bigquery.disableProject`: Disable a project (context menu)
- `bigquery.removeProject`: Remove a project (context menu)
- `bigquery.openTable`: Open a BigQuery table as CSV
- `bigquery.runQuery`: Execute a custom BigQuery query
- `bigquery.signIn`: Sign in to Google Cloud

## Configuration

The extension supports the following settings:

- `bigquery.projects`: Array of Google Cloud projects to display
- `bigquery.defaultProjectId`: Default project for new operations (optional)
- `bigquery.region`: Default BigQuery region
- `bigquery.maxResults`: Maximum number of results to fetch from BigQuery

### Project Object Properties
- `projectId` (required): The Google Cloud project ID
- `name` (optional): Display name for the project in the explorer
- `enabled` (optional): Whether the project is visible in the explorer (default: true)

## Dependencies

- **node-fetch**: For BigQuery API calls

## Development

### Building
```bash
npm install
npm run build
```

### Structure
- `src/extension.ts`: Main extension entry point
- `src/bigqueryExplorer.ts`: BigQuery tree view provider
- `src/bigqueryService.ts`: BigQuery API service
- `webview-ui/`: Angular-based CSV viewer

## License

ISC 