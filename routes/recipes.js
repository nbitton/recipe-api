import express from 'express';
import multer from 'multer';
const router = express.Router();
import pool from '../pool.js';
import debugLib from 'debug';
const debug = debugLib('recipes:api');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

router.route('/')
  .get(async (req, res, next) => {
    debug('getting all recipes');
    try {
      const [results] = await pool.execute(
        'SELECT id, name, category, picture FROM recipes'
      );
      res.send(results);
    } catch (err) {
      next(err);
    }
  })
  .post(upload.single('image'), async (req, res, next) => {
    debug(`adding recipe ${JSON.stringify(req.body)}`);
    try {
      const ingredients = Array.isArray(req.body.ingredients) ? req.body.ingredients : JSON.parse(req.body.ingredients);
      const query = 'INSERT INTO recipes (name, category, picture, ingredients, directions) VALUES (?,?,?,?,?)';
      const values = [
        req.body.name,
        req.body.category,
        req.file ? req.file.filename : 'default.jpg',  
        JSON.stringify(ingredients),
        req.body.directions
      ];
      debug(`Executing query: ${query} with values ${JSON.stringify(values)}`);
      const [results] = await pool.execute(query, values);
      req.body.id = results.insertId;
      res.status(201)
        .location(`/recipes/${results.insertId}`)
        .send(req.body);
    } catch (err) {
      debug(`Error adding recipe: ${err.message}`);
      next(err);
    }
  });

router.route('/:id')
  .get(async (req, res, next) => {
    try {
      const [results] = await pool.execute(
        'SELECT * FROM recipes WHERE id = ?', [req.params.id]
      );

      if (!results.length) {
        return res.status(404).send(`Unable to find recipe ${req.params.id}`);
      }

      results[0].ingredients = JSON.parse(results[0].ingredients);
      res.send(results[0]);
    } catch (err) {
      next(err);
    }
  })
  .put(upload.single('image'), async (req, res, next) => {
    debug(`updating recipe ${req.params.id} with ${JSON.stringify(req.body)}`);
    try {
      const ingredients = Array.isArray(req.body.ingredients) ? req.body.ingredients : JSON.parse(req.body.ingredients);
      const query = 'UPDATE recipes SET name = ?, category = ?, picture = ?, ingredients = ?, directions = ? WHERE id = ?';
      const values = [
        req.body.name,
        req.body.category,
        req.file ? req.file.filename : req.body.picture,  
        JSON.stringify(ingredients),
        req.body.directions,
        req.params.id
      ];
      debug(`Executing query: ${query} with values ${JSON.stringify(values)}`);
      const [results] = await pool.execute(query, values);

      if (!results.affectedRows) {
        return res.status(404).send(`Unable to find recipe ${req.params.id}`);
      }

      res.sendStatus(204);
    } catch (err) {
      debug(`Error updating recipe: ${err.message}`);
      next(err);
    }
  })
  .delete(async (req, res, next) => {
    debug(`deleting recipe ${req.params.id}`);
    try {
      const [results] = await pool.execute(
        'DELETE FROM recipes WHERE id = ?', [req.params.id]
      );

      if (!results.affectedRows) {
        return res.status(404).send(`Unable to find recipe ${req.params.id}`);
      }

      res.end();
    } catch (err) {
      next(err);
    }
  });

router.use(function (err, req, res, next) {
  debug(`Error encountered: ${err.message}`);
  res.status(err.status || 500);
  res.send(err.message);
});

export default router;
