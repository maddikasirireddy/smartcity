import { defineConfig } from 'vite';

export default defineConfig({
  // Expose both VITE_ prefixed variables and HF_TOKEN to the frontend
  envPrefix: ['VITE_', 'HF_TOKEN'],
});
