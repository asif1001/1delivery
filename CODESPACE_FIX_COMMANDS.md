# GitHub Codespaces Commands to Fix Deployment

## Your secrets are set correctly! Now run these commands in GitHub Codespaces:

### Step 1: Open GitHub Codespaces
Go to: https://github.com/asif1001/delivery
Click "Code" → "Codespaces" → "Create codespace on main"

### Step 2: Run These Commands in Codespaces Terminal

**Create the deployment workflow:**
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
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm run build
      env:
        VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
        VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
        VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
    - uses: actions/configure-pages@v4
    - uses: actions/upload-pages-artifact@v3
      with:
        path: ./dist
    - uses: actions/deploy-pages@v4
EOF
```

**Update vite.config.ts:**
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

**Update package.json build script:**
```bash
npm pkg set scripts.build="vite build"
```

**Commit and push to trigger deployment:**
```bash
git add .
git commit -m "Setup GitHub Pages deployment with Firebase secrets"
git push origin main
```

### Step 3: Enable GitHub Pages
1. Go to: https://github.com/asif1001/delivery/settings/pages
2. Under "Source", select "GitHub Actions"
3. Save

### Step 4: Monitor Deployment
1. Go to: https://github.com/asif1001/delivery/actions
2. Watch the deployment progress
3. Your app will be live at: https://asif1001.github.io/delivery/

All your Firebase secrets are configured correctly. Just run these commands in Codespaces to complete the deployment!