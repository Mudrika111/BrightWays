const path = require("node:path");

module.exports = {
  root: path.resolve(__dirname, "frontend"),
  build: {
    outDir: path.resolve(__dirname, "frontend", "dist"),
    emptyOutDir: true
  },
  server: {
    proxy: {
      "/api": "http://localhost:5000"
    }
  }
};
