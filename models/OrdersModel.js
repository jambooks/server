const BaseModel = require('./BaseModel');

/**
 * jamId
 * paymentId // stripe payment_id
 * status ['created', 'succeeded', 'completed', 'shipped']
 * items: {
 *  name
 *  description
 *  quantity
 *  price
 *  amountDiscount
 *  amountSubtotal
 *  amountTax
 *  amountTotal
 * }
 * shipping {
 *  method,
 *  carrier,
 *  trackingNumber,
 *  address{
 *      address1
 *      address2
 *      city
 *      state
 *      zip
 *  }
 * }
 */
class OrdersModel extends BaseModel {
    constructor (options) {
        super(options, 'orders');
    }
}

module.exports = OrdersModel;