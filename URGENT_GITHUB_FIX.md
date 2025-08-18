# URGENT: Fix GitHub Pages Deployment

## Problem: 
GitHub Pages is showing README instead of your React app.

## Solution: Create deployment files in GitHub Codespaces

### Step 1: Open GitHub Codespaces NOW
1. Go to: https://github.com/asif1001/delivery
2. Click green "Code" button
3. Click "Codespaces" tab  
4. Click "Create codespace on main"

### Step 2: Copy-Paste These Commands (ONE BY ONE)

**Command 1 - Create deployment workflow:**
```bash
mkdir -p .github/workflows
```

**Command 2 - Create the deployment file:**
```bash
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      pages: write
      id-token: write
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
        VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
        VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
    
    - name: Setup Pages
      uses: actions/configure-pages@v4
    
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: ./dist
    
    - name: Deploy to GitHub Pages
      uses: actions/deploy-pages@v4
EOF
```

**Command 3 - Update vite config:**
```bash
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
```

**Command 4 - Update package.json:**
```bash
npm pkg set scripts.build="vite build"
```

**Command 5 - Commit and push:**
```bash
git add .
git commit -m "Setup GitHub Pages deployment for React app"
git push origin main
```

### Step 3: Enable GitHub Pages
1. Go to: https://github.com/asif1001/delivery/settings/pages
2. Under "Source", select "GitHub Actions" (NOT Deploy from branch)
3. Save settings

### Step 4: Wait and Check
1. Go to: https://github.com/asif1001/delivery/actions  
2. Wait for green checkmark (2-3 minutes)
3. Your oil delivery app will be live at: https://asif1001.github.io/delivery/

This will deploy your complete React oil delivery app with Firebase!