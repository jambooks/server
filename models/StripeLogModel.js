const BaseModel = require('./BaseModel');

class StripeLogModel extends BaseModel {
    constructor (options) {
        super(options, 'stripe.log');
    }
}

module.exports = StripeLogModel;
