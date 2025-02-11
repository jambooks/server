const OrderModel = require('shared/models')('Orders');
const alexanderService = require('shared/services/alexanders.service');
const awsService = require('shared/services/aws.service');
const bookService = require('shared/services/book.service');
const orderService = require('shared/services/order.service');
const stripeService = require('shared/services/stripe.service');
const userService = require('shared/services/user.service');
const config = require('shared/config');
const { getPromo } = require('shared/services/stripe.service');

exports.index = async (req, res, next) => {
    try {
        OrderModel.setUser(req.session.user);
        res.json(
            await OrderModel.find({
                userId: OrderModel.getObjectId(req.session.user._id),
                status: {$ne: 'expired'}
            }, {
                projection: { status: 1, created: 1, jamId: 1, amountTotal: 1 }
            })
            .sort({_id: -1})
            .toArray()
        );
    } catch (err) {
        return next(err)
    }
}

exports.load = async (req, res, next) => {
    try {
        const order = await orderService.getOrderWithBook(req.params.id);
        if (order === null) {
            next({status: 404, message: 'Order not found.'})
        } else {
            // console.log(order);
            let ret = {
                _id: order._id,
                orderId: order.orderId,
                book: order.book,
                shipping: order.shipping,
                created: order.created,
                name: order?.customer?.name,
                amountSubtotal: order.amountSubtotal,
                amountShipping: order.amountShipping,
                amountTax: order.amountTax,
                amountDiscount: order.amountDiscount,
                amountTotal: order.amountTotal,
                // items: order.items,
                status: order.status,
                statusDate: order.statusDate,
                digitalStatus: order.digitalStatus,
                jamName: order.jamName,
                shippingMethod: `${config.inventory.shipping.name} (${ config.inventory.shipping.description })`
            }
            // console.log(order);
            // if (order.checkoutSessionId) {
            //     const cs = await stripeService.retrieveSession(order.checkoutSessionId, {
            //         expand: ['line_items', 'payment_intent'],
            //     });
            //     console.log('PI', JSON.stringify(cs, null, 2));
            // }

            if (order?.payment?.id) {
                const payment = await stripeService.getPaymentDetails(order.payment.id);
                // console.log(payment);
                ret.shipping = payment.shipping;
                ret.billing = payment.payment_method.billing_details;
                ret.paymentMethod = payment.payment_method.card.brand + ' **** ' + payment.payment_method.card.last4
                // order.card = payment.
                ret.email = payment.customer.email;
                // console.log(JSON.stringify(payment, null, 4));
            }

            order.items.forEach(itm => {
                switch (itm.product) {
                    case config.inventory.digitalBook.product:
                        ret.digitalBook = itm;
                        break;
                    case config.inventory.softCoverBook.product:
                    case config.inventory.softCoverBookPrePaid.product:
                        ret.bookItem = itm;
                        break;
                    case config.inventory.hardCoverUpgrade.product:
                        ret.hardCover = itm;
                        break;
                    case config.inventory.softCoverPage.product:
                    case config.inventory.hardCoverPage.product:
                        ret.pages = itm;
                        break;
                    case config.inventory.expShipping.product:
                        ret.shippingMethod = `${ itm.name } (${ itm.description })`;
                }
            });
            res.json(ret);
        }
    } catch (err) {
        // console.log(err);
        return next(err);
    }
}

exports.delete = async (req, res, next) => {
    try {
        console.log('delete')
        res.send(201);
    } catch (err) {
        return next(err);
    }
}

exports.cancelInFlight = async (req, res, next) => {
    try {
        console.log(req.session);
        delete req.session.promoCode;
        const order = await OrderModel.findOne({ _id: OrderModel.getObjectId(req.session.orderId) });
        if (!order) {
            return next({status: 404, message: 'order not found'});
        } else {
            await stripeService.expire(order.checkoutSessionId);
            await OrderModel.updateOne({_id: order._id }, { $set: { status: 'canceled', statusDate: new Date() } });
            delete req.session.orderId;
            res.sendStatus(202);
        }
    } catch (err) {
        next(err);
    }
}

exports.cancelPrinting = async (req, res, next) => {
    try {
        const order = await OrderModel.findOne({ _id: OrderModel.getObjectId(req.params.id) });
        let sets = { status: 'canceled' };

        if (!order) {
            return next({status: 404, message: 'order not found'});
        } else {
            if (order.printingStatus) {
                // stop printing
                const ret = await alexanderService.cancel(order._id);
                if (ret.status === 400) {
                    console.log('failed to cancel order:' + order._id.toString(), ret);
                } else {
                    console.log('canceled order:' + order._id.toString(), ret);
                    sets.printingStatus = 'Canceled';
                }
            }
            await OrderModel.updateOne({_id: order._id }, { $set: sets });
            res.sendStatus(201);
        }
    } catch (err) {
        next(err);
    }
}

