# Deploy React App from GitHub Codespaces

## Problem: GitHub Pages shows README instead of your oil delivery app

## Solution: Create proper deployment workflow in Codespaces

### Step 1: Open GitHub Codespaces
- Go to: https://github.com/asif1001/delivery
- Click "Code" → "Codespaces" → "Create codespace on main"

### Step 2: Create Deployment Workflow (Run in Codespaces terminal)

```bash
# Remove any existing corrupted files
rm -rf .github

# Create proper workflow directory
mkdir -p .github/workflows

# Create the deployment workflow file
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy React App to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      pages: write
      id-token: write
    
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build React app
      run: npm run build
      env:
        VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
        VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
        VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
    
    - name: Setup Pages
      uses: actions/configure-pages@v4
    
    - name: Upload build artifacts
      uses: actions/upload-pages-artifact@v3
      with:
        path: ./dist
    
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
EOF

# Update vite config for GitHub Pages
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/delivery/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './client/index.html'
    }
  }
})
EOF

# Update package.json build script
npm pkg set scripts.build="vite build"

# Commit and push changes
git add .
git commit -m "Setup React app deployment to GitHub Pages"
git push origin main
```

### Step 3: Enable GitHub Pages
1. Go to: https://github.com/asif1001/delivery/settings/pages
2. Under "Source", select "GitHub Actions"
3. Save settings

### Step 4: Monitor Deployment
1. Go to: https://github.com/asif1001/delivery/actions
2. Watch for the deployment workflow to complete (takes 2-3 minutes)
3. Your oil delivery app will be live at: https://asif1001.github.io/delivery/

### Important Notes:
- Your Firebase secrets are already configured correctly
- This will deploy your complete React app with login page
- The app includes all your features: complaint management, photo upload, etc.
- Once deployed, users can log in with the Firebase credentials