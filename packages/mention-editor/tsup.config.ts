import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  onSuccess: async () => {
    const fs = require("fs");
    const path = require("path");
    fs.copyFileSync(
      path.join(__dirname, "src/styles.css"),
      path.join(__dirname, "dist/styles.css")
    );
  },
});
