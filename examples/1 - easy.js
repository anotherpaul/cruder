const mongoose = require('mongoose');
const cruder = require('../src');

mongoose.connect(`mongodb://localhost:27017/easy`);

const resource = {
  name: 'things',
  properties: {
    name: { type: 'string', required: true, unique: true },
  },
};

cruder.create({ resource, dependencies: { mongoose } });

async function startApp() {
  const things = cruder.get('things');
  const thing = await things.controller.create({ name: 'a thing' });
  console.log(thing);
  const foundThings = await things.controller.search({ filter: {}, skip: 0, limit: 0 });
  console.log(foundThings);
}

startApp();
