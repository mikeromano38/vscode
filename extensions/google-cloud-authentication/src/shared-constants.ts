/**
 * Shared Constants for VS Code Extensions
 * 
 * This file contains constants that are shared across multiple extensions
 * to ensure consistency and avoid duplication.
 * 
 * NOTE: This file should be kept in sync across all extensions:
 * - custom-chat
 * - bigquery-data-vibe
 * - google-cloud-authentication
 */

/**
 * Google Cloud Authentication Scopes
 * 
 * These scopes are used across all Google Cloud related extensions:
 * - google-cloud-authentication
 * - bigquery-data-vibe  
 * - custom-chat
 * 
 * The scopes are ordered by importance and grouped logically.
 */
export const GOOGLE_CLOUD_SCOPES = [
    // Core Google Cloud access - required for most operations
    'https://www.googleapis.com/auth/cloud-platform',
    
    // User information access - required for user identification
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    
    // BigQuery access - required for BigQuery operations
    'https://www.googleapis.com/auth/bigquery.readonly',  // Read-only access
    'https://www.googleapis.com/auth/bigquery'            // Full access (includes read/write)
] as const;

/**
 * Type for Google Cloud scopes
 */
export type GoogleCloudScope = typeof GOOGLE_CLOUD_SCOPES[number];

/**
 * Google Cloud Authentication Provider ID
 */
export const GOOGLE_CLOUD_AUTH_PROVIDER = 'google-cloud';

/**
 * Configuration section names used across extensions
 */
export const CONFIG_SECTIONS = {
    GOOGLE_CLOUD: 'google-cloud',
    BIGQUERY: 'bigquery',
    CUSTOM_CHAT: 'customChat'
} as const; 