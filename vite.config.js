import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import path from 'path';

export default defineConfig({
  plugins: [ createVuePlugin({ vueTemplateOptions: {
    compilerOptions: {
      whitespace: "condense",
      isCustomElement: tag =>
        tag === "add-item" ||
        tag === "collapsible-panel" ||
        tag === "item-property-field" ||
        tag === "picture-box" ||
        tag === "picture-frame"
    }
  } }) ],
  server: {
    port: 8080
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      }
    ]
  },
  build: {
    chunkSizeWarningLimit: 600,
    cssCodeSplit: false
  }
});