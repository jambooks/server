const BaseModel = require('./BaseModel');

class AlexLogModel extends BaseModel {
    constructor (options) {
        super(options, 'alex.log');
    }
}

module.exports = AlexLogModel;
