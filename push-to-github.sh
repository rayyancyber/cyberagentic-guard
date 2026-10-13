#!/bin/bash

echo "🚀 CyberGuard X - Push to GitHub"
echo "================================"
echo ""

# Check if git user is configured
if ! git config user.name > /dev/null 2>&1; then
    echo "⚠️  Git user not configured. Please run:"
    echo "   git config --global user.name \"Your Name\""
    echo "   git config --global user.email \"your.email@example.com\""
    echo ""
    exit 1
fi

echo "✅ Git user: $(git config user.name) <$(git config user.email)>"
echo ""

# Check if remote exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Remote already configured: $(git remote get-url origin)"
    echo ""
    echo "Pushing to GitHub..."
    git push -u origin master
else
    echo "❌ No remote configured yet"
    echo ""
    echo "Please run these commands:"
    echo ""
    echo "1. Create a repository on GitHub:"
    echo "   https://github.com/new"
    echo ""
    echo "2. Add the remote (replace YOUR_USERNAME):"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/cyberguard-x-platform.git"
    echo ""
    echo "3. Push to GitHub:"
    echo "   git push -u origin master"
    echo ""
    echo "Or use SSH:"
    echo "   git remote add origin git@github.com:YOUR_USERNAME/cyberguard-x-platform.git"
    echo "   git push -u origin master"
fi
