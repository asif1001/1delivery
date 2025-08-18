# Deploy Oil Delivery App to GitHub Pages

## Quick Setup Commands for GitHub Codespaces

### Step 1: Setup New Repository
```bash
# In your Codespaces terminal
git clone https://github.com/asif1001/delivery.git
cd delivery

# Copy your current app
git remote add source https://github.com/asif1001/oil-delivery-app.git
git fetch source
git pull source main --allow-unrelated-histories
```

### Step 2: Install GitHub Pages Dependencies
```bash
npm install --save-dev gh-pages
```

### Step 3: Create Required Files

**Create `.github/workflows/deploy.yml`:**
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

**Update `vite.config.ts`:**
```typescript
export default defineConfig({
  base: '/delivery/',
  // ... rest of config
})
```

**Update `package.json` scripts:**
```json
{
  "scripts": {
    "build": "vite build",
    "deploy": "gh-pages -d dist"
  }
}
```

### Step 4: Deploy Commands
```bash
# Build and deploy
npm run build
npm run deploy

# Or push to trigger GitHub Actions
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### Step 5: GitHub Settings
1. Go to: `https://github.com/asif1001/delivery/settings/pages`
2. Set Source to "GitHub Actions"
3. Add Firebase secrets in Repository Settings > Secrets

Your app will be live at: `https://asif1001.github.io/delivery/`

## Important: Frontend-Only Deployment
Since GitHub Pages only hosts static sites, this deploys your React frontend only. The backend functionality uses Firebase services (Firestore, Auth, Storage) which work perfectly with static hosting.