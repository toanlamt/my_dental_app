import { spawn } from 'node:child_process';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('🚀 Starting Full-Stack Development Environment...');
console.log('📡 API:       http://127.0.0.1:8788 (Cloudflare Pages Functions + D1)');
console.log('💻 Frontend:  http://localhost:5173 (Vite React + HMR)\n');

const apiProcess = spawn(npmCmd, ['run', 'dev:api'], {
  stdio: 'inherit',
  shell: true,
});

const webProcess = spawn(npmCmd, ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

function handleExit(code = 0) {
  if (apiProcess && !apiProcess.killed) apiProcess.kill();
  if (webProcess && !webProcess.killed) webProcess.kill();
  process.exit(code);
}

process.on('SIGINT', () => handleExit(0));
process.on('SIGTERM', () => handleExit(0));
process.on('exit', () => handleExit(0));

apiProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n[dev:api] exited with code ${code}`);
    handleExit(code);
  }
});

webProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n[dev] exited with code ${code}`);
    handleExit(code);
  }
});
