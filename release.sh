#!/bin/bash
# Release Script for RetailManager v1.1.0
# This script commits all changes and creates a version tag

set -e  # Exit on error

echo "🚀 RetailManager v1.1.0 Release Script"
echo "======================================"
echo ""

# Check if on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "⚠️  Warning: You are on branch '$BRANCH', not 'main'"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Show status
echo "📋 Current Git Status:"
git status --short
echo ""

# Confirm
read -p "🤔 Ready to commit and tag v1.1.0? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
fi

echo ""
echo "📦 Step 1: Adding all changes..."
git add .

echo "✍️  Step 2: Committing..."
git commit -m "feat: comprehensive French error handling and data protection

Major Features:
- Add French error messages for all modules (Inventory, Client, Invoice, PDF)
- Implement delete protection for products/clients in use
- Add comprehensive invoice item validation
- Improve PDF view/print cross-platform support
- Add manual error dismissal with success auto-fade
- Fix duplicate ICE and reference detection
- Add year validation for invoices

Technical Improvements:
- Add Windows metadata for professional exe display
- Remove debug print statements
- Update version to 1.1.0
- Add CHANGELOG.md for version tracking
- Improve error UX with dismissable alerts

Bug Fixes:
- Fix intermittent product creation errors (duplicate detection)
- Fix PDF buttons not working on Linux
- Fix error messages auto-dismissing too quickly"

echo "🏷️  Step 3: Creating version tag..."
git tag -a v1.1.0 -m "Version 1.1.0 - French Error Handling & Data Protection

This release focuses on comprehensive error handling and data integrity:

New Features:
✅ All error messages in French
✅ Data loss prevention (delete protection)
✅ Advanced invoice validation
✅ Better PDF error messages
✅ Manual error dismissal
✅ Success notifications
✅ Windows professional appearance

What Changed:
- Errors stay until manually dismissed (× button)
- Success messages auto-fade (3 seconds)
- Cross-platform PDF support
- Proper Windows exe metadata

For full details, see CHANGELOG.md"

echo ""
echo "✅ Successfully committed and tagged!"
echo ""
echo "📤 Next Steps:"
echo "   1. Push to remote:"
echo "      git push origin main"
echo "      git push origin v1.1.0"
echo ""
echo "   2. Create GitHub Release (if applicable)"
echo "   3. Build Windows executable for client"
echo ""
echo "🎉 Release v1.1.0 ready!"
