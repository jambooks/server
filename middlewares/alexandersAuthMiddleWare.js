const config = require('@jambooks/shared/config');

module.exports = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || '';

    if (!apiKey) {
        next({
            status: 401,
            message: 'API Key is required'
        });
    } else if (apiKey && apiKey !== config.alexanders.apiKey) {
        next({status: 401, message: 'Invalid API Key'});
    } else {
        next();
    }
};
