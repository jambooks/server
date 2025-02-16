const config = require('@jambooks/shared/config');
const PaymentService = require('@jambooks/shared/services')('Payment');

exports.cancel = async (req, res, next) => {
    try {
        req.session.paymentId = await PaymentService.cancelPayment(req.session.orderId);
        let retJson = {}
        res.json(retJson)
    } catch (err) {
        return next(err)
    }
}

exports.start = async (req, res, next) => {
    try {
        const jamId = req.params.id;
        const params = {
            line_items: [],
            success_url: `${config.express.url}/jam/${jamId}/create/finish`,
            cancel_url: `${config.express.url}/jam/${jamId}/create/4?cancel=true`,
        };
        // params.line_items.push(PaymentService.getLineItem('prod_MxsIdlzCrcpwpK', 2750, 1, true));
        params.line_items.push(PaymentService.getLineItem(config.inventory.softCoverBook, 1));
        PaymentService.setUser(req.session.user);
        const ret = await PaymentService.checkout(params, jamId);
        req.session.orderId = ret.orderId
        res.json({
            url: ret.url
        });
    } catch (err) {
        console.log(err);
        return next(err)
    }
}

exports.checkout = async (req, res, next) => {
    try {
        PaymentService.setUser(req.session.user);
        const bookId = req.params.id;
        const pageType = req.body.hardCover ? config.inventory.hardCoverPage: config.inventory.softcoverPagePrice;
        let extraPageTotal = 0;
        if (req.book.pageCount - 31 > 0) {
            extraPageTotal = (req.book.pageCount - 31);
        }

        const params = {
            mode: 'payment',
            line_items: []
        };

        if (req.body.hardCover) {
            params.line_items.push(PaymentService.getLineItem(config.inventory.hardCoverUpgrade, 1));
        }

        if (extraPageTotal) {
            params.line_items.push(PaymentService.getLineItem(pageType, extraPageTotal));
        }

        if (req.body.digitalCopy) {
            params.line_items.push(PaymentService.getLineItem(config.inventory.digitalBook, 1));
        }

        if (req.body.expShipping) {
            // if all they want is expedited shipping we charge that as a line item.
            if (!req.body.hardCover && !req.body.digitalCopy && !extraPageTotal) {
                params.line_items.push(PaymentService.getLineItem(config.inventory.expShipping, 1));
            } else {
                params.shipping_options =  [
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: {amount: 750, currency: 'usd'},
                            display_name: 'Expedited shipping',
                            delivery_estimate: {
                                minimum: {unit: 'business_day', value: 1},
                                maximum: {unit: 'business_day', value: 3},
                            },
                        },
                    },
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: {amount: 0, currency: 'usd'},
                            display_name: 'Free shipping',
                            delivery_estimate: {
                                minimum: {unit: 'business_day', value: 5},
                                maximum: {unit: 'business_day', value: 7},
                            },
                        },
                    }
                ];
            }
        } else {
            params.shipping_options =  [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {amount: 0, currency: 'usd'},
                        display_name: 'Free shipping',
                        delivery_estimate: {
                            minimum: {unit: 'business_day', value: 5},
                            maximum: {unit: 'business_day', value: 7},
                        },
                    },
                }
            ];
        }

        // need to know where to ship it
        params.shipping_address_collection = {
            allowed_countries: ['US']
        }

        const order = await PaymentService.createOrder(params, bookId);
        params.success_url = `${config.express.url}/account/orders/${order._id}`;
        params.cancel_url = `${config.express.url}/editor/${bookId}?cancel=true`;
        const ret = await PaymentService.checkout(params, bookId, order._id);
        req.session.orderId = ret.orderId;
        res.json({
            url: ret.url
        });
    } catch (err) {
        console.log(err);
        return next(err)
    }
}

