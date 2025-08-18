# Fix GitHub Pages 404 Error

## Problem: 
GitHub Pages is not configured yet, showing 404 error.

## Solution: Setup GitHub Pages in Codespaces

### Step 1: Open GitHub Codespaces
1. Go to: https://github.com/asif1001/delivery
2. Click the green "Code" button
3. Click "Codespaces" tab
4. Click "Create codespace on main"

### Step 2: Create Required Files in Codespaces

**Create `.github/workflows/deploy.yml`:**
```bash
mkdir -p .github/workflows
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
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build for production
      run: npm run build
      env:
        VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
        VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
    
    - name: Setup Pages
      uses: actions/configure-pages@v4
    
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: ./dist
    
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
EOF
```

**Update `vite.config.ts`:**
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
    sourcemap: true,
    rollupOptions: {
      input: './client/index.html'
    }
  }
})
EOF
```

**Update `package.json` scripts:**
```bash
npm pkg set scripts.build="vite build"
npm pkg set scripts.preview="vite preview"
npm pkg set scripts.deploy="gh-pages -d dist"
```

### Step 3: Commit and Push Changes
```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### Step 4: Enable GitHub Pages
1. Go to: https://github.com/asif1001/delivery/settings/pages
2. Under "Source", select "GitHub Actions"
3. Save the settings

### Step 5: Add Firebase Secrets
1. Go to: https://github.com/asif1001/delivery/settings/secrets/actions
2. Add these secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`

### Step 6: Trigger Deployment
Push any change to trigger the deployment:
```bash
echo "# Oil Delivery App" > README.md
git add README.md
git commit -m "Trigger deployment"
git push origin main
```

After this, your app will be live at: https://asif1001.github.io/delivery/