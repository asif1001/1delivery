import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing GitHub Pages deployment...');

// Fix index.html to use relative paths
const indexPath = path.join(__dirname, 'dist/index.html');
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Replace absolute paths with relative paths
  content = content.replace(/href="\/assets\//g, 'href="./assets/');
  content = content.replace(/src="\/assets\//g, 'src="./assets/');
  content = content.replace(/href="\/icon-/g, 'href="./icon-');
  content = content.replace(/href="\/apple-/g, 'href="./apple-');
  
  fs.writeFileSync(indexPath, content);
  console.log('✅ Fixed index.html paths for GitHub Pages');
}

// Copy public assets to dist from both client/public and root public
const distDir = path.join(__dirname, 'dist');

function copyDirFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return false;
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    if (file !== '.nojekyll') {
      const srcPath = path.join(dirPath, file);
      const destPath = path.join(distDir, file);
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch {}
    }
  });
  return true;
}

const copiedClientPublic = copyDirFiles(path.join(__dirname, 'client/public'));
const copiedRootPublic = copyDirFiles(path.join(__dirname, 'public'));
if (copiedClientPublic || copiedRootPublic) {
  console.log('✅ Copied public assets to dist');
}

// Copy 404.html for GitHub Pages SPA support
const notFoundPath = path.join(__dirname, '404.html');
const distNotFoundPath = path.join(distDir, '404.html');
if (fs.existsSync(notFoundPath)) {
  fs.copyFileSync(notFoundPath, distNotFoundPath);
  console.log('✅ Copied 404.html for GitHub Pages SPA support');
}

console.log('🎉 GitHub Pages deployment fixed!');