const BaseModel = require('./BaseModel');

class StripePaymentIntentModel extends BaseModel {
    constructor (options) {
        super(options, 'stripe.pi');
    }
}

module.exports = StripePaymentIntentModel;