import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(__filename, '..');
const rootDir = path.resolve(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version || '1.0.0';

const args = process.argv.slice(2);
const targetArg = args.find((a) => a.startsWith('--target='));
const selectedTarget = targetArg ? targetArg.split('=')[1].toLowerCase() : 'chrome';

function packageSourceCode(rootDir, extName) {
  const sourceZip = path.resolve(rootDir, `${extName}-source-code.zip`);
  if (fs.existsSync(sourceZip)) fs.unlinkSync(sourceZip);

  const candidateItems = [
    'src',
    'public',
    'scripts',
    'manifest.json',
    'package.json',
    'tsconfig.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'vite.config.ts',
    'BUILD.md'
  ];

  const existingItems = candidateItems.filter((item) => fs.existsSync(path.resolve(rootDir, item)));

  console.log(`\n📦 Step 3: Packaging clean source code archive for Mozilla AMO reviewers...`);
  try {
    execSync(`tar -a -c -f "${sourceZip}" ${existingItems.join(' ')}`, { cwd: rootDir, stdio: 'inherit' });
    const stats = fs.statSync(sourceZip);
    console.log(`✅ Success! Created source code archive: ${path.basename(sourceZip)} (${(stats.size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`⚠️ Failed to create source zip:`, err);
  }
}

function packageTarget(target) {
  const isFirefox = target === 'firefox';
  const distDirName = isFirefox ? 'dist-firefox' : 'dist';
  const distDir = path.resolve(rootDir, distDirName);
  const zipName = isFirefox ? `echoscope-firefox-v${version}.zip` : `echoscope-edge-v${version}.zip`;
  const zipFile = path.resolve(rootDir, zipName);

  console.log(`\n======================================================`);
  console.log(`📦 Packaging EchoScope for [${isFirefox ? 'FIREFOX (AMO)' : 'MICROSOFT EDGE / CHROME'}]`);
  console.log(`======================================================`);

  console.log(`🚀 Step 1: Building ${distDirName}...`);
  execSync(`node scripts/build.js --target=${target}`, { cwd: rootDir, stdio: 'inherit' });

  if (!fs.existsSync(distDir)) {
    console.error(`❌ Directory ${distDirName} not found!`);
    process.exit(1);
  }

  if (fs.existsSync(zipFile)) {
    fs.unlinkSync(zipFile);
  }

  console.log(`🤐 Step 2: Compressing ${distDirName} into ${zipName}...`);
  try {
    execSync(`tar -a -c -f "${zipFile}" *`, { cwd: distDir, stdio: 'inherit' });
  } catch (_e) {
    if (process.platform === 'win32') {
      const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipFile}' -Force"`;
      execSync(psCommand, { stdio: 'inherit' });
    } else {
      execSync(`cd "${distDir}" && zip -r "${zipFile}" .`, { stdio: 'inherit' });
    }
  }

  const stats = fs.statSync(zipFile);
  console.log(`✅ Success! Packaged ${zipName} (${(stats.size / 1024).toFixed(1)} KB) ready for upload!`);

  if (isFirefox) {
    packageSourceCode(rootDir, 'echoscope');
  }
}

if (selectedTarget === 'all') {
  packageTarget('chrome');
  packageTarget('firefox');
} else if (selectedTarget === 'firefox') {
  packageTarget('firefox');
} else {
  packageTarget('chrome');
}
