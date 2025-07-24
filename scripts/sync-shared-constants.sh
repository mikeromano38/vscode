#!/bin/bash

# Script to sync shared constants across all extensions
# This ensures that all extensions use the same Google Cloud scopes and configuration

echo "🔄 Syncing shared constants across extensions..."

# Define the source file (we'll use custom-chat as the source of truth)
SOURCE_FILE="extensions/custom-chat/src/shared-constants.ts"

# Define target files
TARGET_FILES=(
    "extensions/bigquery-data-vibe/src/shared-constants.ts"
    "extensions/google-cloud-authentication/src/shared-constants.ts"
)

# Check if source file exists
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Source file not found: $SOURCE_FILE"
    exit 1
fi

# Copy to all target files
for target in "${TARGET_FILES[@]}"; do
    echo "📋 Copying to: $target"
    cp "$SOURCE_FILE" "$target"
done

echo "✅ Shared constants synced successfully!"
echo ""
echo "📝 Note: This script copies the shared constants from custom-chat to other extensions."
echo "   Make changes to the source file in custom-chat/src/shared-constants.ts"
echo "   Then run this script to sync across all extensions." 