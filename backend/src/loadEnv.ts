import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env in the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
