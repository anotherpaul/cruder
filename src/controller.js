function createController({ storage, logger, resource }) {
  const resourceName = resource.name || 'resource';
  logger.log('creating default controller', resourceName);
  async function create(payload) {
    logger.log(`create ${resourceName} ${JSON.stringify(payload, null, 2)}`);
    return storage.create(payload);
  }

  async function search(searchQuery) {
    logger.debug(`search ${resourceName} ${JSON.stringify(searchQuery, null, 2)}`);
    const total = await storage.count(searchQuery.filter);
    logger.debug(`found ${total} ${resourceName} ${JSON.stringify(searchQuery, null, 2)}`);
    if (total === 0) {
      return {
        results: [],
        total,
      };
    }
    let sort = {
      createdAt: -1,
    };
    if (searchQuery.sort) {
      sort = {
        [searchQuery.sort.property]: searchQuery.sort.direction,
      };
    }
    const results = await storage.find(searchQuery.filter, sort, searchQuery.skip, searchQuery.limit);
    return {
      results,
      total,
    };
  }

  function find(filter) {
    logger.debug(`find ${resourceName} ${JSON.stringify(filter, null, 2)}`);
    return storage.find(filter);
  }

  function getById(id) {
    logger.debug(`get ${resourceName} by id ${id}`);
    return storage.findOne({ _id: id });
  }

  async function updateById(id, payload) {
    logger.debug(`update ${resourceName} ${id} with ${JSON.stringify(payload, null, 2)}`);
    return storage.createOrUpdate({ _id: id }, payload);
  }

  async function remove(id) {
    logger.debug(`removing ${resourceName} by id ${id}`);
    await storage.removeByParams({ _id: id });
    return { id };
  }

  return {
    create,
    search,
    find,
    getById,
    updateById,
    remove,
  };
}

module.exports = createController;
