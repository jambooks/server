const BaseModel = require('./BaseModel');
const { ObjectId } = require('mongodb');
/*
{
    freq:
    name: '',
    type: '',
    status: '', // created (not paid for), active (paid), complete (paid and phone number released)
    complete: '',
    bookStatus: '',
    user_id: ObjectId,
    jammers: {},
    prompts: [],
    log: [],
    images: []
*/
class JamsModel extends BaseModel {
    constructor (options) {
        super(options, 'jams');
    }

    async insert(doc, options = {}) {
        if (doc.userId && !(doc.userId instanceof ObjectId)) {
            doc.userId = ObjectId(doc.userId);
        }
        return await this.insertOne(doc, options);
    }

    findOne(qry, options) {
        options = options || {};
        // can only read my jams
        if (this.user) {
            qry.userId = ObjectId(this.user._id);
        }
        if (qry._id && !(qry._id instanceof Object)) {
            qry._id = ObjectId(qry._id);
        }
        return super.findOne(qry, options);
    }

    async replaceOne(filter, doc) {
        if (!doc.userId || !(doc.userId instanceof ObjectId)) {
            doc.userId = ObjectId(this.user._id);
        }

        if (!doc._id) {
            return Promise.reject({message: '_id field is required for update'});
        }

        if (!(doc._id instanceof Object)) {
            doc._id = ObjectId(doc._id);
        }

        filter.userId = ObjectId(this.user._id);

        return super.replaceOne(filter, doc);
    }

    async updateOne(filter, doc, opts) {
        if (this.user) {
            filter.userId = ObjectId(this.user._id);
        }

        if (filter._id && !(filter._i instanceof Object)) {
            filter._id = ObjectId(filter._id);
        }

        return super.updateOne(filter, doc, opts);
    }

    find(filter, options) {
        filter = filter || {};
        if (this.user) {
            filter.userId = ObjectId(this.user._id);
        }
        return super.find(filter, options);
    }
}

module.exports = JamsModel;
