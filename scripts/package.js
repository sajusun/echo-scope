import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(__filename, '..');
const rootDir = path.resolve(__dirname, '..');

// Read version from package.json
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version || '1.0.0';

// Parse target: --target=chrome | --target=firefox | --target=all
const args = process.argv.slice(2);
const targetArg = args.find((a) => a.startsWith('--target='));
const selectedTarget = targetArg ? targetArg.split('=')[1].toLowerCase() : 'chrome';

function packageTarget(target) {
  const isFirefox = target === 'firefox';
  const distDirName = isFirefox ? 'dist-firefox' : 'dist';
  const distDir = path.resolve(rootDir, distDirName);
  const zipName = isFirefox ? `echoscope-firefox-v${version}.zip` : `echoscope-edge-v${version}.zip`;
  const zipFile = path.resolve(rootDir, zipName);

  console.log(`\n======================================================`);
  console.log(`📦 Packaging EchoScope for [${isFirefox ? 'FIREFOX (AMO)' : 'MICROSOFT EDGE / CHROME'}]`);
  console.log(`======================================================`);

  // Build first
  console.log(`🚀 Step 1: Building ${distDirName}...`);
  execSync(`node scripts/build.js --target=${target}`, { cwd: rootDir, stdio: 'inherit' });

  if (!fs.existsSync(distDir)) {
    console.error(`❌ Directory ${distDirName} not found!`);
    process.exit(1);
  }

  // Remove old zip if present
  if (fs.existsSync(zipFile)) {
    fs.unlinkSync(zipFile);
  }

  // Compress
  console.log(`🤐 Step 2: Compressing ${distDirName} into ${zipName}...`);
  const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipFile}' -Force"`;
  execSync(psCommand, { stdio: 'inherit' });

  const stats = fs.statSync(zipFile);
  console.log(`✅ Success! Packaged ${zipName} (${(stats.size / 1024).toFixed(1)} KB) ready for upload!`);
}

if (selectedTarget === 'all') {
  packageTarget('chrome');
  packageTarget('firefox');
} else if (selectedTarget === 'firefox') {
  packageTarget('firefox');
} else {
  packageTarget('chrome');
}

