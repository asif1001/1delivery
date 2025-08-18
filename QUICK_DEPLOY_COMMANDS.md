# Quick Deploy Commands for GitHub Codespaces

## Copy-Paste Commands to Fix 404 Error

Open GitHub Codespaces at: https://github.com/asif1001/delivery
Then run these commands:

### 1. Create GitHub Actions Workflow
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
    - uses: actions/configure-pages@v4
    - uses: actions/upload-pages-artifact@v3
      with:
        path: ./dist
    - uses: actions/deploy-pages@v4
EOF
```

### 2. Update Vite Config
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

### 3. Update Package.json
```bash
npm pkg set scripts.build="vite build"
```

### 4. Commit and Push
```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### 5. Manual Steps
1. Go to: https://github.com/asif1001/delivery/settings/pages
2. Set Source to "GitHub Actions"
3. Add Firebase secrets in: https://github.com/asif1001/delivery/settings/secrets/actions

Your app will be live at: https://asif1001.github.io/delivery/