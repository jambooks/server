const userModel = require('shared/models')('User');
const { makePassword } = require('lib/passwd');
const { ObjectId } = require('mongodb');

exports.update = async (req, res, next) => {
    // userModel.setUser(req.session.user);
    try {
        delete req.body._id;
        await userModel.updateOne({_id: req.session.user._id}, {$set: req.body});
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
}

exports.index = async (req, res, next) => {
    try {
        res.json(await userModel.findOne({_id: req.session.user._id}, {projection: {password: false, type: false}}));
    } catch (err) {
        return next(err);
    }
}

exports.updatePassword = async (req, res, next) => {
    try {
        const user = await userModel.findOne({_id: req.body.userId});
        if (!user) {
            return next({status: 404, message: 'User not found.'});
        } else {
            await userModel.updateOne({_id: user._id}, {$set: {password: makePassword(req.body.pass)}});
            res.sendStatus(201);
        }
    } catch (err) {
        return next(err);
    }
}

exports.search = async (req, res, next) => {
    try {
        let qry = {};
        if (req.query.search !== '') {
            qry = {
                $or: [
                    {firstName: { '$regex': `.*${req.query.search}.*`, '$options': 'i' }},
                    {lastName:  { '$regex': `.*${req.query.search}.*`, '$options': 'i' }},
                    {phone:  { '$regex': `.*${req.query.search}.*`, '$options': 'i' }}
                ]
            }
        }
        res.json(await userModel.find(qry, {projection: {password: false}}).toArray());
    } catch (err) {
        return next(err)
    }
}

exports.adminUpdate = async (req, res, next) => {
    try {
        delete req.body._id;
        await userModel.updateOne({_id: ObjectId(req.params.id)}, {$set: req.body});
        res.json({});
    } catch (err) {
        return next(err);
    }
}