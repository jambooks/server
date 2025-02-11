const BaseModel = require('./BaseModel');
// const { ObjectId } = require('mongodb')

class TypeModel extends BaseModel {
    constructor (options) {
        super(options, 'types');
    }
}

module.exports = TypeModel;
