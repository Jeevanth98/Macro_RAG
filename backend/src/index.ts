import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

import { syncFredData } from './services/syncData';

// API Routes
app.use('/api/v1', apiRoutes);

// Sync data on startup
syncFredData().catch(console.error);

// Health check
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Prevent Node from exiting due to lack of event loop activity
setInterval(() => {}, 1000 * 60 * 60);
