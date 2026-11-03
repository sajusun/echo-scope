# EchoScope - Source Build Instructions for Mozilla Reviewers

## Environment Requirements
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Package Manager**: pnpm (v8+ or v9+) or npm

## Step-by-Step Build Instructions

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Build the Firefox Add-on Extension:**
   ```bash
   pnpm run build:firefox
   ```

3. **Verify Output:**
   The exact build output matching the submitted extension will be created in:
   ```text
   ./dist-firefox
   ```

