const BaseModel = require('./BaseModel');

/**
 * jamId
 * paymentId // stripe payment_id
 * status ['created', 'succeeded', 'completed', 'canceled', 'expired']
 *
 */
class PaymentModel extends BaseModel {
    constructor (options) {
        super(options, 'payments');
    }
}

module.exports = PaymentModel;