import express from 'express';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Allow cross-origin requests from Vite dev server
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

const { default: certsRouter } = await import('./certificates/index.js');
app.use('/certificates', certsRouter);
console.log('Mounted /certificates routes');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Certificate PDF server listening on http://localhost:${PORT}`);
});
