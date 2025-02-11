const config = require('shared/config');

exports.getSoftCoverBookPricing = (req, res, next) => {
    try {
        res.json({
            price: config.inventory.softCoverBook.price
        });
    } catch (err) {
        return next(err);
    }
}