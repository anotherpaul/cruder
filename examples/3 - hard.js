const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');
const uuidv4 = require('uuid/v4');
const { celebrate, Joi } = require('celebrate');

const crudmaker = require('../src');

const logger = {
  log: console.log,
  debug: console.log,
  error: console.log,
};

function createController({ base, storage, logger }) {
  async function create(payload) {
    const surrogateId = uuidv4();
    logger.log(`generated new thing id: ${surrogateId}`);
    const thing = await base.create({ ...payload, surrogateId });
    logger.log(`created new thing: ${JSON.stringify(thing)}`);
    return thing;
  }

  function getById(id) {
    return storage.findOne({ surrogateId: id });
  }

  function updateById(id, payload) {
    return storage.createOrUpdate({ surrogateId: id }, payload);
  }

  function remove(id) {
    logger.log(`removing thing with id ${id}`);
    return storage.removeByParams({ surrogateId: id });
  }

  return {
    create,
    getById,
    updateById,
    remove,
  };
}

function createValidator({ base, logger }) {
  const createThing = {
    body: Joi.object()
      .keys({
        name: Joi.string().required(),
      })
      .required(),
  };
  return {
    create: celebrate(createThing),
  };
}

mongoose.connect(`mongodb://localhost:27017/hard`);

const server = express();
server.use(bodyParser.json());

const things = {
  name: 'things',
  route: '/things',
  storageOptions: {
    selectorOverride: { _id: 0 },
  },
  properties: {
    surrogateId: { type: 'string', required: true, unique: true },
    name: { type: 'string', required: true },
  },
  createController,
  createValidator,
};

crudmaker.create({
  resource: things,
  dependencies: { mongoose, server, logger },
});

server.listen(8080, async () => {
  const thing = await request({
    method: 'POST',
    url: 'http://localhost:8080/things',
    json: { name: 'a thing' },
  });
  logger.log(thing);
  const foundThings = await request({
    method: 'POST',
    url: 'http://localhost:8080/things/search',
    json: { filter: {}, skip: 0, limit: 0 },
  });
  logger.log(foundThings);
});
