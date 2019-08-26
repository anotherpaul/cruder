const types = {
  string: { storageType: String, validatorFunc: 'string' },
  number: { storageType: Number, validatorFunc: 'number' },
  date: { storageType: Date, validatorFunc: 'date' },
  boolean: { storageType: Boolean, validatorFunc: 'bool' },
  object: { storageType: Object, validatorFunc: 'object' },
  array: { storageType: Array, validatorFunc: 'array' },
  objectid: { validatorFunc: 'string' },
};

module.exports = {
  types,
};
