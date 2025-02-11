const stripe = require('shared/lib/stripe');
const userModel = require('shared/models')('User');

exports.getStripeCustomer = async (req, res, next) => {
    try {
        if (req.session.user.stripeId !== undefined) {
            const customer = await stripe.customers.retrieve(req.session.user.stripeId, {expand: ['sources']});
            // const methods = await stripe.customers.listPaymentMethods(req.session.user.stripeId, {type: 'card'});
            // const methods = await stripe.customers.listPaymentMethods(req.session.user.stripeId);
            // console.log(customer, JSON.stringify(methods));
            res.json(customer);
        } else {
            res.json({});
        }
    } catch (err) {
        console.log(err);
        return next(err);
    }
}

exports.charges = async (req, res, next) => {
    try {
        if (req.session.user.stripeId !== undefined) {
            const charges = await stripe.charges.list({
                customer: req.session.user.stripeId,
                limit: 3
            });
            const ret = charges.data.map(charge => {
                return {
                    amount: charge.amount,
                    calculated_statement_descriptor: charge.calculated_statement_descriptor,
                    captured: charge.captured,
                    created: charge.created,
                    currancy: charge.currancy,
                    description: charge.description,
                    method: charge.payment_method_details.card.brand,
                    methodExpireMonth: charge.payment_method_details.card.exp_month,
                    methodExpireYear: charge.payment_method_details.card.exp_year,
                    methodLas4: charge.payment_method_details.card.last4
                }
            })
            res.json(ret);
        } else {
            res.json({});
        }
    } catch (err) {
        return next(err)
    }
}

exports.charge = async (req, res, next) => {
    const items = {
        'defaultBook': {
            price: 2756
        }
    }
    try {
        const source = req?.body?.token;
        const itemId = req?.body?.itemId;
        // const sourceId = source?.id || req?.body?.paymentTypeId;


        /*
        req.body
        {
            token: {
                id: 'tok_1KxlD9Kp9a9ucLTOcZNYvgSz',
                    object: 'token',
                    card: {
                    id: 'card_1KxlD9Kp9a9ucLTO4zLrZCdN',
                        object: 'card',
                        address_city: null,
                        address_country: null,
                        address_line1: '79 North Wellington Drive',
                        address_line1_check: 'unchecked',
                        address_line2: null,
                        address_state: null,
                        address_zip: '44454',
                        address_zip_check: 'unchecked',
                        brand: 'Visa',
                        country: 'US',
                        cvc_check: 'unchecked',
                        dynamic_last4: null,
                        exp_month: 11,
                        exp_year: 2022,
                        funding: 'credit',
                        last4: '1111',
                        name: 'Fred G Larsen',
                        tokenization_method: null
                },
                client_ip: '172.56.41.228',
                    created: 1652158935,
                    livemode: false,
                    type: 'card',
                    used: false
            },
            itemId: 'defaultBook'
        }
        */

        if (req.session.user.stripeId === undefined) {
            // create new client
            const customer = await stripe.customers.create({
                email: req.session.user.email,
                name: req.session.user.firstName + ' ' + req.session.user.lastName,
                address: source.address_line1,
                phone: req.session.user.phone,
                source: source.id
            });

            // set stripId on user = customer.id
            await userModel.updateOne({_id: userModel.getObjectId(req.session.user._id)}, {$set: {stripeId: customer.id}});
            // set user in session with stripeId
            req.session.user.stripeId = customer.id;
        }

        const charge = {
            amount: items[itemId].price,
            currency: 'usd',
            customer: req.session.user.stripeId,
            description: 'Default book',
            metadata: {
                jamId: req.body.jamId
            }
        };

        return stripe.charges.create(charge)
            .then((charged) => {
                console.log(charged); // do we need to save something here?
                res.status(200).send({});
            })
            .catch(error => {
                console.log(error);
                res.status(402).send(error);
            });

        // check the session for a promo code

    } catch (err) {
        return next(err);
    }
};
