# Google Cloud Authentication Extension

This extension provides Google Cloud authentication and project management for VS Code. It allows users to authenticate with Google Cloud using OAuth and manage their GCP projects directly within VS Code.

## Features

- **OAuth Authentication**: Secure authentication with Google Cloud using OAuth 2.0 with built-in HTTP listener
- **Project Management**: Select and manage Google Cloud projects
- **Token Refresh**: Automatic token refresh to minimize re-authentication
- **Prominent Banner**: Shows a prominent banner at the top of VS Code when authentication is needed
- **Global Access**: Provides authentication credentials to all VS Code extensions
- **HTTP Listener**: Uses a local HTTP server for reliable OAuth redirects

## Setup

### 1. Google Cloud OAuth Configuration

Before using this extension, you need to set up OAuth credentials in Google Cloud Console:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Cloud APIs you need
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "OAuth 2.0 Client IDs"
6. Configure the OAuth consent screen
7. Set the redirect URI to `http://localhost:3000/callback`
8. Copy the Client ID and Client Secret

### 2. Extension Configuration

Update the extension code with your OAuth credentials:

1. Open `src/googleCloud.ts`
2. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
3. Replace `YOUR_GOOGLE_CLIENT_SECRET` with your actual Client Secret

## Usage

### For End Users

1. **Authentication**: The extension will automatically prompt you to sign in when you first use it
2. **Project Configuration**: Configure your Google Cloud project ID in the extension settings
3. **Commands**: Use the command palette to access Google Cloud features:
   - `Google Cloud: Sign in to Google Cloud`
   - `Google Cloud: Sign out of Google Cloud`

### For Extension Developers

Other extensions can use the Google Cloud authentication service:

```typescript
import { GoogleCloudService } from './googleCloudService';

// Get the service instance
const gcpService = GoogleCloudService.getInstance();

// Check if user is authenticated
const isAuthenticated = await gcpService.isAuthenticated();

// Get access token for API calls
const accessToken = await gcpService.getAccessToken();

// Get current project
const project = await gcpService.getCurrentProject();

// Make authenticated API calls
const response = await gcpService.makeAuthenticatedRequest(
    'https://compute.googleapis.com/compute/v1/projects/my-project/zones/us-central1-a/instances'
);

// Get list of projects
const projects = await gcpService.getProjects();
```

### API Reference

#### GoogleCloudService

- `getInstance()`: Get the singleton instance of the service
- `getAccessToken()`: Get the current access token
- `getCurrentProject()`: Get the current project information
- `setCurrentProject(projectId, region)`: Set the current project
- `isAuthenticated()`: Check if user is authenticated
- `authenticate()`: Authenticate with Google Cloud
- `signOut()`: Sign out of Google Cloud
- `makeAuthenticatedRequest(url, options)`: Make authenticated API requests
- `getProjects()`: Get list of available projects
- `getProjectInfo(projectId)`: Get information about a specific project

## Configuration

The extension supports the following configuration options:

- `google-cloud.projectId`: **Required** - The Google Cloud project ID to use for all operations
- `google-cloud.region`: The default Google Cloud region (default: us-central1)
- `google-cloud.autoAuthenticate`: Automatically prompt for authentication (default: true)

### Setting up the Project ID

1. Go to your VS Code settings (File > Preferences > Settings)
2. Search for "Google Cloud"
3. Set the `google-cloud.projectId` to your Google Cloud project ID
4. The project ID can be found in the Google Cloud Console or by running `gcloud config get-value project`

## How It Works

The extension uses a local HTTP server to handle OAuth redirects:

1. **Server Startup**: When authentication is initiated, a local HTTP server starts on port 3000 (or the next available port)
2. **OAuth Flow**: The user is redirected to Google's OAuth page in their browser
3. **Callback Handling**: After successful authentication, Google redirects back to `http://localhost:3000/callback`
4. **Token Exchange**: The extension exchanges the authorization code for access tokens
5. **Server Cleanup**: The HTTP server automatically stops after the authentication process is complete

This approach provides reliable OAuth handling across different platforms and doesn't require custom URI scheme registration.

## Security

- OAuth tokens are stored securely using VS Code's built-in secret storage
- Tokens are automatically refreshed before expiration
- No credentials are stored in plain text
- All API calls use secure HTTPS connections
- HTTP listener runs locally and only accepts connections from localhost
- OAuth server automatically stops after authentication is complete

## Troubleshooting

### Authentication Issues

1. **Invalid Client ID/Secret**: Make sure you've updated the OAuth credentials in the code
2. **Redirect URI Mismatch**: Ensure the redirect URI in Google Cloud Console matches `http://localhost:3000/callback`
3. **Network Issues**: Check your internet connection and firewall settings

### Project Configuration Issues

1. **Project ID Not Set**: Make sure you've configured the `google-cloud.projectId` setting
2. **Invalid Project ID**: Verify the project ID exists and you have access to it
3. **Permission Denied**: Ensure your account has the necessary permissions for the project

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This extension is licensed under the MIT License. 