const { spawn } = require('child_process');

const env = { ...process.env, ANALYZE: 'true' };

const proc = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'build', '--turbopack'],
  { stdio: 'inherit', env }
);

proc.on('exit', (code) => process.exit(code ?? 1));
