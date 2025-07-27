#!/bin/bash

# Reset Gemini CLI Configuration Script
# This script helps reset Gemini CLI configuration to fix MCP server issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔄 Resetting Gemini CLI Configuration"
echo "====================================="
echo ""

# Check if Gemini CLI is installed
if ! command -v gemini >/dev/null 2>&1; then
    print_error "Gemini CLI not found. Please install it first:"
    print_warning "  npm install -g @google/gemini-cli"
    print_warning "  or: brew install gemini-cli"
    exit 1
fi

print_success "Gemini CLI found: $(gemini --version)"

# Check if genai-toolbox is installed
if ! command -v genai-toolbox >/dev/null 2>&1; then
    print_error "genai-toolbox not found. Please install it first:"
    print_warning "  ./scripts/install-toolbox.sh"
    exit 1
fi

print_success "genai-toolbox found: $(which genai-toolbox)"

# Backup existing configuration
GEMINI_CONFIG="$HOME/.gemini/settings.json"
if [ -f "$GEMINI_CONFIG" ]; then
    print_status "Backing up existing configuration..."
    cp "$GEMINI_CONFIG" "$GEMINI_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    print_success "Configuration backed up"
else
    print_warning "No existing configuration found"
fi

# Get Google Cloud project ID
PROJECT_ID=""
if command -v gcloud >/dev/null 2>&1; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
fi

if [ -z "$PROJECT_ID" ]; then
    print_warning "No Google Cloud project ID found"
    print_warning "Please set it with: gcloud config set project YOUR_PROJECT_ID"
    PROJECT_ID="your-project-id"
fi

print_success "Google Cloud project ID: $PROJECT_ID"

# Get genai-toolbox path
TOOLBOX_PATH=$(which genai-toolbox)
print_success "genai-toolbox path: $TOOLBOX_PATH"

# Create new configuration
print_status "Creating new Gemini CLI configuration..."

# Ensure directory exists
mkdir -p "$HOME/.gemini"

# Create configuration with full path
cat > "$GEMINI_CONFIG" << EOF
{
  "theme": "Default",
  "selectedAuthType": "oauth-personal",
  "mcpServers": {
    "bigquery": {
      "command": "$TOOLBOX_PATH",
      "args": [
        "serve",
        "--prebuilt",
        "bigquery",
        "--stdio"
      ],
      "env": {
        "BIGQUERY_PROJECT": "$PROJECT_ID",
        "PATH": "$PATH"
      }
    }
  },
  "preferredEditor": "vscode"
}
EOF

print_success "Configuration created successfully"

# Test the configuration
print_status "Testing Gemini CLI configuration..."
if gemini --help >/dev/null 2>&1; then
    print_success "Gemini CLI configuration test passed"
else
    print_error "Gemini CLI configuration test failed"
    exit 1
fi

echo ""
echo "🎉 Configuration Reset Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Restart VS Code"
echo "2. Run 'DataVibe: Test Gemini CLI Integration' from Command Palette"
echo "3. Try starting Gemini CLI: gemini"
echo ""
echo "If you still have issues:"
echo "- Check that genai-toolbox is in your PATH"
echo "- Verify Google Cloud authentication"
echo "- Run: ./scripts/install-toolbox.sh"
echo "" 