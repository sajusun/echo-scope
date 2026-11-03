import { build } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

const rootDir = process.cwd();

// Parse target from CLI: --target=chrome (default) | --target=firefox | --target=all
const args = process.argv.slice(2);
const targetArg = args.find((a) => a.startsWith('--target='));
const selectedTarget = targetArg ? targetArg.split('=')[1].toLowerCase() : 'chrome';

async function buildTarget(target) {
  const isFirefox = target === 'firefox';
  const outDirName = isFirefox ? 'dist-firefox' : 'dist';
  const outDir = resolve(rootDir, outDirName);

  console.log(`\n======================================================`);
  console.log(`🚀 Building EchoScope for [${isFirefox ? 'FIREFOX (Gecko MV3)' : 'EDGE / CHROME (Chromium MV3)'}]`);
  console.log(`📁 Target directory: ./${outDirName}`);
  console.log(`======================================================\n`);

  // Step 1: Clean target output directory
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  // Step 2: Build Popup HTML
  console.log('📦 Step 1: Building EchoScope Popup HTML...');
  await build({
    configFile: false,
    base: '',
    build: {
      outDir: outDirName,
      emptyOutDir: false,
      rollupOptions: {
        input: {
          popup: resolve(rootDir, 'src/popup/popup.html')
        }
      }
    }
  });

  // Step 3: Build Background Script
  console.log('⚙️ Step 2: Building Background Script (ES Module)...');
  await build({
    configFile: false,
    build: {
      outDir: outDirName,
      emptyOutDir: false,
      lib: {
        entry: resolve(rootDir, 'src/background/index.ts'),
        formats: ['es'],
        fileName: () => 'background.js'
      }
    }
  });

  // Step 4: Manifest Transformation
  console.log(`📋 Step 3: Configuring ${isFirefox ? 'Firefox Manifest V3' : 'Chromium Manifest V3'}...`);
  const manifestRaw = fs.readFileSync(resolve(rootDir, 'manifest.json'), 'utf-8');
  const manifest = JSON.parse(manifestRaw);

  if (isFirefox) {
    // Firefox AMO requires name <= 45 characters
    if (manifest.name && manifest.name.length > 45) {
      manifest.name = 'EchoScope - WebSocket & Reverb Inspector';
    }
    // Firefox MV3 uses scripts array (Event Page) for maximum stability
    manifest.background = {
      scripts: ['background.js'],
      type: 'module'
    };
    // Firefox AMO requires browser_specific_settings with unique gecko ID and data consent
    manifest.browser_specific_settings = {
      gecko: {
        id: 'echoscope@sajusun.github.io',
        strict_min_version: '142.0',
        data_collection_permissions: {
          required: ['none']
        }
      }
    };
  } else {
    // Edge & Chrome use service_worker
    manifest.background = {
      service_worker: 'background.js',
      type: 'module'
    };
    // Clean up browser_specific_settings for Edge/Chrome if present
    delete manifest.browser_specific_settings;
  }

  fs.writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  // Step 5: Copy Icons
  const iconsSrc = resolve(rootDir, 'public/icons');
  const iconsDist = resolve(outDir, 'icons');
  if (fs.existsSync(iconsSrc)) {
    fs.cpSync(iconsSrc, iconsDist, { recursive: true });
  }

  console.log(`✅ Build completed! Load unpacked from ./${outDirName}`);
}

async function main() {
  if (selectedTarget === 'all') {
    await buildTarget('chrome');
    await buildTarget('firefox');
  } else if (selectedTarget === 'firefox') {
    await buildTarget('firefox');
  } else {
    await buildTarget('chrome');
  }
}

main().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
