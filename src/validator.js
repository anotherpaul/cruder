const { celebrate, Joi } = require('celebrate');
const { types } = require('./consts');

function validateProperty({ description, useRequired }) {
  let prop = Joi[types[description.type].validatorFunc]();
  if (description.type === 'array' && description.items) {
    prop = prop.items(validateProperty({ description: description.items, useRequired }));
  }
  if (description.type === 'object' && description.properties) {
    prop = prop.keys(validateProps({ properties: description.properties, useRequired }));
  }
  if (useRequired && description.required) {
    prop = prop.required();
  } else if (!useRequired && description.allow) {
    prop = prop.allow(...description.allow);
  }

  return prop;
}

function validateProps({ properties, useRequired = true }) {
  return Object.entries(properties).reduce((acc, [key, description]) => {
    acc[key] = validateProperty({ description, useRequired });
    return acc;
  }, {});
}

function validateSearchProps({ properties }) {
  return Object.entries(properties).reduce((acc, [key, description]) => {
    const prop = Joi[types[description.type].validatorFunc]();
    acc[key] = Joi.array().items(prop);
    return acc;
  }, {});
}

function createValidator({ resource }) {
  const { properties } = resource;
  const create = {
    body: Joi.object()
      .keys(validateProps({ properties, useRequired: true }))
      .required(),
  };

  const find = {
    query: Joi.object().keys(validateProps({ properties, useRequired: false })),
  };

  const search = {
    body: Joi.object().keys({
      filter: Joi.object()
        .keys(validateSearchProps({ properties }))
        .required(),
      skip: Joi.number().min(0),
      limit: Joi.number().min(0),
      sort: Joi.object().keys({
        property: Joi.string(),
        direction: Joi.number().only([1, -1]),
      }),
    }),
  };

  const updateById = {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys(validateProps({ properties, useRequired: false })),
  };

  const getById = {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  };

  return {
    create: celebrate(create),
    find: celebrate(find),
    search: celebrate(search),
    updateById: celebrate(updateById),
    getById: celebrate(getById),
    remove: celebrate(getById),
  };
}

module.exports = createValidator;
