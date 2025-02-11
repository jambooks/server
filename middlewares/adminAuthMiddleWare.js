module.exports = (req, res, next) => {
    if (req.session.user) {
        if (req.session.user.type === 'admin') {
            next();
        } else {
            const err = new Error('Not an admin');
            err.status = 401;
            next(err);
        }
    } else {
        const err = new Error('Session expired');
        err.status = 401;
        next(err);
    }
};
