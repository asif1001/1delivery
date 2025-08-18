# GitHub Codespaces Setup for Oil Delivery App

## Setup Instructions for New "delivery" Repository

### Step 1: Clone Your Current App to the New Repository

In your GitHub Codespaces terminal, run:

```bash
# Clone the new empty repository
git clone https://github.com/asif1001/delivery.git
cd delivery

# Add your oil-delivery-app as a remote source
git remote add source https://github.com/asif1001/oil-delivery-app.git
git fetch source

# Copy all files from the source repository
git pull source main --allow-unrelated-histories

# Push to your new delivery repository
git push origin main
```

### Step 2: Required Folder Structure for GitHub Pages

Since your app is a full-stack React application, you need to modify the structure for GitHub Pages deployment:

```
delivery/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions for deployment
├── client/                     # Your React frontend (current structure)
├── server/                     # Your Express backend (current structure)
├── public/                     # Static assets
├── docs/                       # GitHub Pages will serve from here
├── package.json
├── vite.config.ts
└── deploy-gh-pages.js          # Custom deploy script
```

### Step 3: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
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
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Step 4: Update package.json Scripts

Add these scripts to your package.json:

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist",
    "predeploy": "npm run build"
  }
}
```

### Step 5: Update vite.config.ts for GitHub Pages

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/delivery/', // Your repository name
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
```

### Step 6: GitHub Repository Settings

1. Go to your GitHub repository: `https://github.com/asif1001/delivery`
2. Click **Settings** tab
3. Scroll to **Pages** section
4. Set **Source** to "GitHub Actions"
5. Add these **Repository Secrets**:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`

### Step 7: Commands to Run in Codespaces

```bash
# Install dependencies
npm install

# Install gh-pages for deployment
npm install --save-dev gh-pages

# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### Important Notes for Full-Stack to Static Conversion

Since GitHub Pages only hosts static sites, you'll need to:

1. **Frontend Only**: Deploy only the React frontend
2. **Backend Services**: Use Firebase for all backend functionality
3. **Database**: Use Firebase Firestore exclusively
4. **Authentication**: Use Firebase Auth (already implemented)
5. **File Storage**: Use Firebase Storage (already implemented)

### Alternative: Separate Frontend/Backend Deployment

If you want to keep the full-stack architecture:

1. **Frontend**: Deploy to GitHub Pages
2. **Backend**: Deploy to:
   - Railway.app
   - Render.com
   - Vercel (serverless functions)
   - Netlify (serverless functions)

Your app URL will be: `https://asif1001.github.io/delivery/`