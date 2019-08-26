const { createStorage, createModel } = require('./storage');
const createRoutes = require('./routes');
const createDefaultController = require('./controller');
const createDefaultValidator = require('./validator');
const { errors } = require('celebrate');

const resources = {};

function get(name) {
  return resources[name];
}

function getAll() {
  return resources;
}

async function create({ resource, dependencies }) {
  const { mongoose, server, logger = console } = dependencies;
  const Model = createModel({
    dbClients: { mongoose },
    properties: resource.properties,
    name: resource.name,
    options: resource.storageOptions,
  });
  const baseStorage = createStorage({
    Model,
    options: resource.storageOptions,
    logger,
  });
  const storageOverrides = resource.createStorage ? resource.createStorage({ base: baseStorage, Model, logger }) : {};
  const storage = { ...baseStorage, ...storageOverrides };

  const baseController = createDefaultController({ storage, logger, resource });
  const controllerOverrides = resource.createController
    ? await resource.createController({ base: baseController, storage, logger })
    : {};
  const controller = { ...baseController, ...controllerOverrides };

  const baseValidator = createDefaultValidator({ resource, logger });
  const validatorOverrides = resource.createValidator ? resource.createValidator({ base: baseValidator, logger }) : {};
  const validator = { ...baseValidator, ...validatorOverrides };

  if (server && resource.route) {
    const baseRoutes = createRoutes({ controller, validator, logger });
    server.use(resource.route, baseRoutes);

    if (resource.createExtraRoutes) {
      const extraRoutes = resource.createExtraRoutes({ controller, validator, logger });
      server.use(resource.route, extraRoutes);
    }

    server.use(errors());
  }

  const result = {
    controller,
    storage,
    validator,
  };
  resources[resource.name] = result;
  return result;
}

module.exports = {
  create,
  get,
  getAll,
};
