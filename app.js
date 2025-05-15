import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import recipesRouter from './routes/recipes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use((req, res, next) => {
  console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
  console.log(`Request Body: ${JSON.stringify(req.body)}`);
  next();
});


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));


app.use(express.static(path.join(__dirname, 'public')));


app.use('/recipes', recipesRouter);


app.use((req, res, next) => {
  const err = new Error('Not Found');
  console.log(`404 Error: ${err.message} for URL: ${req.url}`);
  err.status = 404;
  next(err);
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500);
  res.json({ error: err.message });
});


export default app;
