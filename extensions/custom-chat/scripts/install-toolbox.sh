#!/bin/bash

# Google GenAI Toolbox Installation Script
# This script installs the Google GenAI Toolbox and its dependencies

set -e

echo "🚀 Installing Google GenAI Toolbox for VS Code Custom Chat Extension"
echo "=================================================================="

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        CYGWIN*)    echo "windows";;
        MINGW*)     echo "windows";;
        *)          echo "unknown";;
    esac
}

# Function to install Go
install_go() {
    local os=$(detect_os)
    
    print_status "Detected OS: $os"
    
    if command_exists go; then
        local go_version=$(go version | awk '{print $3}')
        print_success "Go is already installed: $go_version"
        return 0
    fi
    
    print_status "Installing Go..."
    
    case $os in
        "macos")
            if command_exists brew; then
                brew install go
            else
                print_error "Homebrew not found. Please install Homebrew first:"
                print_error "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                return 1
            fi
            ;;
        "linux")
            if command_exists apt-get; then
                sudo apt-get update
                sudo apt-get install -y golang-go
            elif command_exists yum; then
                sudo yum install -y golang
            elif command_exists dnf; then
                sudo dnf install -y golang
            else
                print_error "Unsupported package manager. Please install Go manually:"
                print_error "  https://golang.org/doc/install"
                return 1
            fi
            ;;
        "windows")
            print_error "Please install Go manually on Windows:"
            print_error "  https://golang.org/doc/install"
            return 1
            ;;
        *)
            print_error "Unsupported operating system"
            return 1
            ;;
    esac
    
    if command_exists go; then
        local go_version=$(go version | awk '{print $3}')
        print_success "Go installed successfully: $go_version"
    else
        print_error "Go installation failed"
        return 1
    fi
}

# Function to setup Go environment
setup_go_env() {
    print_status "Setting up Go environment..."
    
    # Get Go paths
    local gopath=$(go env GOPATH)
    local goroot=$(go env GOROOT)
    local gobin="$gopath/bin"
    
    print_status "GOPATH: $gopath"
    print_status "GOROOT: $goroot"
    print_status "GOBIN: $gobin"
    
    # Add Go bin to PATH if not already there
    if [[ ":$PATH:" != *":$gobin:"* ]]; then
        print_status "Adding Go bin to PATH..."
        
        local shell_rc=""
        if [[ -f "$HOME/.bashrc" ]]; then
            shell_rc="$HOME/.bashrc"
        elif [[ -f "$HOME/.zshrc" ]]; then
            shell_rc="$HOME/.zshrc"
        elif [[ -f "$HOME/.profile" ]]; then
            shell_rc="$HOME/.profile"
        fi
        
        if [[ -n "$shell_rc" ]]; then
            echo "" >> "$shell_rc"
            echo "# Go environment" >> "$shell_rc"
            echo "export GOPATH=$gopath" >> "$shell_rc"
            echo "export PATH=\$PATH:$gobin" >> "$shell_rc"
            print_success "Added Go environment to $shell_rc"
            print_warning "Please restart your terminal or run: source $shell_rc"
        else
            print_warning "Could not find shell configuration file. Please add manually:"
            print_warning "  export GOPATH=$gopath"
            print_warning "  export PATH=\$PATH:$gobin"
        fi
    else
        print_success "Go bin is already in PATH"
    fi
}

# Function to install Google GenAI Toolbox
install_toolbox() {
    print_status "Installing Google GenAI Toolbox..."
    
    # Check if toolbox is already installed
    if command_exists genai-toolbox; then
        local toolbox_version=$(genai-toolbox version 2>/dev/null || echo "unknown")
        print_success "Google GenAI Toolbox is already installed: $toolbox_version"
        return 0
    fi
    
    # Install toolbox
    if go install github.com/googleapis/genai-toolbox@latest; then
        print_success "Google GenAI Toolbox installed successfully"
    else
        print_error "Failed to install Google GenAI Toolbox"
        return 1
    fi
    
    # Verify installation
    if command_exists genai-toolbox; then
        print_success "Google GenAI Toolbox verification successful"
    else
        print_warning "Google GenAI Toolbox installed but not found in PATH"
        print_warning "Please restart your terminal or add Go bin to PATH"
        return 1
    fi
}

