const orderService = require('shared/services/order.service');

module.exports = (project) => {
    return async (req, res, next) => {
        project = project || { _id: 1, userId: 1, jamId: 1 };
        const order = await orderService.findOne({
            _id: req.params.orderId,
            userId: req.session.user._id
        }, {projection: project});

        if (!order) {
            next({
                'status': 404,
                message: 'Order not found'
            });
        } else {
            req.order = order;
            next();
        }
    }
}