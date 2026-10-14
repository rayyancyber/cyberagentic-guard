#!/bin/bash

# ==============================================================================
# CYBERGUARD X - Automatic GitHub Push Script
# ==============================================================================
# Repository: https://github.com/rayyancyber/cyberagentic-guard
# 
# INSTRUCTIONS:
# 1. Get your Personal Access Token from: https://github.com/settings/tokens/new
#    - Select scope: "repo" (Full control of private repositories)
# 2. Replace YOUR_TOKEN_HERE below with your actual token
# 3. Run: chmod +x auto-push.sh
# 4. Run: ./auto-push.sh
# ==============================================================================

# ⬇️ REPLACE THIS WITH YOUR GITHUB PERSONAL ACCESS TOKEN ⬇️
GITHUB_TOKEN="ghp_YOUR_TOKEN_HERE"
# ⬆️ Get your token from: https://github.com/settings/tokens/new ⬆️

# Repository configuration
REPO_OWNER="rayyancyber"
REPO_NAME="cyberagentic-guard"
REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
BRANCH="master"
PROJECT_DIR="/home/reyan/Downloads/backend-haven-hub-main"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================================================
# Functions
# ==============================================================================

print_header() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo "  🚀 CYBERGUARD X - GitHub Push"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_token() {
    if [ "$GITHUB_TOKEN" = "ghp_YOUR_TOKEN_HERE" ]; then
        print_error "GitHub token not configured!"
        echo ""
        echo "Please follow these steps:"
        echo ""
        echo "1. Go to: https://github.com/settings/tokens/new"
        echo "2. Token name: cyberagentic-guard-push"
        echo "3. Select scope: ✅ repo"
        echo "4. Click 'Generate token'"
        echo "5. Copy the token (starts with ghp_)"
        echo "6. Edit this script and replace YOUR_TOKEN_HERE with your token"
        echo ""
        exit 1
    fi
}

push_to_github() {
    cd "$PROJECT_DIR" || exit 1
    
    print_info "Repository: ${REPO_URL}"
    print_info "Branch: ${BRANCH}"
    echo ""
    
    # Get commit count
    COMMIT_COUNT=$(git rev-list --count HEAD)
    print_info "Total commits ready: ${COMMIT_COUNT}"
    echo ""
    
    # Show last 5 commits
    print_info "Last 5 commits:"
    git log --oneline -5
    echo ""
    
    print_info "Starting push..."
    echo ""
    
    # Push with token
    git push "https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git" ${BRANCH}
    
    PUSH_RESULT=$?
    
    echo ""
    
    if [ $PUSH_RESULT -eq 0 ]; then
        print_success "Push completed successfully!"
        echo ""
        echo "═══════════════════════════════════════════════════════════════════"
        echo "  🎉 Your project is now on GitHub!"
        echo "═══════════════════════════════════════════════════════════════════"
        echo ""
        print_success "View your project at:"
        echo "  🌐 https://github.com/${REPO_OWNER}/${REPO_NAME}"
        echo ""
        print_info "What was pushed:"
        echo "  • ${COMMIT_COUNT} commits"
        echo "  • ~150+ files"
        echo "  • Complete working project"
        echo "  • Full documentation"
        echo "  • CTF platform (16 challenges)"
        echo "  • Session management fixes"
        echo ""
        echo "═══════════════════════════════════════════════════════════════════"
        echo ""
    else
        print_error "Push failed!"
        echo ""
        echo "Common issues:"
        echo ""
        echo "1. Invalid Token"
        echo "   → Create new token: https://github.com/settings/tokens/new"
        echo "   → Make sure it has 'repo' scope"
        echo ""
        echo "2. Repository Not Found"
        echo "   → Make sure repository exists: ${REPO_URL}"
        echo "   → Check you're logged in as ${REPO_OWNER}"
        echo ""
        echo "3. Permission Denied"
        echo "   → Token needs 'repo' scope"
        echo "   → You must have write access to the repository"
        echo ""
        echo "4. Network Issues"
        echo "   → Check your internet connection"
        echo "   → Try again in a few moments"
        echo ""
        exit 1
    fi
}

# ==============================================================================
# Main Script
# ==============================================================================

print_header
check_token
push_to_github

exit 0
