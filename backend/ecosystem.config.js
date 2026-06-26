module.exports = {
  apps: [
    {
      name: 'fuelcore-api',
      script: 'dist/server.js',
      cwd: '/app/backend',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/fuelcore/error.log',
      out_file: '/var/log/fuelcore/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      restart_delay: 2000,
      max_restarts: 10,
      autorestart: true,
      exp_backoff_restart_delay: 100,
    },
  ],
};
