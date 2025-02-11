const config = require('shared/config');
const MongoClient = require('mongodb').MongoClient;

module.exports = async () => {
    config.mongo.conn = await MongoClient.connect(config.mongo.url, { useUnifiedTopology: true })
        .catch(err => { console.log(err); });
}