# Function to verify Google Cloud setup
verify_gcloud() {
    print_status "Verifying Google Cloud setup..."
    
    if command_exists gcloud; then
        local gcloud_version=$(gcloud version | head -1)
        print_success "Google Cloud SDK found: $gcloud_version"
        
        # Check if user is authenticated
        if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
            local account=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
            print_success "Google Cloud authenticated as: $account"
        else
            print_warning "Google Cloud not authenticated. Please run:"
            print_warning "  gcloud auth login"
        fi
        
        # Check if project is set
        local project=$(gcloud config get-value project 2>/dev/null || echo "")
        if [[ -n "$project" ]]; then
            print_success "Google Cloud project set: $project"
        else
            print_warning "Google Cloud project not set. Please run:"
            print_warning "  gcloud config set project YOUR_PROJECT_ID"
        fi
    else
        print_warning "Google Cloud SDK not found. Please install it:"
        print_warning "  https://cloud.google.com/sdk/docs/install"
    fi
}

# Function to test toolbox installation
test_toolbox() {
    print_status "Testing Google GenAI Toolbox installation..."
    
    if command_exists genai-toolbox; then
        # Test with help command instead of version (which requires tools file)
        if genai-toolbox --help >/dev/null 2>&1; then
            print_success "Google GenAI Toolbox test successful"
            return 0
        else
            print_error "Google GenAI Toolbox test failed"
            return 1
        fi
    else
        print_error "Google GenAI Toolbox not found in PATH"
        return 1
    fi
}

# Function to install Gemini CLI
install_gemini_cli() {
    print_status "Installing Gemini CLI..."
    
    # Check if Gemini CLI is already installed
    if command_exists gemini; then
        local gemini_version=$(gemini --version 2>/dev/null || echo "unknown")
        print_success "Gemini CLI is already installed: $gemini_version"
        return 0
    fi
    
    # Try npm install first
    if command_exists npm; then
        print_status "Installing Gemini CLI via npm..."
        if npm install -g @google/gemini-cli; then
            print_success "Gemini CLI installed successfully via npm"
            return 0
        else
            print_warning "npm install failed, trying npx..."
        fi
    fi
    
    # Try npx as fallback
    if command_exists npx; then
        print_status "Testing Gemini CLI via npx..."
        if npx @google/gemini-cli --version >/dev/null 2>&1; then
            print_success "Gemini CLI available via npx"
            return 0
        fi
    fi
    
    # Try Homebrew
    if command_exists brew; then
        print_status "Installing Gemini CLI via Homebrew..."
        if brew install gemini-cli; then
            print_success "Gemini CLI installed successfully via Homebrew"
            return 0
        fi
    fi
    
    print_error "Failed to install Gemini CLI automatically"
    print_warning "Please install manually:"
    print_warning "  npm install -g @google/gemini-cli"
    print_warning "  or: brew install gemini-cli"
    print_warning "  or: npx @google/gemini-cli"
    
    return 1
}

# Function to configure Gemini CLI
configure_gemini_cli() {
    print_status "Configuring Gemini CLI..."
    
    # Check if Gemini CLI is available
    if ! command_exists gemini; then
        print_warning "Gemini CLI not found, skipping configuration"
        return 0
    fi
    
    # Get Google Cloud project ID
    local projectId=""
    if command_exists gcloud; then
        projectId=$(gcloud config get-value project 2>/dev/null || echo "")
    fi
    
    if [[ -z "$projectId" ]]; then
        print_warning "No Google Cloud project ID found"
        print_warning "Please set it with: gcloud config set project YOUR_PROJECT_ID"
        return 0
    fi
    
    print_success "Google Cloud project ID: $projectId"
    print_status "Gemini CLI will be configured to use genai-toolbox MCP server"
    print_status "Configuration will be done automatically when VS Code extension starts"
    
    return 0
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo "🎉 Installation Complete!"
    echo "========================"
    echo ""
    echo "Next steps:"
    echo "1. Restart VS Code"
    echo "2. Open a BigQuery table in VS Code"
    echo "3. Run 'DataVibe: Test MCP Integration Service' from Command Palette"
    echo "4. Run 'DataVibe: Test Gemini CLI Integration' from Command Palette"
    echo "5. Start chatting with your BigQuery data!"
    echo ""
    echo "For more information, see: MCP_INTEGRATION.md"
    echo ""
}

# Main installation process
main() {
    echo ""
    
    # Install Go
    if ! install_go; then
        print_error "Go installation failed. Please install manually."
        exit 1
    fi
    
    # Setup Go environment
    setup_go_env
    
    # Install Google GenAI Toolbox
    if ! install_toolbox; then
        print_error "Google GenAI Toolbox installation failed."
        exit 1
    fi
    
    # Test installation
    if ! test_toolbox; then
        print_error "Google GenAI Toolbox test failed."
        exit 1
    fi
    
    # Install Gemini CLI
    if ! install_gemini_cli; then
        print_warning "Gemini CLI installation failed, but continuing..."
    fi
    
    # Configure Gemini CLI
    configure_gemini_cli
    
    # Verify Google Cloud setup
    verify_gcloud
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@" 