const StripeCSModel = require('@jambooks/shared/models')('StripeCheckoutSessions');
const StripeLogModel = require('@jambooks/shared/models')('StripeLog');
const { addJob } = require('@jambooks/shared/lib/bull');
const orderService = require('@jambooks/shared/services/order.service');
const stripeService = require('@jambooks/shared/services/stripe.service');
const config = require('@jambooks/shared/config');

exports.webhook = async (req, res, next) => {
    try {
        let event;
        try {
            event = stripeService.constructEvent(req.rawBody, req.headers['stripe-signature']);
            await StripeLogModel.updateOne({id: event.id}, {$set: event}, {upsert: true});

            // Handle the event
            switch (event.type) {
                // case 'account.updated':
                //     // Then define and call a function to handle the event account.updated
                //     break;
                // case 'account.external_account.created':
                //     // Then define and call a function to handle the event account.external_account.created
                //     break;
                // case 'account.external_account.deleted':
                //     // Then define and call a function to handle the event account.external_account.deleted
                //     break;
                // case 'account.external_account.updated':
                //     // Then define and call a function to handle the event account.external_account.updated
                //     break;
                // case 'balance.available':
                //     // Then define and call a function to handle the event balance.available
                //     break;
                // case 'billing_portal.configuration.created':
                //     // Then define and call a function to handle the event billing_portal.configuration.created
                //     break;
                // case 'billing_portal.configuration.updated':
                //     // Then define and call a function to handle the event billing_portal.configuration.updated
                //     break;
                // case 'billing_portal.session.created':
                //     // Then define and call a function to handle the event billing_portal.session.created
                //     break;
                // case 'capability.updated':
                //     // Then define and call a function to handle the event capability.updated
                //     break;
                // case 'cash_balance.funds_available':
                //     // Then define and call a function to handle the event cash_balance.funds_available
                //     break;
                // case 'charge.captured':
                //     // Then define and call a function to handle the event charge.captured
                //     break;
                // case 'charge.expired':
                //     // Then define and call a function to handle the event charge.expired
                //     break;
                // case 'charge.failed':
                //     // Then define and call a function to handle the event charge.failed
                //     break;
                // case 'charge.pending':
                //     // Then define and call a function to handle the event charge.pending
                //     break;
                // case 'charge.refunded':
                //     // Then define and call a function to handle the event charge.refunded
                //     break;
                // case 'charge.succeeded':
                //     // Then define and call a function to handle the event charge.succeeded
                //     break;
                // case 'charge.updated':
                //     // Then define and call a function to handle the event charge.updated
                //     break;
                // case 'charge.dispute.closed':
                //     // Then define and call a function to handle the event charge.dispute.closed
                //     break;
                // case 'charge.dispute.created':
                //     // Then define and call a function to handle the event charge.dispute.created
                //     break;
                // case 'charge.dispute.funds_reinstated':
                //     // Then define and call a function to handle the event charge.dispute.funds_reinstated
                //     break;
                // case 'charge.dispute.funds_withdrawn':
                //     // Then define and call a function to handle the event charge.dispute.funds_withdrawn
                //     break;
                // case 'charge.dispute.updated':
                //     // Then define and call a function to handle the event charge.dispute.updated
                //     break;
                // case 'charge.refund.updated':
                //     // Then define and call a function to handle the event charge.refund.updated
                //     break;
                // case 'checkout.session.async_payment_failed':
                //     // Then define and call a function to handle the event checkout.session.async_payment_failed
                //     break;
                // case 'checkout.session.async_payment_succeeded':
                //     // Then define and call a function to handle the event checkout.session.async_payment_succeeded
                //     break;
                case 'checkout.session.completed':
                    // Then define and call a function to handle the event checkout.session.completed
                    await onComplete(event);
                    break;
                case 'checkout.session.expired':
                    // Then define and call a function to handle the event checkout.session.expired
                    // await PaymentService.expireOrder(event.data.object.id);
                    await orderService.expireOrder(event.data.object.id);
                    break;
                // case 'coupon.created':
                //     // Then define and call a function to handle the event coupon.created
                //     break;
                // case 'coupon.deleted':
                //     // Then define and call a function to handle the event coupon.deleted
                //     break;
                // case 'coupon.updated':
                //     // Then define and call a function to handle the event coupon.updated
                //     break;
                // case 'credit_note.created':
                //     // Then define and call a function to handle the event credit_note.created
                //     break;
                // case 'credit_note.updated':
                //     // Then define and call a function to handle the event credit_note.updated
                //     break;
                // case 'credit_note.voided':
                //     // Then define and call a function to handle the event credit_note.voided
                //     break;
                // case 'customer.created':
                //     // Then define and call a function to handle the event customer.created
                //     break;
                // case 'customer.deleted':
                //     // Then define and call a function to handle the event customer.deleted
                //     break;
                // case 'customer.updated':
                //     // Then define and call a function to handle the event customer.updated
                //     break;
                // case 'customer.discount.created':
                //     // Then define and call a function to handle the event customer.discount.created
                //     break;
                // case 'customer.discount.deleted':
                //     // Then define and call a function to handle the event customer.discount.deleted
                //     break;
                // case 'customer.discount.updated':
                //     // Then define and call a function to handle the event customer.discount.updated
                //     break;
                // case 'customer.source.created':
                //     // Then define and call a function to handle the event customer.source.created
                //     break;
                // case 'customer.source.deleted':
                //     // Then define and call a function to handle the event customer.source.deleted
                //     break;
                // case 'customer.source.expiring':
                //     // Then define and call a function to handle the event customer.source.expiring
                //     break;
                // case 'customer.source.updated':
                //     // Then define and call a function to handle the event customer.source.updated
                //     break;
                // case 'customer.subscription.created':
                //     // Then define and call a function to handle the event customer.subscription.created
                //     break;
                // case 'customer.subscription.deleted':
                //     // Then define and call a function to handle the event customer.subscription.deleted
                //     break;
                // case 'customer.subscription.pending_update_applied':
                //     // Then define and call a function to handle the event customer.subscription.pending_update_applied
                //     break;
                // case 'customer.subscription.pending_update_expired':
                //     // Then define and call a function to handle the event customer.subscription.pending_update_expired
                //     break;
                // case 'customer.subscription.trial_will_end':
                //     // Then define and call a function to handle the event customer.subscription.trial_will_end
                //     break;
                // case 'customer.subscription.updated':
                //     // Then define and call a function to handle the event customer.subscription.updated
                //     break;
                // case 'customer.tax_id.created':
                //     // Then define and call a function to handle the event customer.tax_id.created
                //     break;
                // case 'customer.tax_id.deleted':
                //     // Then define and call a function to handle the event customer.tax_id.deleted
                //     break;
                // case 'customer.tax_id.updated':
                //     // Then define and call a function to handle the event customer.tax_id.updated
                //     break;
                // case 'customer_cash_balance_transaction.created':
                //     // Then define and call a function to handle the event customer_cash_balance_transaction.created
                //     break;
                // case 'file.created':
                //     // Then define and call a function to handle the event file.created
                //     break;
                // case 'financial_connections.account.created':
                //     // Then define and call a function to handle the event financial_connections.account.created
                //     break;
                // case 'financial_connections.account.deactivated':
                //     // Then define and call a function to handle the event financial_connections.account.deactivated
                //     break;
                // case 'financial_connections.account.disconnected':
                //     // Then define and call a function to handle the event financial_connections.account.disconnected
                //     break;
                // case 'financial_connections.account.reactivated':
                //     // Then define and call a function to handle the event financial_connections.account.reactivated
                //     break;
                // case 'financial_connections.account.refreshed_balance':
                //     // Then define and call a function to handle the event financial_connections.account.refreshed_balance
                //     break;
                // case 'identity.verification_session.canceled':
                //     // Then define and call a function to handle the event identity.verification_session.canceled
                //     break;
                // case 'identity.verification_session.created':
                //     // Then define and call a function to handle the event identity.verification_session.created
                //     break;
                // case 'identity.verification_session.processing':
                //     // Then define and call a function to handle the event identity.verification_session.processing
                //     break;
                // case 'identity.verification_session.requires_input':
                //     // Then define and call a function to handle the event identity.verification_session.requires_input
                //     break;
                // case 'identity.verification_session.verified':
                //     // Then define and call a function to handle the event identity.verification_session.verified
                //     break;
                // case 'invoice.created':
                //     // Then define and call a function to handle the event invoice.created
                //     break;
                // case 'invoice.deleted':
                //     // Then define and call a function to handle the event invoice.deleted
                //     break;
                // case 'invoice.finalization_failed':
                //     // Then define and call a function to handle the event invoice.finalization_failed
                //     break;
                // case 'invoice.finalized':
                //     // Then define and call a function to handle the event invoice.finalized
                //     break;
                // case 'invoice.marked_uncollectible':
                //     // Then define and call a function to handle the event invoice.marked_uncollectible
                //     break;
                // case 'invoice.paid':
                //     // Then define and call a function to handle the event invoice.paid
                //     break;
                // case 'invoice.payment_action_required':
                //     // Then define and call a function to handle the event invoice.payment_action_required
                //     break;
                // case 'invoice.payment_failed':
                //     // Then define and call a function to handle the event invoice.payment_failed
                //     break;
                // case 'invoice.payment_succeeded':
                //     // Then define and call a function to handle the event invoice.payment_succeeded
                //     break;
                // case 'invoice.sent':
                //     // Then define and call a function to handle the event invoice.sent
                //     break;
                // case 'invoice.upcoming':
                //     // Then define and call a function to handle the event invoice.upcoming
                //     break;
                // case 'invoice.updated':
                //     // Then define and call a function to handle the event invoice.updated
                //     break;
                // case 'invoice.voided':
                //     // Then define and call a function to handle the event invoice.voided
                //     break;
                // case 'invoiceitem.created':
                //     // Then define and call a function to handle the event invoiceitem.created
                //     break;
                // case 'invoiceitem.deleted':
                //     // Then define and call a function to handle the event invoiceitem.deleted
                //     break;
                // case 'invoiceitem.updated':
                //     // Then define and call a function to handle the event invoiceitem.updated
                //     break;
                // case 'issuing_authorization.created':
                //     // Then define and call a function to handle the event issuing_authorization.created
                //     break;
                // case 'issuing_authorization.updated':
                //     // Then define and call a function to handle the event issuing_authorization.updated
                //     break;
                // case 'issuing_card.created':
                //     // Then define and call a function to handle the event issuing_card.created
                //     break;
                // case 'issuing_card.updated':
                //     // Then define and call a function to handle the event issuing_card.updated
                //     break;
                // case 'issuing_cardholder.created':
                //     // Then define and call a function to handle the event issuing_cardholder.created
                //     break;
                // case 'issuing_cardholder.updated':
                //     // Then define and call a function to handle the event issuing_cardholder.updated
                //     break;
                // case 'issuing_dispute.closed':
                //     // Then define and call a function to handle the event issuing_dispute.closed
                //     break;
                // case 'issuing_dispute.created':
                //     // Then define and call a function to handle the event issuing_dispute.created
                //     break;
                // case 'issuing_dispute.funds_reinstated':
                //     // Then define and call a function to handle the event issuing_dispute.funds_reinstated
                //     break;
                // case 'issuing_dispute.submitted':
                //     // Then define and call a function to handle the event issuing_dispute.submitted
                //     break;
                // case 'issuing_dispute.updated':
                //     // Then define and call a function to handle the event issuing_dispute.updated
                //     break;
                // case 'issuing_transaction.created':
                //     // Then define and call a function to handle the event issuing_transaction.created
                //     break;
                // case 'issuing_transaction.updated':
                //     // Then define and call a function to handle the event issuing_transaction.updated
                //     break;
                // case 'mandate.updated':
                //     // Then define and call a function to handle the event mandate.updated
                //     break;
                // case 'order.created':
                //     // Then define and call a function to handle the event order.created
                //     break;
                // case 'payment_intent.amount_capturable_updated':
                //     // Then define and call a function to handle the event payment_intent.amount_capturable_updated
                //     break;
                // case 'payment_intent.canceled':
                //     // Then define and call a function to handle the event payment_intent.canceled
                //     break;
                // case 'payment_intent.created':
                //     // Then define and call a function to handle the event payment_intent.created
                //     break;
                // case 'payment_intent.partially_funded':
                //     // Then define and call a function to handle the event payment_intent.partially_funded
                //     break;
                // case 'payment_intent.payment_failed':
                //     // Then define and call a function to handle the event payment_intent.payment_failed
                //     break;
                // case 'payment_intent.processing':
                //     // Then define and call a function to handle the event payment_intent.processing
                //     break;
                // case 'payment_intent.requires_action':
                //     // Then define and call a function to handle the event payment_intent.requires_action
                //     break;
                // case 'payment_intent.succeeded':
                //     // Then define and call a function to handle the event payment_intent.succeeded
                //     break;
                // case 'payment_link.created':
                //     // Then define and call a function to handle the event payment_link.created
                //     break;
                // case 'payment_link.updated':
                //     // Then define and call a function to handle the event payment_link.updated
                //     break;
                // case 'payment_method.attached':
                //     // Then define and call a function to handle the event payment_method.attached
                //     break;
                // case 'payment_method.automatically_updated':
                //     // Then define and call a function to handle the event payment_method.automatically_updated
                //     break;
                // case 'payment_method.detached':
                //     // Then define and call a function to handle the event payment_method.detached
                //     break;
                // case 'payment_method.updated':
                //     // Then define and call a function to handle the event payment_method.updated
                //     break;
                // case 'payout.canceled':
                //     // Then define and call a function to handle the event payout.canceled
                //     break;
                // case 'payout.created':
                //     // Then define and call a function to handle the event payout.created
                //     break;
                // case 'payout.failed':
                //     // Then define and call a function to handle the event payout.failed
                //     break;
                // case 'payout.paid':
                //     // Then define and call a function to handle the event payout.paid
                //     break;
                // case 'payout.updated':
                //     // Then define and call a function to handle the event payout.updated
                //     break;
                // case 'person.created':
                //     // Then define and call a function to handle the event person.created
                //     break;
                // case 'person.deleted':
                //     // Then define and call a function to handle the event person.deleted
                //     break;
                // case 'person.updated':
                //     // Then define and call a function to handle the event person.updated
                //     break;
                // case 'plan.created':
                //     // Then define and call a function to handle the event plan.created
                //     break;
                // case 'plan.deleted':
                //     // Then define and call a function to handle the event plan.deleted
                //     break;
                // case 'plan.updated':
                //     // Then define and call a function to handle the event plan.updated
                //     break;
                // case 'price.created':
                //     // Then define and call a function to handle the event price.created
                //     break;
                // case 'price.deleted':
                //     // Then define and call a function to handle the event price.deleted
                //     break;
                // case 'price.updated':
                //     // Then define and call a function to handle the event price.updated
                //     break;
                // case 'product.created':
                //     // Then define and call a function to handle the event product.created
                //     break;
                // case 'product.deleted':
                //     // Then define and call a function to handle the event product.deleted
                //     break;
                // case 'product.updated':
                //     // Then define and call a function to handle the event product.updated
                //     break;
                // case 'promotion_code.created':
                //     // Then define and call a function to handle the event promotion_code.created
                //     break;
                // case 'promotion_code.updated':
                //     // Then define and call a function to handle the event promotion_code.updated
                //     break;
                // case 'quote.accepted':
                //     // Then define and call a function to handle the event quote.accepted
                //     break;
                // case 'quote.canceled':
                //     // Then define and call a function to handle the event quote.canceled
                //     break;
                // case 'quote.created':
                //     // Then define and call a function to handle the event quote.created
                //     break;
                // case 'quote.finalized':
                //     // Then define and call a function to handle the event quote.finalized
                //     break;
                // case 'radar.early_fraud_warning.created':
                //     // Then define and call a function to handle the event radar.early_fraud_warning.created
                //     break;
                // case 'radar.early_fraud_warning.updated':
                //     // Then define and call a function to handle the event radar.early_fraud_warning.updated
                //     break;
                // case 'recipient.created':
                //     // Then define and call a function to handle the event recipient.created
                //     break;
                // case 'recipient.deleted':
                //     // Then define and call a function to handle the event recipient.deleted
                //     break;
                // case 'recipient.updated':
                //     // Then define and call a function to handle the event recipient.updated
                //     break;
                // case 'reporting.report_run.failed':
                //     // Then define and call a function to handle the event reporting.report_run.failed
                //     break;
                // case 'reporting.report_run.succeeded':
                //     // Then define and call a function to handle the event reporting.report_run.succeeded
                //     break;
                // case 'review.closed':
                //     // Then define and call a function to handle the event review.closed
                //     break;
                // case 'review.opened':
                //     // Then define and call a function to handle the event review.opened
                //     break;
                // case 'setup_intent.canceled':
                //     // Then define and call a function to handle the event setup_intent.canceled
                //     break;
                // case 'setup_intent.created':
                //     // Then define and call a function to handle the event setup_intent.created
                //     break;
                // case 'setup_intent.requires_action':
                //     // Then define and call a function to handle the event setup_intent.requires_action
                //     break;
                // case 'setup_intent.setup_failed':
                //     // Then define and call a function to handle the event setup_intent.setup_failed
                //     break;
                // case 'setup_intent.succeeded':
                //     // Then define and call a function to handle the event setup_intent.succeeded
                //     break;
                // case 'sigma.scheduled_query_run.created':
                //     // Then define and call a function to handle the event sigma.scheduled_query_run.created
                //     break;
                // case 'sku.created':
                //     // Then define and call a function to handle the event sku.created
                //     break;
                // case 'sku.deleted':
                //     // Then define and call a function to handle the event sku.deleted
                //     break;
                // case 'sku.updated':
                //     // Then define and call a function to handle the event sku.updated
                //     break;
                // case 'source.canceled':
                //     // Then define and call a function to handle the event source.canceled
                //     break;
                // case 'source.chargeable':
                //     // Then define and call a function to handle the event source.chargeable
                //     break;
                // case 'source.failed':
                //     // Then define and call a function to handle the event source.failed
                //     break;
                // case 'source.mandate_notification':
                //     // Then define and call a function to handle the event source.mandate_notification
                //     break;
                // case 'source.refund_attributes_required':
                //     // Then define and call a function to handle the event source.refund_attributes_required
                //     break;
                // case 'source.transaction.created':
                //     // Then define and call a function to handle the event source.transaction.created
                //     break;
                // case 'source.transaction.updated':
                //     // Then define and call a function to handle the event source.transaction.updated
                //     break;
                // case 'subscription_schedule.aborted':
                //     // Then define and call a function to handle the event subscription_schedule.aborted
                //     break;
                // case 'subscription_schedule.canceled':
                //     // Then define and call a function to handle the event subscription_schedule.canceled
                //     break;
                // case 'subscription_schedule.completed':
                //     // Then define and call a function to handle the event subscription_schedule.completed
                //     break;
                // case 'subscription_schedule.created':
                //     // Then define and call a function to handle the event subscription_schedule.created
                //     break;
                // case 'subscription_schedule.expiring':
                //     // Then define and call a function to handle the event subscription_schedule.expiring
                //     break;
                // case 'subscription_schedule.released':
                //     // Then define and call a function to handle the event subscription_schedule.released
                //     break;
                // case 'subscription_schedule.updated':
                //     // Then define and call a function to handle the event subscription_schedule.updated
                //     break;
                // case 'tax_rate.created':
                //     // Then define and call a function to handle the event tax_rate.created
                //     break;
                // case 'tax_rate.updated':
                //     // Then define and call a function to handle the event tax_rate.updated
                //     break;
                // case 'terminal.reader.action_failed':
                //     // Then define and call a function to handle the event terminal.reader.action_failed
                //     break;
                // case 'terminal.reader.action_succeeded':
                //     // Then define and call a function to handle the event terminal.reader.action_succeeded
                //     break;
                // case 'test_helpers.test_clock.advancing':
                //     // Then define and call a function to handle the event test_helpers.test_clock.advancing
                //     break;
                // case 'test_helpers.test_clock.created':
                //     // Then define and call a function to handle the event test_helpers.test_clock.created
                //     break;
                // case 'test_helpers.test_clock.deleted':
                //     // Then define and call a function to handle the event test_helpers.test_clock.deleted
                //     break;
                // case 'test_helpers.test_clock.internal_failure':
                //     // Then define and call a function to handle the event test_helpers.test_clock.internal_failure
                //     break;
                // case 'test_helpers.test_clock.ready':
                //     // Then define and call a function to handle the event test_helpers.test_clock.ready
                //     break;
                // case 'topup.canceled':
                //     // Then define and call a function to handle the event topup.canceled
                //     break;
                // case 'topup.created':
                //     // Then define and call a function to handle the event topup.created
                //     break;
                // case 'topup.failed':
                //     // Then define and call a function to handle the event topup.failed
                //     break;
                // case 'topup.reversed':
                //     // Then define and call a function to handle the event topup.reversed
                //     break;
                // case 'topup.succeeded':
                //     // Then define and call a function to handle the event topup.succeeded
                //     break;
                // case 'transfer.created':
                //     // Then define and call a function to handle the event transfer.created
                //     break;
                // case 'transfer.reversed':
                //     // Then define and call a function to handle the event transfer.reversed
                //     break;
                // case 'transfer.updated':
                //     // Then define and call a function to handle the event transfer.updated
                //     break;
                // // ... handle other event types
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
            res.send();
        } catch (err) {
            console.log(err);
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    } catch (err) {
        return next(err)
    }
}

const onComplete = async (event) => {
    const checkoutSessionId = event.data.object.id;
    const order = await orderService.getOrderByCheckoutSessionid(checkoutSessionId);
    let { jamStatus, orderStatus } = {...order};
    // console.log(jamStatus, orderStatus);
    if (orderStatus === 'created') {
        if (!jamStatus) { // new jam
            await completeNewJam(checkoutSessionId, order);
        } else {
            await completeOrder(checkoutSessionId, order);
        }
    } else {
        console.log('You cannot reapply a payment ', checkoutSessionId, orderStatus);
    }
}

const completeNewJam = async (checkoutSessionId) => {
    return orderService.completeOrder(checkoutSessionId)
        .catch(err => {
            console.log('ERR', err);
        });
}

const completeOrder = (checkoutSessionId, order) => {
    let cs;
    stripeService.retrieveSession(checkoutSessionId, {
        expand: ['line_items', 'payment_intent.payment_method'],
    })
        .then(sessionWithLineItems => {
            cs = sessionWithLineItems;
            // upsert because we want to replace the record and not create a new one every time the payment is applied
            return StripeCSModel.updateOne(
                { id: checkoutSessionId },
                { $set: cs },
                { upsert: true }
            );
        })
        .then(() => {
            const toSet = {
                status: 'paid',
                statusDate: new Date(),
                amountTotal:  cs.amount_total,
                amountSubtotal: cs.amount_subtotal,
                amountTax: cs.total_details.amount_tax,
                amountShipping: cs.total_details.amount_shipping,
                amountDiscount: cs.total_details.amount_discount
            };

            if (cs.shipping_details) {
                toSet.shipping = cs.shipping_details;
            }

            if (cs.customer_details) {
                toSet.customer = cs.customer_details;
                toSet.customer.id = cs.customer;
            }

            toSet.payment = {
                amount: cs.payment_intent.amount,
                brand: cs.payment_intent.payment_method.card.brand,
                created: cs.payment_intent.created,
                currency: cs.payment_intent.currency,
                expMonth: cs.payment_intent.payment_method.card.exp_month,
                expYear: cs.payment_intent.payment_method.card.exp_year,
                funding: cs.payment_intent.payment_method.card.funding,
                id: cs.payment_intent.id,
                last4: cs.payment_intent.payment_method.card.last4,
                paymentType: cs.payment_intent.payment_method.type
            }
            return orderService.updateByCheckoutSession(checkoutSessionId, { $set: toSet });
            // return;
        })
        .then(() => {
            let digitalCopy = false;
            let format = 'soft';
            let proms = [];
            order.items.forEach(item => {
                if (item.product === config.inventory.digitalBook.product) {
                    digitalCopy = true;
                }
                if (item.product === config.inventory.hardCoverUpgrade.product) {
                    format = 'hard';
                }
            })

            proms.push(addJob('publishBook', 'publish', {
                bookId: order.bookId,
                orderId: order._id.toString(),
                format
            }));

            if (digitalCopy) {
                proms.push(addJob('publishBook', 'publish', {
                    bookId: order.bookId,
                        orderId: order._id.toString(),
                        format: 'digital'
                }));
            }

            return Promise.all(proms);
        })
        .catch(err => {
            console.log(err);
        });
}