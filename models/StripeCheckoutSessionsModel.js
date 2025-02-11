const BaseModel = require('./BaseModel');

/**
 * Save the stripe checkout session details
 */
class StripeCheckoutSessionsModel extends BaseModel {
    constructor (options) {
        super(options, 'stripe.checkouts');
    }
}

module.exports = StripeCheckoutSessionsModel;