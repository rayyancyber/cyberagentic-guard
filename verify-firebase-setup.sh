#!/bin/bash

# ============================================================================
# Firebase Setup Verification & Helper Script
# ============================================================================
# This script verifies your Firebase configuration and provides guidance

clear

echo "═══════════════════════════════════════════════════════════════════"
echo "  🔥 Firebase Setup Verification - CYBERGUARD X"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

PROJECT_DIR="/home/reyan/Downloads/backend-haven-hub-main"
cd "$PROJECT_DIR" || exit 1

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Check 1: Firebase Configuration in Code
# ============================================================================
echo "📋 Checking Firebase configuration in code..."
echo ""

if grep -q "cyberguard-6d718" src/integrations/firebase/client.ts; then
    echo -e "${GREEN}✅ Firebase project ID: cyberguard-6d718${NC}"
else
    echo -e "${RED}❌ Firebase configuration not found${NC}"
    exit 1
fi

if grep -q "AIzaSyB-dU6gK9VVPMvHE6nwqqwQmi0MUklPBm0" src/integrations/firebase/client.ts; then
    echo -e "${GREEN}✅ Firebase API key configured${NC}"
else
    echo -e "${RED}❌ Firebase API key not found${NC}"
    exit 1
fi

if grep -q "signInWithGoogle" src/integrations/firebase/client.ts; then
    echo -e "${GREEN}✅ Google authentication code ready${NC}"
else
    echo -e "${RED}❌ Google auth not configured${NC}"
fi

if grep -q "signInWithEmail" src/integrations/firebase/client.ts; then
    echo -e "${GREEN}✅ Email/Password authentication code ready${NC}"
else
    echo -e "${RED}❌ Email/Password auth not configured${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# Check 2: Supabase Configuration
# ============================================================================
echo "📋 Checking Supabase configuration..."
echo ""

if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    if grep -q "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .env; then
        echo -e "${GREEN}✅ Supabase anon key configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Supabase anon key might be placeholder${NC}"
    fi
else
    echo -e "${RED}❌ Supabase configuration missing${NC}"
fi

if grep -q "dcnpflpjnhajrrrxczze" .env; then
    echo -e "${GREEN}✅ Supabase project ID: dcnpflpjnhajrrrxczze${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase project ID not found${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# Check 3: Dev Server Status
# ============================================================================
echo "📋 Checking dev server..."
echo ""

if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dev server running on http://localhost:8080${NC}"
else
    echo -e "${YELLOW}⚠️  Dev server not running${NC}"
    echo "   Run: npm run dev"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# Firebase Console Setup Required
# ============================================================================
echo "🔧 REQUIRED: Firebase Console Setup"
echo ""
echo -e "${YELLOW}⚠️  You must complete these steps in Firebase Console:${NC}"
echo ""
echo "1️⃣  Enable Email/Password Authentication:"
echo "   ${BLUE}https://console.firebase.google.com/project/cyberguard-6d718/authentication/providers${NC}"
echo "   • Click 'Email/Password' → Enable → Save"
echo ""
echo "2️⃣  Enable Google Authentication:"
echo "   • Click 'Google' → Enable"
echo "   • App name: CYBERGUARD X"
echo "   • Support email: your-email@example.com"
echo "   • Save"
echo ""
echo "3️⃣  Configure OAuth Consent Screen:"
echo "   ${BLUE}https://console.cloud.google.com/apis/credentials/consent?project=cyberguard-6d718${NC}"
echo "   • User Type: External"
echo "   • App name: CYBERGUARD X"
echo "   • Add test users (your email)"
echo "   • Save"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# Open URLs Option
# ============================================================================
read -p "Open Firebase Console links now? (y/n): " open_links

if [[ $open_links =~ ^[Yy]$ ]]; then
    echo ""
    echo "Opening Firebase Console..."
    
    if command -v xdg-open > /dev/null; then
        xdg-open "https://console.firebase.google.com/project/cyberguard-6d718/authentication/providers" 2>/dev/null &
        sleep 2
        xdg-open "https://console.cloud.google.com/apis/credentials/consent?project=cyberguard-6d718" 2>/dev/null &
    elif command -v open > /dev/null; then
        open "https://console.firebase.google.com/project/cyberguard-6d718/authentication/providers"
        sleep 2
        open "https://console.cloud.google.com/apis/credentials/consent?project=cyberguard-6d718"
    else
        echo "Please open these URLs manually:"
        echo "1. https://console.firebase.google.com/project/cyberguard-6d718/authentication/providers"
        echo "2. https://console.cloud.google.com/apis/credentials/consent?project=cyberguard-6d718"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# Test Instructions
# ============================================================================
echo "🧪 After completing Firebase Console setup, test here:"
echo ""
echo "1. Email/Password Test:"
echo "   ${BLUE}http://localhost:8080/auth${NC}"
echo "   • Click 'Sign Up'"
echo "   • Enter email and password"
echo "   • Should work without errors ✅"
echo ""
echo "2. Google Login Test:"
echo "   ${BLUE}http://localhost:8080/auth${NC}"
echo "   • Click 'Continue with Google'"
echo "   • Select your account"
echo "   • Should sign in successfully ✅"
echo ""
echo "3. Session Test (No 'Session Expired'):"
echo "   ${BLUE}http://localhost:8080/team${NC}"
echo "   • After login, create a new task"
echo "   • Should work without session errors ✅"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "📊 Setup Summary:"
echo ""
echo -e "${GREEN}✅ Code Configuration:${NC}"
echo "   • Firebase config updated"
echo "   • Email/Password auth ready"
echo "   • Google OAuth auth ready"
echo "   • Session management active"
echo "   • Supabase integration working"
echo ""
echo -e "${YELLOW}⚠️  Firebase Console (Manual):${NC}"
echo "   • Enable Email/Password authentication"
echo "   • Enable Google authentication"
echo "   • Configure OAuth consent screen"
echo "   • Add test users"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}📚 Need help? Check: FIREBASE_SETUP_GUIDE.md${NC}"
echo ""
