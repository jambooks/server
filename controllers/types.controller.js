const TypeModel = require('shared/models')('Types');
const PromptModel = require('shared/models')('Prompts');

exports.list = async (req, res, next) => {
    try {
        const result = await TypeModel.find({lang: req.query.lang}, {projection: {"id": "$_id", group: 1, name: 1, _id: false, lang: 1}}).toArray();
        res.json(result);
    } catch (err) {
        return next(err);
    }
}

exports.delete = async (req, res, next) => {
    try {
        await TypeModel.deleteOne({_id: TypeModel.getObjectId(req.params.id)});
        await PromptModel.deleteMany({typeId: PromptModel.getObjectId(req.params.id)});
        res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

exports.update = async (req, res, next) => {
    try {
        if (req.body.name === '') {
            return next({status: 400, message: 'Jam Type name is required.'});
        }
        if (req.body.group === '') {
            return next({status: 400, message: 'You must select a group.'});
        }
        if (req.body.id === 'new') {
            await TypeModel.insertOne({ name: req.body.name, group: req.body.group, lang: req.body.lang });
        } else {
            await TypeModel.replaceOne({_id: TypeModel.getObjectId(req.body.id) }, {_id: TypeModel.getObjectId(req.body.id), name: req.body.name, group: req.body.group, lang: req.body.lang });
        }
        res.status(204).send();
    } catch (err) {
        return next(err);
    }
}