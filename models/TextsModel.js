const BaseModel = require('./BaseModel');

class TextsModel extends BaseModel {
    constructor (options) {
        super(options, 'texts');
    }
}

module.exports = TextsModel;
