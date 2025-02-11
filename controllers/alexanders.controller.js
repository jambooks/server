const AlexLogModel = require('shared/models')('AlexLog');
const orderService = require('shared/services/order.service');
const emailService = require('shared/services/email.service');

// update order printingStatus and send the custom an email letting the know the dueDate and updated status.
exports.printing = async (req, res, next) => {
    try {
        const body = {...req.body};
        body.type = 'printing';
        body.orderId = orderService.getObjectId(req.params.orderId);
        await AlexLogModel.insertOne(body);
        const order = await orderService.getById(req.params.orderId);
        if (order) {
            const sets = {
                status: 'printing',
                printingStatus: 'printing'
            };
            await orderService.updateById(req.params.orderId, {$set: sets});
            const doDate = new Date(body.dueDate);
            await emailService.bookPrinting(
                order.customer.email,
                order._id.toString(),
                order.customer.name,
                orderService.getOrderLink(order),
                doDate.toLocaleDateString()
            );
        }
        res.status(201).send();
    } catch (err) {
        return next(err);
    }
}

exports.shipped = async (req, res, next) => {
    try {
        const body = {...req.body};
        body.type = 'shipped';
        body.orderId = orderService.getObjectId(req.params.orderId);
        await AlexLogModel.insertOne(body);
        const order = await orderService.getById(req.params.orderId);
        if (order) {
            const sets = {
                status: 'shipped',
                printingStatus: 'shipped'
            };
            await orderService.updateById(req.params.orderId, {$set: sets});
            await emailService.bookShipped(
                order.customer.email,
                order._id.toString(),
                order.customer.name,
                orderService.getOrderLink(order),
                body.trackingNumber,
                body.carrier
            );
        }
        res.status(201).send();
    } catch (err) {
        return next(err)
    }
}

exports.error = async (req, res, next) => {
    try {
        const body = req.body;
        body.type = 'error';
        body.orderId = orderService.getObjectId(req.params.orderId);
        await AlexLogModel.insertOne(body);
        res.status(201).send();
    } catch (err) {
        return next(err)
    }
}
