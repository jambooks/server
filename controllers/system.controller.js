const { addJob } = require('shared/lib/bull');

exports.bullSetup = async (req, res, next) => {
    try {
        await addJob('prompts', 'everyMinute', {}, { repeat: { every: 60000 }});
        res.sendStatus(201);
    } catch (err) {
        return next(err);
    }
}

exports.finishOneTime = async (req, res, next) => {
    try {
        // await addJob('finishJam', 'onetime', {}, { repeat: { every: 60000 }});
        await addJob('finishJam', 'onetime', {});
        res.sendStatus(201);
    } catch (err) {
        return next(err);
    }
}