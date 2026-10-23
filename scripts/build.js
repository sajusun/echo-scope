import { build } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

async function runBuild() {
  const rootDir = process.cwd();
  const distDir = resolve(rootDir, 'dist');

  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  console.log('📦 Step 1: Building EchoScope Popup HTML...');
  await build({
    configFile: false,
    base: '',
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: {
          popup: resolve(rootDir, 'src/popup/popup.html')
        }
      }
    }
  });

  console.log('⚙️ Step 2: Building Background Service Worker (ES Module)...');
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve(rootDir, 'src/background/index.ts'),
        formats: ['es'],
        fileName: () => 'background.js'
      }
    }
  });

  console.log('📋 Step 3: Copying Manifest and Icons...');
  const manifest = fs.readFileSync(resolve(rootDir, 'manifest.json'), 'utf-8');
  fs.writeFileSync(resolve(distDir, 'manifest.json'), manifest);

  const iconsSrc = resolve(rootDir, 'public/icons');
  const iconsDist = resolve(distDir, 'icons');
  if (fs.existsSync(iconsSrc)) {
    fs.cpSync(iconsSrc, iconsDist, { recursive: true });
  }

  console.log('✅ EchoScope build completed successfully! Load unpacked from ./dist');
}

runBuild().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
