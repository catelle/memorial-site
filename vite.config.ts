import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Runs the memorial API (server.js) inside the Vite dev/preview server,
 * so `npm run dev` alone gives a working site: tributes, candles, family space.
 * Settings are read from memorial-site/.env (see .env.example).
 */
function memorialApi(env: Record<string, string>): Plugin {
  const mount = async (middlewares: Connect.Server) => {
    for (const key of ['MONGODB_URI', 'MONGODB_DB', 'ADMIN_PASSWORD', 'ADMIN_SECRET']) {
      if (env[key] && !process.env[key]) process.env[key] = env[key];
    }
    const { default: app, configurationWarnings } = await import('./server.js');
    middlewares.use((req, res, next) => (req.url?.startsWith('/api/') ? app(req, res, next) : next()));
    const warnings: string[] = configurationWarnings();
    if (warnings.length) {
      console.warn('\n\x1b[33m[memorial-api] Configuration incomplete — create memorial-site/.env (copy .env.example):\x1b[0m');
      warnings.forEach(w => console.warn(`  \x1b[33m⚠ ${w}\x1b[0m`));
      console.warn('');
    } else {
      console.log('\x1b[32m[memorial-api] API ready on /api (MongoDB + family space configured)\x1b[0m');
    }
  };
  return {
    name: 'memorial-api',
    configureServer: server => mount(server.middlewares),
    configurePreviewServer: server => mount(server.middlewares),
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), memorialApi(loadEnv(mode, process.cwd(), ''))],
}));
