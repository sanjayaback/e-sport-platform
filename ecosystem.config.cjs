module.exports = {
  apps: [
    {
      name: 'kill-pro-esports',
      cwd: __dirname,
      script: '.next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
