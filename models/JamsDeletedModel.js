const BaseModel = require('./BaseModel');

class JamsDeletedModel extends BaseModel {
    constructor (options) {
        super(options, 'jams.deleted');
    }
}

module.exports = JamsDeletedModel;
