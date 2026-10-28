import path from "node:path";

const projectRoot = process.cwd();

export default {
  root: path.resolve(projectRoot, "frontend"),
  build: {
    outDir: path.resolve(projectRoot, "frontend", "dist"),
    emptyOutDir: true
  },
  server: {
    proxy: {
      "/api": "http://localhost:5000"
    }
  }
};
