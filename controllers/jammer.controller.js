const JamService = require('@jambooks/shared/services/jam.service');
const MessagingService = require('@jambooks/shared/services')('Messaging');

exports.invite = async (req, res, next) => {
    try {
        let retJson = {};
        if (req.jam.jammers[req.body.phoneNumber] !== undefined) {
            next({ message: 'Jammer already invited', status: 400 });
        } else {
            // format message
            let message = req.body.message;
            let jammer = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                numReplies: 0,
                numTexts: 0,
                numCue: 0,
                status: 'invited'
            }
            req.jam.jammers[req.body.phoneNumber] = jammer;
            req.jam.inviteMessage = req.body.inviteMessage;
            let id = `jammers.${req.body.phoneNumber}`;
            let sets = {
                inviteMessage: req.body.inviteMessage,
                [id]: jammer
            };
            console.log(sets, req.jam);
            await JamService.updateJamByUserId(req.params.id, req.session.user._id, sets);
            // await jamsModel.updateOne({_id: jamsModel.getObjectId(req.params.id)}, sets);
            const ret = await MessagingService.send(
                `${req.body.phoneNumber}`,
                message,
                ['https://s3.us-west-2.amazonaws.com/media-dev.jambooks.co/infographic.jpeg'],
                req.jam.phoneNumber);
            console.log(ret);
            res.json(retJson);
        }
    } catch (err) {
        return next(err);
    }
}

exports.index = async (req, res, next) => {
    try {
        const prompts = {};
        if (req.jam.prompts) {
            req.jam.prompts.forEach(pt => {
                prompts[pt.ts.toISOString()] = pt.text;
            });
        }
        if (req.jam.jammers !== undefined) {
            let ret = Object.keys(req.jam.jammers).map(id => {
                return Object.assign(
                    {phoneNumber: id},
                    req.jam.jammers[id],
                    { currentPrompt: prompts[req.jam.jammers[id].prompt] });
            });

            const jamboss = Object.values(req.jam.jammers)[0];
            ret = {
                jammers: ret
            }
            ret.invite = `Hello! ${jamboss.firstName} ${jamboss.lastName} would like to invite you to do a collaborative texted photobook. We're so excited to Jam with you. Reply JAM to get started!`;
            res.json(ret);
        } else {
            res.json([]);
        }
    } catch (err) {
        return next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const {phone, firstName, lastName, status } = req.body;
        const update = {};
        if (firstName) {
            update[`jammers.${phone}.firstName`] = firstName;
        }
        if (lastName) {
            update[`jammers.${phone}.lastName`] = lastName;
        }
        if (status) {
            update[`jammers.${phone}.status`] = status;
        }
        await JamService.updateJamByUserId(req.jam._id, req.session.user._id, update);
        res.status(201).send();
    } catch (err) {
        return next(err)
    }
}

exports.delete = async (req, res, next) => {
    try {
        await JamService.updateJamByUserId(
            req.params.id,
            req.session.user._id,
            { $unset: { [`jammers.${req.params.phone}`]: '' } });
        res.status(201).send();
    } catch (err) {
        return next(err);
    }
};