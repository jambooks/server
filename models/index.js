const config = require('shared/config');

module.exports = (modelName) => {
    const Model = require('./' + modelName + 'Model');
    const db = Model.db || config.mongo.db;
    const opts = {
        connection: config.mongo.conn.db(db),
        debug: config.mongo.debug || false
    }
    return new Model(opts);
}
