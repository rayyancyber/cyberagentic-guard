#!/bin/bash

# CYBERGUARD X - Push to GitHub Script
# Repository: https://github.com/rayyancyber/cyberagentic-guard

echo "🚀 CYBERGUARD X - GitHub Push"
echo "================================"
echo ""
echo "Repository: https://github.com/rayyancyber/cyberagentic-guard"
echo "Commits ready: 9"
echo ""

cd /home/reyan/Downloads/backend-haven-hub-main

# Check if remote exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Remote configured"
else
    echo "⚠️  Adding remote..."
    git remote add origin https://github.com/rayyancyber/cyberagentic-guard.git
fi

echo ""
echo "Choose authentication method:"
echo ""
echo "1) GitHub CLI (gh auth login)"
echo "2) Personal Access Token"
echo "3) SSH Key"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔐 Using GitHub CLI..."
        gh auth login
        if [ $? -eq 0 ]; then
            echo ""
            echo "📤 Pushing to GitHub..."
            git push -u origin master
        else
            echo "❌ Authentication failed. Try another method."
            exit 1
        fi
        ;;
    2)
        echo ""
        echo "🔑 Using Personal Access Token"
        echo ""
        echo "Get your token from: https://github.com/settings/tokens"
        echo "Scope required: repo"
        echo ""
        read -p "Enter your token: " token
        
        if [ -z "$token" ]; then
            echo "❌ Token cannot be empty"
            exit 1
        fi
        
        echo ""
        echo "⚙️  Configuring remote with token..."
        git remote remove origin 2>/dev/null
        git remote add origin "https://${token}@github.com/rayyancyber/cyberagentic-guard.git"
        
        echo "📤 Pushing to GitHub..."
        git push -u origin master
        
        # Remove token from remote for security
        echo "🔒 Removing token from config..."
        git remote remove origin
        git remote add origin https://github.com/rayyancyber/cyberagentic-guard.git
        ;;
    3)
        echo ""
        echo "🔓 Using SSH Key"
        echo ""
        echo "Make sure your SSH key is added to GitHub:"
        echo "https://github.com/settings/keys"
        echo ""
        
        echo "⚙️  Configuring remote for SSH..."
        git remote remove origin 2>/dev/null
        git remote add origin git@github.com:rayyancyber/cyberagentic-guard.git
        
        echo "📤 Pushing to GitHub..."
        git push -u origin master
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Project pushed to GitHub!"
    echo ""
    echo "🌐 View your project at:"
    echo "   https://github.com/rayyancyber/cyberagentic-guard"
    echo ""
    echo "📊 What was pushed:"
    echo "   • 9 commits"
    echo "   • ~150+ files"
    echo "   • Complete working project"
    echo "   • Full documentation"
    echo ""
    echo "🎉 Your cybersecurity platform is now on GitHub!"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "   • Check your authentication"
    echo "   • Make sure repository exists"
    echo "   • Verify you have push access"
    echo ""
    echo "📚 See GITHUB_PUSH_GUIDE.md for detailed help"
fi
