const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');

const crudmaker = require('../src');

mongoose.connect(`mongodb://localhost:27017/medium`);

const things = {
  name: 'things',
  route: '/things',
  properties: {
    name: { type: 'string', required: true, unique: true },
  },
};

function startApp() {
  const server = express();
  server.use(bodyParser.json());

  crudmaker.create({
    resource: things,
    dependencies: { mongoose, server },
  });

  server.listen(8080, async () => {
    const thing = await request({
      method: 'POST',
      url: 'http://localhost:8080/things',
      json: { name: 'a thing' },
    });
    console.log(thing);
    const foundThings = await request({
      method: 'POST',
      url: 'http://localhost:8080/things/search',
      json: { filter: {}, skip: 0, limit: 0 },
    });
    console.log(foundThings);
  });
}

startApp();
