module.exports = {
  apps: [
    {
      name: "abdimas-backend",
      cwd: "./apps/backend",
      script: "./dist/index.js",
      interpreter: "node",
      node_args: "--import tsx --experimental-specifier-resolution=node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        BACKEND_URL: "https://api.example.com",
      },
    },
  ],
};
