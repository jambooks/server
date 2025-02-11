const authenticationService = require('shared/services/auth.services');
const bcrypt = require('bcryptjs');
const config = require('shared/config');
const emailService = require('shared/services/email.service');
const messagingService = require('shared/services/')('Messaging');
const userModel = require('shared/models')('User');
const { ObjectId } = require('mongodb')

exports.forgot = async (req, res, next) => {
    try {
        const resetToken = await authenticationService.requestPasswordReset(req.body.email);
        await emailService.sendResetLink(req.body.email, resetToken);
        res.sendStatus(201);
    } catch (err) {
        if (err.message === 'User not found') {
            res.sendStatus(201);
        } else {
            next(err);
        }
    }
}

exports.reset = async (req, res, next) => {
    try {
        await authenticationService.resetPassword(req.body.token, req.body.passwd);
        res.sendStatus(201);
    } catch (err) {
        next({status: 400, message: err.message });
    }
}

exports.register = async (req, res, next) => {
    try {
        req.body.password = bcrypt.hashSync(req.body.pass, 10);
        req.body.type = 'boss';
        req.body.emailConfirm = false;
        delete req.body.mfa;
        delete req.body.pass;
        let user = null;
        userModel.findOne({phone: req.body.phone})
            .then(res => {
                if (res) {
                    next({message: 'register.alreadRegistered'});
                } else {
                    return userModel.insertOne({
                        email: req.body.email,
                        emailConfirm: req.body.emailConfirm,
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        password: req.body.password,
                        phone: req.body.phone,
                        type: req.body.type
                    }, { returnRecord: true });
                }
            })
            .then(usr => {
                delete usr.password;
                user = usr;
                return emailService.sendEmailConfirmationLink(user.email, user._id);
            })
            .then(() => {
                res.json(user);
            })
            .catch(err => {
                return next(err);
            });
    } catch (err) {
        return next(err);
    }
}

exports.login = async (req, res, next) => {
    let retJson = {
        error: false,
    };

    try {
        const user = await authenticationService.loginUser(req.body.phone, req.body.pass);
        req.session.user = user;
        retJson.data = {
            user,
            stripe_key: config.stripe.key
        };
        return res.json(retJson).status(200);
    } catch (err) {
        return next({ status: '401', message: err.message });
    }
}

exports.check = async (req, res, next) => {
    try {
        if (req.session.user !== undefined) {
            res.json({
                profile: req.session.user,
                stripe_key: config.stripe.key
            });
        } else {
            next({status: 403, message: 'Session expired'})
        }
    } catch (err) {
        return next(err);
    }
}

exports.logout = async (req, res) => {
    delete req.session.user;
    res.json({});
}

exports.join = async (req, res, next) => {
    try {
        const user = await userModel.findOne({phone: req.body.phone});
        if (user !== null) {
            next({message: 'register.alreadRegistered', status: 400});
        } else {
            req.session.regCode = Math.floor(
                Math.random() * (999999 - 100000) + 100000
            );

            messagingService.send(req.body.phone, 'Your JamBooks verification code is ' + req.session.regCode)
                .then(() => {
                    res.json({});
                    console.log('COUNT:', messagingService.cnt);
                })
                .catch(err => next(err));
        }
    } catch (err) {
        return next(err);
    }
}

exports.verifyCode = async (req, res, next) => {
    try {
        if (req.session.regCode && req.session.regCode === parseInt(req.body.code)) {
            res.json({});
        } else {
            next({message: 'register.mfaBad', status: 400});
        }
    } catch (err) {
        return next(err);
    }
}

exports.verifyEmail = async (req, res, next) => {
    try {
        await userModel.updateOne({_id: ObjectId(req.params.key)}, {$set: { emailConfirm: true }});
        res.json({});
    } catch (err) {
        return next(err);
    }
}

exports.suid = async (req, res, next) => {
    try {
        const user = await userModel.findOne({_id: userModel.getObjectId(req.body.id)}, {projection: {password: false}});
        if (!user) {
            next({status: 404, message: 'User now found'});
        } else {
            req.session.suid = req.session.user._id;
            req.session.user = user;
            req.session.user.type = 'admin';
            let retJson = {user};
            res.json(retJson);
        }
    } catch (err) {
        return next(err)
    }
}