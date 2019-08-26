const autopopulate = require('mongoose-autopopulate');
const { types } = require('./consts');

function transformFilterToQuery(filter) {
  const conditions = Object.entries(filter).reduce((queries, [key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      queries.push({ [key]: { $in: value } });
      return queries;
    }
    queries.push({ [key]: value });
    return queries;
  }, []);
  if (!conditions.length) {
    return {};
  }
  return { $and: conditions };
}

function createModel({ dbClients, name, properties, options = {} }) {
  const { mongoose } = dbClients;
  function createPropertySchema(description) {
    let propDesciption = {};
    if (description.type === 'array' && description.items) {
      propDesciption.type = [createPropertySchema(description.items)];
    } else if (description.type === 'object' && description.properties) {
      propDesciption = createSchemaDescription(description.properties);
    } else if (description.type === 'objectid' && description.ref) {
      propDesciption = {
        type: mongoose.Schema.Types.ObjectId,
        ref: description.ref,
        autopopulate: options.autopopulate,
      };
    } else {
      propDesciption.type = types[description.type].storageType;
    }
    if (description.required) {
      propDesciption.required = true;
    }
    if (description.unique) {
      propDesciption.unique = true;
    }
    return propDesciption;
  }

  function createSchemaDescription(props) {
    return Object.entries(props).reduce((acc, [key, description]) => {
      acc[key] = createPropertySchema(description);
      return acc;
    }, {});
  }

  const { sequentialId } = options;
  const schemaDescription = createSchemaDescription(properties);
  const schema = new mongoose.Schema(schemaDescription, { timestamps: true });
  schema.plugin(autopopulate);

  // just in case we need sequential id
  if (sequentialId && sequentialId.enabled) {
    const CounterSchema = new mongoose.Schema({
      _id: { type: String, required: true },
      seq: { type: Number, default: 0 },
    });
    const Counter = mongoose.model('counter', CounterSchema);
    schema.pre('save', async function preSave(next) {
      const doc = this;
      try {
        const counter = await Counter.findOneAndUpdate(
          { _id: name },
          { $inc: { seq: 1 } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        const seqStr = `${'0'.repeat(sequentialId.maxLength)}${counter.seq}`;
        const seqCropped = seqStr.substr(seqStr.length - sequentialId.maxLength);
        doc[sequentialId.fieldName] = `${sequentialId.prefix}${seqCropped}`;
        return next();
      } catch (error) {
        return next(error);
      }
    });
  }

  return mongoose.model(name, schema);
}

function createStorage({ Model, options = {} }) {
  const { selectorOverride = {} } = options;
  const selector = { __v: 0, ...selectorOverride };
  const leanOptions = { autopopulate: options.autopopulate };

  function create(data) {
    return new Model(data).save();
  }
  function count(filter) {
    return Model.count(filter).exec();
  }
  function find(filter, sort, skip = 0, limit = 0) {
    const searchQuery = transformFilterToQuery(filter);
    return Model.find(searchQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(selector)
      .lean(leanOptions)
      .exec();
  }
  function findById(id) {
    return Model.findById(id)
      .select(selector)
      .lean(leanOptions)
      .exec();
  }
  function findOne(filter) {
    const searchQuery = transformFilterToQuery(filter);
    return Model.findOne(searchQuery)
      .select(selector)
      .lean(leanOptions)
      .exec();
  }
  function updateById(id, data) {
    return Model.findByIdAndUpdate(id, data, { new: true, setDefaultsOnInsert: true })
      .select(selector)
      .lean(leanOptions)
      .exec();
  }
  function createOrUpdate(filter, data) {
    const searchQuery = transformFilterToQuery(filter);
    return Model.findOneAndUpdate(searchQuery, data, { new: true, upsert: true, setDefaultsOnInsert: true })
      .select(selector)
      .lean(leanOptions)
      .exec();
  }
  function removeById(id) {
    return Model.findByIdAndRemove(id)
      .lean(leanOptions)
      .exec();
  }
  function removeByParams(filter) {
    const searchQuery = transformFilterToQuery(filter);
    return Model.findOneAndRemove(searchQuery)
      .lean(leanOptions)
      .exec();
  }
  function removeManyByParams(filter) {
    const searchQuery = transformFilterToQuery(filter);
    return Model.remove(searchQuery)
      .lean(leanOptions)
      .exec();
  }
  return {
    create,
    count,
    find,
    findById,
    findOne,
    updateById,
    createOrUpdate,
    removeById,
    removeByParams,
    removeManyByParams,
  };
}

module.exports = {
  createModel,
  createStorage,
};
