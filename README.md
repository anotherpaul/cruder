# CRUDER

## What?

A library that lets you create a RESTful service with canonical methods based on a descriptive JS object.

## Why?

To speed up creating applications using the following stack:

- express/body-parser
- mongoose
- joi/celebrate

## How?

Pretty fast

```
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crudmaker = require('crudmaker');

const resource = {
  name: 'things',
  properties: {
    name: { type: 'string', required: true, unique: true },
    status: { type: 'string', required: true },
  },
  route: '/things',
};
const server = express();
server.use(bodyParser.json());
mongoose.connect();

crudmaker.create({ resource, dependencies: { mongoose, server } });
server.listen(8080);
```

The following routes are created:

```
POST /things
GET /things?name=aga&status=ugu
GET /things/:id
PUT /things/:id
POST /things/search { filter: { status: 'aga' }, skip: 1, limit: 0, sort: { property: 'name', direction: 1 } }
DELETE /things/:id
```

For scarier use cases see 'examples' folder

## API

#### create

Creates a resource and returns it.

```
const resource = { name: 'things', properties: { name: { type: 'string' } } };
const dependencies = { mongoose };
const things = crudmaker.create({ resource, dependencies });
```

Incoming object contents:

```
{
  resource: {
    name, // resource name
    route: // (optional) Server route string, i.e '/things'. Routes won't be created if it's not specified.
    storageOptions: { // (optional) DB client options
      autopopulate, // (optional) Enable or disable autopopulating reference fields, boolean
      selectorOverride, // (optional) Specify returned properties, i.e { name: 0, _id: 0 }
      sequentialId: { // (optional) Settings for surrogate string id i.e. 'PREFIX_0005'
        enabled, // Enabled or disabled, boolean
        maxLength, // Maximum id string length, number
        fieldName, // Name of the field to safe the surrogate id
        prefix, // String prefix to have in front of the number
      },
    },
    createStorage, // (optional) Function that returns storage method overrides
    createController, // (optional) Function that returns controller method overrides
    createValidator, // (optional) Function that returns validator method overrides
    createExtraRoutes, // (optional) Function that returns express-router with additional routes
    properties, // Object with the description of the properties of the resource
  },
  dependencies: {
    mongoose, // Mongoose instance that is connected to a db
    server, // (optional) Express.js instance with bodyParser.json middleware
    logger, // (optional) An object with log, debug, error methods. If not specified, console is used
  },
}
```

Returned object contents:

```
{
  validator: { // express-middleware, made with celebrate
    create,
    find,
    search,
    getById,
    updateById,
    remove,
  },
  controller: { // resource methods
    create(payload),
    find(filter),
    search({ filter, skip, limit }),
    getById(id),
    updateById(id, payload),
    remove(id),
  },
  storage: { // DB methods
    create(payload),
    count(filter),
    find(filter),
    findById(id),
    findOne(filter),
    updateById(id, payload),
    createOrUpdate(filter, payload),
    removeById(id),
    removeByParams(filter),
    removeManyByParams(filter),
  },
}
```

#### get

Returns resource by name.

```
const things = crudmaker.get('things');
```

Returned object contents are the same as above.

#### getAll

Returns an object with all resources.

```
const resource = crudmaker.getAll();
// resource.things { storage, controller }
```

## How the resource properties are described?

'Properties' field should contain an object where every key is a property of our resource.
Every field should contain the following:

```
{
  type, // Data type, string, number, boolean, date, array, object, objectid, строка
  required, // (optional) Required flag (for DB and validator), boolean
  unique, // (optional) Unique flag (for DB), boolean
  items, // (optional) for array type, description of the elements (same as this one)
  properties, // (optional) for object type, description of the nested fields
  ref, // (optional) for objectid type, name of the mongodb collection that will be referenced in this field
}
```

Example:

```
properties: {
  code: { type: 'string', required: true, unique: true },
  name: { type: 'string', required: false },
  sourceId: { type: 'objectid', required: true, ref: 'devices' },
  description: { type: 'string', required: false },
  coordinates: {
    type: 'object',
    required: true,
    properties: {
      lat: { type: 'number', required: true },
      lon: { type: 'number', required: true },
    },
  },
  tags: {
    type: 'array',
    items: { type: 'string' },
  },
  things: {
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
}
```

## Can you add your own logic?

To do this you have to provide functions to override the storage, validator or controller methods.
Only the provided methods are overriden, for all the other ones the default implementation is used.

Overriding the storage methods:

```
// base - base implementation of the storage
// Model - mongoose model, return value of mongoose.model()
// logger - logger object from 'dependencies'
function createStorage({ base, Model, logger }) {
  return {
    create(payload),
    count(filter),
    find(filter),
    findById(id),
    findOne(filter),
    updateById(id, payload),
    createOrUpdate(filter, payload),
    removeById(id),
    removeByParams(filter),
    removeManyByParams(filter),
  };
}
```

Overriding controller methods:

```
// base - base implementation of the controller
// storage - storage object
// logger - logger object from 'dependencies'
function createController({ base, storage, logger }) {
  return {
    create(payload),
    find(filter),
    search({ filter, skip, limit }),
    getById(id),
    updateById(id, payload),
    remove(id),
  };
}
```

Overriding validator methods:

```
// base - base implementation of validator
// logger - logger object from 'dependencies'
function createValidator({ base, logger }) {
  return {
    create,
    find,
    search,
    getById,
    updateById,
    remove,
  };
}
```
