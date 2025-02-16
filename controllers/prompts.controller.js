const PromptModel = require('@jambooks/shared/models')('Prompts');

exports.list = async (req, res, next) => {
    try {
        const result = await PromptModel.find({typeId: PromptModel.getObjectId(req.params.typeId)}).toArray();
        res.json(result);
    } catch (err) {
        return next(err);
    }
}

exports.update = async (req, res, next) => {
    try {
        if (req.body.text === '') {
            return next({status: 400, message: 'Prompt text is required.'});
        }
        let obj = Object.assign({}, req.body);
        obj._id = PromptModel.getObjectId(obj._id);
        obj.typeId = PromptModel.getObjectId(obj.typeId);

        await PromptModel.replaceOne({_id: PromptModel.getObjectId(req.params.id)}, obj);
        res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

exports.create = async (req, res, next) => {
    try {
        if (req.body.text === '') {
            return next({status: 400, message: 'Prompt text is required.'});
        }
        let obj = Object.assign({}, req.body);
        obj.typeId = PromptModel.getObjectId(obj.typeId);
        await PromptModel.insertOne( obj );

        res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

exports.delete = async (req, res, next) => {
    try {
        await PromptModel.deleteOne({_id: PromptModel.getObjectId(req.params.id)});
        res.status(204).send();
    } catch (err) {
        return next(err);
    }
}