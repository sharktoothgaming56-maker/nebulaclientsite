const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const installerDir = path.join(rootDir, '..', 'installer_app');
const distDir = path.join(rootDir, 'dist');

console.log("=== Building Main App ===");
cp.execSync('npm run pack', { cwd: rootDir, stdio: 'inherit' });

console.log("=== Copying Payload ===");
const payloadDest = path.join(installerDir, 'payload');
if (fs.existsSync(payloadDest)) {
    fs.rmSync(payloadDest, { recursive: true, force: true });
}
// Windows unpacked dir
const unpackedSrc = path.join(distDir, 'win-unpacked');
fs.cpSync(unpackedSrc, payloadDest, { recursive: true });

console.log("=== Building Custom Setup App ===");
cp.execSync('cmd.exe /c npx electron-builder', { cwd: installerDir, stdio: 'inherit' });

console.log("=== Replacing NSIS Installer with Custom App ===");
// Find the generated portable exe
const installerDistDir = path.join(installerDir, 'dist');
const portableExe = fs.readdirSync(installerDistDir).find(f => f.endsWith('.exe') && !f.includes('builder-effective-config'));

const version = require(path.join(rootDir, 'package.json')).version;
const finalExeName = `SolarClient-Setup-${version}.exe`;
const finalExePath = path.join(distDir, finalExeName);

fs.copyFileSync(path.join(installerDistDir, portableExe), finalExePath);

console.log("=== Generating latest.yml ===");
const fileBuffer = fs.readFileSync(finalExePath);
const hashSum = crypto.createHash('sha512');
hashSum.update(fileBuffer);
const sha512 = hashSum.digest('base64');

const latestYmlContent = `version: ${version}
files:
  - url: ${finalExeName}
    sha512: ${sha512}
    size: ${fileBuffer.length}
path: ${finalExeName}
sha512: ${sha512}
releaseDate: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(distDir, 'latest.yml'), latestYmlContent);

console.log("=== CUSTOM INSTALLER BUILD COMPLETE ===");
