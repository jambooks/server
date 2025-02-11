const BaseModel = require('./BaseModel');

class BooksModel extends BaseModel {
    constructor (options) {
        super(options, 'books');
        // this.schema = {
        //     _id: Object,
        //     userId: Object,
        //     pageCount: Integer,
        //     converUrl: String,
        //     coverColor: String,
        //     status: enum
        // }
    }
}

module.exports = BooksModel;
