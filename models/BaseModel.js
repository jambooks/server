const ObjectId = require('mongodb').ObjectId;

class BaseModel {
    constructor(options, collectionName) {
        this.connection = options.connection;
        this.collectionName = collectionName;
        this.collection = this.connection.collection(this.collectionName);
        this.debug = options.debug;
        this.user = null;
    }

    setUser(user) {
        this.user = user;
        return this;
    }

    getObjectId(str) {
        if (str) {
            return ObjectId(str);
        } else {
            return ObjectId();
        }
    }

    log() {
        if (this.debug) {
            const args = Object.values(arguments).map(arg => JSON.stringify(arg));
            let methodName = (new Error().stack.split('\n')[2].split(" ")[5].split('.')[1]);
            console.log(`query: ${this.collectionName}.${methodName}(${args.join(',')})`);
        }
    }

    set(fld, val) {
        this[fld] = val;
    }

    find(qry, options) {
        if (qry._id && !(qry._id instanceof Object)) {
            qry._id = ObjectId(qry._id);
        }
        if (this.user) {
            qry.userId = ObjectId(this.user._id);
        }
        this.log(qry, options);
        return this.collection.find(qry, options);
    }

    findOne(qry, options) {
        if (qry._id) {
            qry._id = ObjectId(qry._id);
        }
        if (this.user) {
            qry.userId = ObjectId(this.user._id);
        }
        this.log(qry, options);
        return this.collection.findOne(qry, options);
    }

    insertOne(doc, options = {}) {
        this.log(doc);

        return this.collection.insertOne(doc)
            .then(res => {
                if (options.returnRecord) {
                    return this.findOne({_id: res.insertedId });
                } else {
                    return Promise.resolve({_id: res.insertedId});
                }
            })
    }

    findByUserId() {
        return this.find({userId: ObjectId(this.user._id)});
    }

    replaceOne(filter, doc, options) {
        options = options || { upsert: false };
        this.log(filter, doc, options);
        return this.collection.replaceOne(filter, doc, options);
    }

    updateOne(filter, doc, options) {
        options = options || {};
        this.log(filter, doc, options)
        const returnRecord = options.returnRecord;
        delete options.returnRecord;
        return this.collection.updateOne(filter, doc, options)
            .then(res => {
                if (returnRecord) {
                    return this.findOne({_id: filter._id});
                } else {
                    return Promise.resolve(res);
                }
            })
            .then(res => {
                return res;
            })
    }

    deleteOne(filter, options) {
        this.log(filter, options);
        return this.collection.deleteOne(filter);
    }

    deleteMany(filter, options) {
        this.log(filter, options);
        return this.collection.deleteMany(filter);
    }

    aggregate(pipeline, options) {
        this.log(pipeline, options);
        return this.collection.aggregate(pipeline);
    }
 }

module.exports = BaseModel;
