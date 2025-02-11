const StripeRouter = require('express').Router();
const stripeController = require('controllers/stripe.controller');
const express = require('express');

StripeRouter.use(express.raw('application/json'));
StripeRouter.route('/webhook').post(
    // express.raw({type: 'application/json'}),
    // express.raw(),
    stripeController.webhook
);

module.exports = StripeRouter;