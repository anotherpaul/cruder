const express = require('express');

const dummy = (_req, _res, next) => next();

function createResourceRoutes({ controller, validator }) {
  const router = express.Router();
  router.get('/properties', (req, res) =>
    controller
      .getProperties()
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).send(err.message || err)),
  );
  router.post('/', !!validator && !!validator.create ? validator.create : dummy, (req, res) =>
    controller
      .create(req.body)
      .then(result => res.status(201).json(result))
      .catch(err => res.status(500).send(err.message || err)),
  );
  router.post('/search', !!validator && !!validator.search ? validator.search : dummy, (req, res) =>
    controller
      .search(req.body)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).send(err.message || err)),
  );
  router.get('/', !!validator && !!validator.find ? validator.find : dummy, (req, res) =>
    controller
      .find(req.query)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).send(err.message || err)),
  );
  router.get('/:id', !!validator && !!validator.getById ? validator.getById : dummy, (req, res) =>
    controller
      .getById(req.params.id)
      .then(result => (result ? res.status(200).json(result) : res.status(404).json({ message: 'not found' })))
      .catch(err => res.status(500).send(err.message || err)),
  );
  router.put('/:id', !!validator && !!validator.updateById ? validator.updateById : dummy, (req, res) =>
    controller
      .updateById(req.params.id, req.body)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).send(err.message || err)),
  );
  router.delete('/:id', !!validator && !!validator.remove ? validator.remove : dummy, (req, res) =>
    controller
      .remove(req.params.id)
      .then(result => res.status(204).json(result))
      .catch(err => res.status(500).send(err.message || err)),
  );

  return router;
}

module.exports = createResourceRoutes;
