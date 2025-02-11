const PaymentRouter = require('express').Router();
const paymentController = require('controllers/payment.controller');
PaymentRouter.use(require('middlewares/authMiddleWare'));

PaymentRouter.route('/charge').post(paymentController.charge);
PaymentRouter.route('/getStripeCustomer').get(paymentController.getStripeCustomer);
PaymentRouter.route('/charges').get(paymentController.charges);

module.exports = PaymentRouter;