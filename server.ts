import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const PORT = 3000;
const DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');

// Ensure data dir exists
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}

let memoryDb: unknown = null;
if (fs.existsSync(DB_FILE)) {
  try {
    memoryDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    memoryDb = null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // API endpoints
  app.get('/api/db', (_req, res) => {
    if (memoryDb) {
      return res.json(memoryDb);
    }
    return res.status(204).end();
  });

  app.put('/api/db', (req, res) => {
    try {
      memoryDb = req.body;
      fs.writeFileSync(DB_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
      return res.json({ success: true, timestamp: Date.now() });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: msg });
    }
  });

  app.post('/api/db/reset', (_req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE);
      }
      memoryDb = null;
      return res.json({ success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: msg });
    }
  });

  // Vite middleware in dev or static files in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> MOMILK Fullstack Server ready at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
