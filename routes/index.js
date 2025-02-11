module.exports = (app) => {
    app.use('/api', require('./api'));
    app.use('/alexanders', require('./alexanders.routes'));
    app.use('/stripecom', require('./stripe.routes'));
};
