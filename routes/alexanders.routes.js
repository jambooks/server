const alexController = require('controllers/alexanders.controller');
const AlexRouter = require('express').Router();
AlexRouter.use(require('middlewares/alexandersAuthMiddleWare'));

AlexRouter.route('/printing/:orderId').put(alexController.printing);
AlexRouter.route('/shipped/:orderId').put(alexController.shipped);
AlexRouter.route('/error/:orderId').put(alexController.error);

module.exports = AlexRouter;