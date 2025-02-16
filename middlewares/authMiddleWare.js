const config = require('@jambooks/shared/config');

module.exports = (req, res, next) => {
    if (req.session.user || req.headers?.authorization?.split(' ')[1] === config.api.token) {
        next();
    } else {
        const err = new Error('Session expired');
        err.status = 401;
        next(err);
    }
};
