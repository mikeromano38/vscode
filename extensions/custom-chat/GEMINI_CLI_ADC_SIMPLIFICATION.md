# Gemini CLI ADC Simplification

## Overview

This document summarizes the simplification of the Gemini CLI implementation to only use Application Default Credentials (ADC) for Google Cloud authentication, removing the complex credential path handling.

## Changes Made

### 1. Configuration Service (`src/configService.ts`)

**Interface Changes:**
- Removed `credentialsPath` field from `GoogleCloudConfig` interface
- Simplified configuration to only support ADC

**Method Updates:**
- `getEffectiveCredentialsPath()`: Now only returns empty string (indicating ADC usage)
- `validateConfig()`: Updated validation to require ADC to be enabled
- `updateConfig()`: Removed credentialsPath update logic
- `getConfigStatus()`: Simplified status display for ADC-only approach

### 2. Gemini CLI Service (`src/geminiCliService.ts`)

**MCP Server Configuration:**
- Removed `GOOGLE_APPLICATION_CREDENTIALS` environment variable from MCP server configuration
- Simplified environment setup to rely on ADC
- Updated success message to indicate ADC usage

**Credential Handling:**
- `getGoogleCredentialsPath()`: Simplified to always return empty string (ADC)

### 3. MCP Server Manager (`src/mcpServerManager.ts`)

**Server Configuration:**
- Removed `GOOGLE_APPLICATION_CREDENTIALS` from server environment
- Simplified `getGoogleCredentialsPath()` method to only support ADC

### 4. Package Configuration (`package.json`)

**Configuration Schema:**
- Removed `customChat.googleCloud.credentialsPath` configuration option
- Updated description for `customChat.googleCloud.useApplicationDefaultCredentials` to indicate it's required

## Benefits

1. **Simplified Setup**: Users only need to configure ADC, no need to manage service account JSON files
2. **Reduced Complexity**: Eliminated credential path validation and fallback logic
3. **Better Security**: ADC is the recommended authentication method for Google Cloud
4. **Easier Maintenance**: Less code to maintain and fewer potential failure points

## Migration Guide

### For Existing Users

1. **Enable ADC**: Ensure `customChat.googleCloud.useApplicationDefaultCredentials` is set to `true`
2. **Remove Old Settings**: The `customChat.googleCloud.credentialsPath` setting will be ignored
3. **Set Project ID**: Configure `customChat.googleCloud.projectId` or use `gcloud config set project`
4. **Set Gemini API Key**: Configure `customChat.gemini.apiKey` for Gemini authentication

### ADC Setup

1. **Install gcloud CLI**: Download and install from https://cloud.google.com/sdk/docs/install
2. **Authenticate**: Run `gcloud auth application-default login`
3. **Set Project**: Run `gcloud config set project YOUR_PROJECT_ID`
4. **Verify**: Run `gcloud auth list` to confirm authentication

## Configuration Example

```json
{
  "customChat.googleCloud.projectId": "your-project-id",
  "customChat.googleCloud.useApplicationDefaultCredentials": true,
  "customChat.gemini.apiKey": "your-gemini-api-key",
  "customChat.gemini.model": "gemini-2.5-pro"
}
```

## Validation

The extension will now validate:
- ✅ Google Cloud project ID is configured
- ✅ Application Default Credentials are enabled
- ✅ Gemini API key is configured
- ✅ Gemini model is specified

## Error Messages

Updated error messages now focus on ADC requirements:
- "Application Default Credentials must be enabled for BigQuery authentication"
- "No Google Cloud project ID configured"
- "No Gemini API key configured"

## Backward Compatibility

- Existing `getEffectiveCredentialsPath()` and `getGoogleCredentialsPath()` methods are retained for compatibility
- These methods now always return empty string (indicating ADC usage)
- No breaking changes to public APIs 