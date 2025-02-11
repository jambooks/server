const orderController = require('controllers/order.controller');
const authMiddleWare = require('../../middlewares/authMiddleWare')
const OrderRouter = require('express').Router();

OrderRouter.route('/').get(
    authMiddleWare,
    orderController.index
);

OrderRouter.route('/promo').post(orderController.checkPromo);
OrderRouter.route('/promo').delete(orderController.removePromo);

OrderRouter.route('/getBookPrice').post(
    orderController.getBookPrice
)

OrderRouter.route('/:id').get(
    orderController.load
);

OrderRouter.route('/:id').delete(
    authMiddleWare,
    orderController.delete
);

OrderRouter.route('/:id/cancel').patch(
    authMiddleWare,
    orderController.cancelPrinting
);

OrderRouter.route('/cancel-in-flight').post(
    orderController.cancelInFlight
);

OrderRouter.route('/create').post(
    authMiddleWare,
    orderController.create
);

OrderRouter.route('/:id/bookPublished').post(
    authMiddleWare,
    orderController.bookPublished
);

OrderRouter.route('/:orderId/digital').get(
    // authMiddleWare, // I would rather have them logged into downloadthe book
    orderController.downloadPdf
);

module.exports = OrderRouter;