const BaseModel = require('./BaseModel');

class JobModel extends BaseModel {
    constructor (options) {
        super(options, 'jobs');
    }
}

module.exports = JobModel;