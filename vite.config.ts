import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/@react-three')) return 'react-three';
          if (id.includes('node_modules/antd') || id.includes('node_modules/@ant-design')) return 'antd';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react-vendor';
          if (id.includes('node_modules/react')) return 'react-vendor';
          if (id.includes('node_modules/remotion')) return 'remotion';
        },
      },
    },
    chunkSizeWarningLimit: 800,
    sourcemap: false,
  },
  assetsInclude: ['**/*.glb'],
  // GitHub Pages 部署基础路径（如需要，取消注释并修改）
  // base: '/your-repo-name/',
});
