const BaseModel = require('./BaseModel');
const { ObjectId } = require('mongodb');

class UserModel extends BaseModel {
    constructor (options) {
        super(options, 'users');
    }

    findOne(qry, options) {
        if (this.user) {
            if (qry._id === undefined) {
                qry._id = ObjectId(this.user._id);
            }
            if (qry._id && !(qry._id instanceof Object)) {
                qry._id = ObjectId(qry._id);
            }
        }

        options = options || {}
        return super.findOne(qry, options);
    }
}

module.exports = UserModel;
