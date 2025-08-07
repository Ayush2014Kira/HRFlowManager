#!/bin/bash

echo "🚀 HRMS Vercel Deployment Script"
echo "================================="

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project
echo "📦 Building the project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Set environment variables:"
echo "   - DATABASE_URL (required)"
echo "   - SESSION_SECRET (required)"
echo "   - OPENAI_API_KEY (optional)"
echo "   - SENDGRID_API_KEY (optional)"
echo "3. Test your app with admin/admin123"
echo ""
echo "🎉 Your HRMS is now live!"