/**
 * Create stripe customer and update user record
 * @param userId
 * @param name
 * @param email
 * @returns {Promise<params>}
 */
exports.createStripeCustomer = async (userId, name, email) => {
    const customer = await stripeService.createCustomer({
        name, email
    });
    await userService.update(userId, {
        stripeId: customer.id
    });
    return customer;
}

/**
 * Create a new order when setting up a new jam
 * @param req
 * @param res
 * @param next
 * @returns String stripe checkout url
 */
exports.create = async (req, res, next) => {
    try {
        const jamId = req.body.jamId;

        if (req.session.user.stripeId === undefined) {
            const customer = await exports.createStripeCustomer(
                req.session.user._id,
                req.session.user.firstName + ' ' + req.session.user.lastName,
                req.session.user.email
            );
            req.session.user.stripeId = customer.id;
        }
        const params = {
            line_items: [],
            success_url: `${config.express.url}/jam/${jamId}/create/finish`,
            cancel_url: `${config.express.url}/jam/${jamId}/create/4?cancel=true`,
        };
        if (req.session.promoCode) {
            params['discounts'] = [ { promotion_code: req.session.promoCode }];
        }
        params.line_items.push(orderService.getLineItem(config.inventory.softCoverBook, 1));
        const order = await orderService.getJamOrder(params, jamId, req.session.user);
        // need to check for promo code and if the order is $0.00 then just redirect them to the create/finish step
        // apply promo discounts
        let url;
        if (order.amountTotal > 0) {
            const ret = await stripeService.checkout(params, req.session.user);
            order.checkoutSessionId = ret.id;
            url = ret.url
        } else {
            url = params.success_url;
        }
        const newOrder = await orderService.insertOne(order, { returnRecord: true });
        req.session.orderId = newOrder._id;
        res.json({
            url
        });
    } catch (err) {
        return next(err);
    }
}

exports.bookPublished = async (req, res, next) => {
    try {
        // create alexanders order
        console.log(req.session);
        res.send(201);
    } catch (err) {
        return next(err);
    }
}

exports.digitalBookPublished = async (req, res, next) => {
    try {
        // updated order with the digital book URL and update order.items.status
        res.send(201);
    } catch (err) {
        return next(err);
    }
}

exports.downloadPdf = async (req, res, next) => {
    let key;
    try {
        // const order = await orderService.getByIdAndUserId(req.params.orderId, req.session.user._id);
        const order = await orderService.getById(req.params.orderId);
        const book = await bookService.getById(order.bookId);
        key = bookService.getDigitalBookPath(book);
        const response = await awsService.getFileStream(key);
        res.attachment('digital-book.pdf');
        res.setHeader('Content-type', 'applcation/pdf');
        response.Body.pipe(res);
    } catch (err) {
        console.log('outside', key, err)
        return next({status: 404, message: 'digital book not found'});
    }
}

/**
 * Remove a promo code from the req.session.promoCode.
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.removePromo = async (req, res, next) => {
    try {
        delete req.session.promoCode;
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
}

/**
 * Check if the promo code entered is valid and that the current user can apply it.
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.checkPromo = async (req, res, next) => {
    try {
        if (req.session.user.stripeId === undefined) {
            const customer = await module.exports.createStripeCustomer(
                req.session.user._id,
                req.session.user.firstName + ' ' + req.session.user.lastName,
                req.session.user.email
            );
            req.session.user.stripeId = customer.id;
        }
        const promo = await getPromo(req.body.promo.toUpperCase(), req.session.user);
        // set the promo code in the session.
        req.session.promoCode = promo.id;
        delete promo.id;
        delete promo.coupon_id;
        res.json(promo);
    } catch (err) {
        delete req.session.promoCode;
        return next(err);
    }
}

/**
 * Get the price of the soft cover book.
 *
 * The price is $0.00 if you've not bought a book with the prepaid book.
 * The price is $29.00 if you've used the prepaid or the jam is not yours.
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.getBookPrice = async (req, res, next) => {
    try {
        let ret = {
            price: config.inventory.softCoverBook.price
        };
        if (req.session.user) {
            const usedPrepaid = await orderService.checkForOrderedPrepaidBook(req.session.user._id, req.body.bookId);
            if (!usedPrepaid) {
                ret.price = 0;
            }
        }
        res.json(ret);
    } catch (err) {
        return next(err);
    }
}