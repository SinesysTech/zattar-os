const { spawn } = require('child_process');

const env = {
  ...process.env,
  NODE_OPTIONS: [
    '--max-old-space-size=2048',
    '--trace-gc'
  ].join(' '),
};

const proc = spawn(
  process.execPath,
  [require.resolve('next/dist/bin/next'), 'build', '--turbopack'],
  { stdio: 'inherit', env }
);

proc.on('exit', (code) => process.exit(code ?? 1));
