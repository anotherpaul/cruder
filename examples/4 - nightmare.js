const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');

const cruder = require('../src');

const myLogger = {
  log: console.log,
  debug: console.log,
  error: console.log,
};

function createEventTypesController({ base, storage, logger }) {
  function create(payload) {
    logger.debug(`create event type ${JSON.stringify(payload, null, 2)}`);
    const data = { ...payload };
    if (!data.name) {
      data.name = data.code;
    }
    logger.debug(`creating event type ${JSON.stringify(data, null, 2)}`);
    return base.create(data);
  }

  function getById(id) {
    logger.debug(`get event type by id ${id}`);
    return storage.findOne({ code: id });
  }

  function updateById(id, payload) {
    return storage.createOrUpdate({ code: id }, payload);
  }

  function remove(id) {
    return storage.removeByParams({ code: id });
  }

  return {
    create,
    getById,
    updateById,
    remove,
  };
}

function createEventsController({ base, logger }) {
  async function create(payload) {
    const eventTypes = cruder.get('eventtypes');
    const existingType = await eventTypes.controller.getById(payload.typeCode);
    if (!existingType) {
      logger.debug(`could not find type: ${payload.typeCode}, creating it`);
      const newEventType = {
        code: payload.typeCode,
      };
      if (payload.data) {
        newEventType.fields = Object.entries(payload.data).map(([key, value]) => {
          return {
            name: key,
            description: key,
            type: typeof value,
          };
        });
      }
      await eventTypes.storage.create(newEventType);
    }
    return base.create(payload);
  }

  return {
    create,
  };
}

const devices = {
  name: 'devices',
  route: '/devices',
  properties: {
    name: { type: 'string', required: true },
  },
};

const eventTypes = {
  name: 'eventtypes',
  route: '/event-types',
  storageOptions: {
    selectorOverride: { _id: 0 },
  },
  properties: {
    code: { type: 'string', required: true, unique: true },
    name: { type: 'string', required: false },
    description: { type: 'string', required: false },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', required: true },
          description: { type: 'string', required: false },
          type: { type: 'string', required: true },
        },
      },
    },
  },
  createController: createEventTypesController,
};

const events = {
  name: 'events',
  route: '/events',
  storageOptions: {
    autopopulate: true,
  },
  properties: {
    typeCode: { type: 'string', required: true },
    sourceId: { type: 'objectid', required: true, ref: 'devices' },
    data: { type: 'object' },
  },
  createController: createEventsController,
};

function startApp() {
  mongoose.connect(`mongodb://localhost:27017/nightmare`);

  const server = express();
  server.use(bodyParser.json());

  const dependencies = { mongoose, server, logger: myLogger };

  cruder.create({ resource: devices, dependencies });
  cruder.create({ resource: eventTypes, dependencies });
  cruder.create({ resource: events, dependencies });

  server.listen(8080, async () => {
    const device = await request({
      method: 'POST',
      url: 'http://localhost:8080/devices',
      json: { name: 'sensor1' },
    });
    myLogger.log(JSON.stringify(device));
    const event = await request({
      method: 'POST',
      url: 'http://localhost:8080/events',
      json: {
        typeCode: 'alarm123',
        sourceId: device._id,
        data: {
          something: 'happened',
          ok: 'go',
        },
      },
    });
    myLogger.log(JSON.stringify(event));
    const foundEventTypes = await request({
      method: 'POST',
      url: 'http://localhost:8080/event-types/search',
      json: { filter: {}, skip: 0, limit: 0 },
    });
    myLogger.log(JSON.stringify(foundEventTypes));
  });
}

startApp();
