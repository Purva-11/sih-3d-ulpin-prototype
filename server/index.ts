import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({ 
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Serve static files from the React app (production build)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback for non-API browser routes to serve React's index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/assets')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
