#!/bin/bash

# ==============================================================================
# CYBERGUARD X - Interactive GitHub Push
# ==============================================================================
# This script will prompt you for your GitHub token and push automatically
# ==============================================================================

clear

echo "═══════════════════════════════════════════════════════════════════"
echo "  🚀 CYBERGUARD X - Interactive GitHub Push"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Repository: https://github.com/rayyancyber/cyberagentic-guard"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check if repository exists
cd /home/reyan/Downloads/backend-haven-hub-main || {
    echo "❌ Error: Project directory not found!"
    exit 1
}

# Show what will be pushed
COMMIT_COUNT=$(git rev-list --count HEAD)
echo "📊 Ready to push:"
echo "   • ${COMMIT_COUNT} commits"
echo "   • Complete CYBERGUARD X project"
echo "   • ~150+ files"
echo ""

# Show last 3 commits
echo "📝 Last 3 commits:"
git log --oneline -3 | sed 's/^/   /'
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "🔑 GitHub Authentication Required"
echo ""
echo "Choose your method:"
echo ""
echo "  1) Personal Access Token (Recommended)"
echo "  2) GitHub CLI (gh auth)"
echo "  3) SSH Key"
echo "  4) Manual git push (you handle auth)"
echo ""
read -p "Enter choice (1-4): " choice
echo ""

case $choice in
    1)
        echo "═══════════════════════════════════════════════════════════════════"
        echo "  🔑 Personal Access Token"
        echo "═══════════════════════════════════════════════════════════════════"
        echo ""
        echo "📝 Steps to create a token:"
        echo ""
        echo "   1. Open: https://github.com/settings/tokens/new"
        echo "   2. Token name: cyberagentic-guard-push"
        echo "   3. Expiration: 90 days (or custom)"
        echo "   4. Select scope: ✅ repo"
        echo "   5. Click 'Generate token'"
        echo "   6. Copy the token (starts with ghp_)"
        echo ""
        echo "═══════════════════════════════════════════════════════════════════"
        echo ""
        read -p "Paste your GitHub token here: " TOKEN
        echo ""
        
        if [ -z "$TOKEN" ]; then
            echo "❌ Error: Token cannot be empty!"
            exit 1
        fi
        
        if [[ ! $TOKEN == ghp_* ]] && [[ ! $TOKEN == github_pat_* ]]; then
            echo "⚠️  Warning: Token doesn't look like a GitHub token"
            echo "   (should start with ghp_ or github_pat_)"
            echo ""
            read -p "Continue anyway? (y/n): " confirm
            if [[ ! $confirm =~ ^[Yy]$ ]]; then
                echo "Cancelled."
                exit 0
            fi
        fi
        
        echo "🚀 Pushing to GitHub..."
        echo ""
        
        git push "https://${TOKEN}@github.com/rayyancyber/cyberagentic-guard.git" master
        
        RESULT=$?
        echo ""
        
        if [ $RESULT -eq 0 ]; then
            echo "═══════════════════════════════════════════════════════════════════"
            echo "  ✅ SUCCESS! Project pushed to GitHub!"
            echo "═══════════════════════════════════════════════════════════════════"
            echo ""
            echo "🌐 View your project:"
            echo "   https://github.com/rayyancyber/cyberagentic-guard"
            echo ""
            echo "🎉 Your cybersecurity training platform is now live!"
            echo ""
        else
            echo "❌ Push failed!"
            echo ""
            echo "Possible reasons:"
            echo "  • Invalid token"
            echo "  • Token missing 'repo' scope"
            echo "  • Repository doesn't exist"
            echo "  • Network issues"
            echo ""
            echo "💡 Try creating a new token with 'repo' scope:"
            echo "   https://github.com/settings/tokens/new"
        fi
        ;;
        
    2)
        echo "═══════════════════════════════════════════════════════════════════"
        echo "  🔑 GitHub CLI Authentication"
        echo "═══════════════════════════════════════════════════════════════════"
        echo ""
        
        # Check if gh is installed
        if ! command -v gh &> /dev/null; then
            echo "❌ GitHub CLI (gh) is not installed!"
            echo ""
            echo "Install it:"
            echo "  Ubuntu/Debian: sudo apt install gh"
            echo "  Arch Linux: sudo pacman -S github-cli"
            echo "  Or download: https://cli.github.com/"
            echo ""
            exit 1
        fi
        
        echo "🔐 Starting GitHub CLI authentication..."
        echo ""
        gh auth login
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🚀 Pushing to GitHub..."
            echo ""
            git push -u origin master
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "✅ SUCCESS! Project pushed to GitHub!"
                echo ""
                echo "🌐 View at: https://github.com/rayyancyber/cyberagentic-guard"
            fi
        else
            echo "❌ Authentication failed!"
        fi
        ;;
        
    3)
        echo "═══════════════════════════════════════════════════════════════════"
        echo "  🔑 SSH Key Authentication"
        echo "═══════════════════════════════════════════════════════════════════"
        echo ""
        
        # Check if SSH key exists
        if [ ! -f ~/.ssh/id_ed25519.pub ] && [ ! -f ~/.ssh/id_rsa.pub ]; then
            echo "⚠️  No SSH key found!"
            echo ""
            read -p "Generate SSH key now? (y/n): " gen_key
            
            if [[ $gen_key =~ ^[Yy]$ ]]; then
                echo ""
                read -p "Enter your email: " email
                ssh-keygen -t ed25519 -C "$email"
                echo ""
                echo "📋 Your public key:"
                cat ~/.ssh/id_ed25519.pub
                echo ""
                echo "Add this key to GitHub:"
                echo "https://github.com/settings/keys"
                echo ""
                read -p "Press Enter after adding key to GitHub..."
            else
                exit 0
            fi
        fi
        
        echo "⚙️  Configuring remote for SSH..."
        git remote remove origin 2>/dev/null
        git remote add origin git@github.com:rayyancyber/cyberagentic-guard.git
        
        echo ""
        echo "🚀 Pushing to GitHub..."
        echo ""
        
        git push -u origin master
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ SUCCESS! Project pushed to GitHub!"
            echo ""
            echo "🌐 View at: https://github.com/rayyancyber/cyberagentic-guard"
        fi
        ;;
        
    4)
        echo "═══════════════════════════════════════════════════════════════════"
        echo "  🔧 Manual Push"
        echo "═══════════════════════════════════════════════════════════════════"
        echo ""
        echo "Running: git push -u origin master"
        echo ""
        echo "You'll be prompted for:"
        echo "  Username: rayyancyber"
        echo "  Password: [Your GitHub Personal Access Token]"
        echo ""
        echo "Note: Use your token, not your GitHub password!"
        echo ""
        read -p "Press Enter to continue..."
        echo ""
        
        git push -u origin master
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ SUCCESS! Project pushed to GitHub!"
            echo ""
            echo "🌐 View at: https://github.com/rayyancyber/cyberagentic-guard"
        fi
        ;;
        
    *)
        echo "❌ Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════════"
