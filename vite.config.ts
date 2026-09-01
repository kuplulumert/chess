import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // The app is served from https://<user>.github.io/chess/, so assets need the
  // repository name as their base path. Override with BASE_PATH when hosting elsewhere.
  base: process.env.BASE_PATH ?? '/chess/',
  plugins: [react()],
})
