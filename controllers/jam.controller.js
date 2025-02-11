const { Book } = require('shared/lib/book');
const JamPromptService = require('shared/services/jam-prompt.service');
const JamService = require('shared/services/jam.service');
const MessagingService = require('shared/services')('Messaging');
const awsService = require('shared/services/aws.service');
const bookService = require('shared/services/book.service');
const config = require('shared/config');
const typesService = require('shared/services/types.service');
const typeModel = require('shared/models')('Types');

exports.deleteJam = async (req, res, next) => {
    try {
        JamService.deleteJamByUserId(req.params.id, req.session.user._id)
            .then(() => {
                if (req.jam.phoneNumber) {
                    return MessagingService.releaseNumber(req.jam.phoneNumber);
                }
            })
            .catch(err => {
                next({status: 404, message: err.message});
            });
        res.status(204).send();
    } catch (err) {
        return next(err)
    }
}

exports.addJam = async (req, res, next) => {
    try {
        const jam = await JamService.createJamByUser(req.session.user);
        res.json(jam);
    } catch (err) {
        return next(err);
    }
}

exports.patchJam = async (req, res, next) => {
    try {
        await JamService.updateJamByUserId(req.params.id, req.session.user._id, req.body);
        res.sendStatus(202);
    } catch (err) {
        return next(err);
    }
}

exports.updateJam = async (req, res, next) => {
    try {
        let doc = {...req.body};
        if (doc.prompts && doc.prompts.length) {
            for (let i = 0; i < doc.prompts.length; i++) {
                doc.prompts[i].ts = new Date(doc.prompts[i].ts);
            }
        }
        delete doc._id;
        delete doc.typeObj;
        if (req.session.user) {
            await JamService.updateJamByUserId(req.params.id, req.session.user._id, doc);
        } else {
            await JamService.updateJam(req.params.id, doc);
        }

        res.status(201).send();
    } catch (err) {
        return next(err);
    }
}

exports.getJams = async (req, res, next) => {
    try {
        res.json(await JamService.getJamsByUserId(req.session.user._id));
    } catch (err) {
        return next(err);
    }
}

exports.getJam = async (req, res, next) => {
    try {
        if (req.jam.type) {
            req.jam.typeObj = await typesService.getById(req.jam.type);
        }
        if (req.jam.prompts) {
            let lastPrompt = req.jam.prompts[req.jam.prompts.length-1];
            let diff = lastPrompt.ts.getTime() - (new Date()).getTime();
            let stimulateDate = -86400000; // 1 day
            if (diff < stimulateDate && req.jam.status !== 'complete') {
                req.jam.action = 'doSomething';
            }
        }

        if (req.jam.status === 'created' && (new Date(req.jam.startDate)).getTime() < (new Date()).getTime()) {
            req.jam.action = 'startJam';
        }

        const jamEndDate = new Date(req.jam.endDate);
        jamEndDate.setHours(23);
        jamEndDate.setMinutes(59);
        jamEndDate.setSeconds(59);
        if (req.jam.status === 'active' &&
            jamEndDate.getTime() < (new Date()).getTime() &&
            !req.jam.neverEnds
        ) {
            req.jam.action = 'finishJam';
        }

        // check if the book has been created
        if (!req.jam.action && req.jam.status === 'complete') {
            const book = await bookService.findByJamAndUser(req.jam._id, req.session.user._id);
            if (book === null) {
                req.jam.action = 'createBook';
            }
        }

        // if they have created their book do not keep prompting them.
        if (req.jam.status === 'book') {
            delete req.jam.action;
        }

        res.json(req.jam);
    } catch (err) {
        return next(err);
    }
}

/**
 * Creates the new number and prompts. Then saves the jam and sends the jamboss the welcome message.
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.startJam = async (req, res, next) => {
    try {
        if (req.jam.status !== 'setup') {
            return next({status: 400, message: 'Status must be "setup" to call finish.'});
        }
        const jambossPhone = Object.keys(req.jam.jammers)[0]; // first jammer is the jamboss
        const newNumber = await MessagingService.createNumber(req.jam._id);
        const prompts = await JamPromptService.getDefaultPrompts(req.jam);
        await JamService.updateJamByUserId(req.params.id, req.session.user._id, {
            phoneNumber: newNumber,
            status: 'created',
            prompts
        });
        await MessagingService.send(jambossPhone, 'Welcome, Jamboss! We\'re so excited to Jam with you.\n' +
            '\n' +
            'This is your exclusive Jambooks phone number that will be used to send and receive texts from you and your friends to build your Jambook.\n' +
            '\n' +
            'There\'s just two more easy steps to get your Jam going:\n' +
            '\n' +
            'Customize and confirm your Prompts\n' +
            'Invite your Jammers\n' +
            'Click here to get those done!\n' +
            '\n' +
            `${config.express.url}/jam/${req.params.id}`, ['https://s3.us-west-2.amazonaws.com/media-dev.jambooks.co/3rules.jpeg'], newNumber);
        res.status(201).send();
    } catch (err) {
        return next(err)
    }
}

/**
 * Set jam status to complete
 * Set end date to now
 * Remove all future prompts
 * uset neverEnds
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.endJam = async (req, res, next) => {
    try {
        const now = new Date();
        let sets = {};
        if (req.jam.prompts && req.jam.prompts.length) {
            let prompts = [];
            for (let i = 0; i < req.jam.prompts.length; i++) {
                console.log((new Date(req.jam.prompts[i].ts).getTime()), now.getTime(), (new Date(req.jam.prompts[i].ts).getTime()) < now.getTime());
                if ((new Date(req.jam.prompts[i].ts).getTime()) < now.getTime()) {
                    prompts.push({
                        text: req.jam.prompts[i].text,
                        ts: new Date(req.jam.prompts[i].ts)
                    });
                }
            }
            if (prompts.length) {
                sets['prompts'] = prompts;
            }
        }
        sets['status'] = 'complete';
        sets['endDate'] = now.getFullYear() + '-' + ('0' + (now.getMonth()+1)).slice(-2) + '-' + now.getDate()
        let unset = { neverEnds: '' };
        if (!sets.prompts || !sets.prompts.length) {
            unset['prompts'] = '';
        }
        await JamService.updateJam(req.jam._id, { $set: sets, $unset: unset });
        res.sendStatus(200);
    } catch (err) {
        return next(err);
    }
}

exports.deleteAssets = async (req, res, next) => {
    try {
        const data = await awsService.listObjects(req.params.id + '/');
        if (data.Contents) {
            const objects = data.Contents.map(function (object) {
                return { Key: object.Key };
            });

            if (objects.length) {
                await awsService.deleteFiles(objects, { Quiet: true });
            }
        }
        res.status(204).send();
    } catch (err) {
        next({status: 402, message: err.message});
    }
}

exports.createBook = async (req, res, next) => {
    try {
        let book = await bookService.findByJamAndUser(req.params.id, req.session.user._id);
        if (book === null) {
            const bookJson = new Book({
                unit: "px",
                dpi: 72,
                // width: 603, // 8.375 * 72
                width: 738, // 10.25 * 72
                // height: 486, // 6.75 * 72
                height: 594, // 8.25 * 72
                origin: { x: 9.5, y: 5 },
                // column: { width: 250, height: 432, padding: 0 }
                column: { width: 300, height: 540, padding: 0 }
            });

            bookJson.addCoverPage({ background: '#d6682c', editable: false, bleed: bookJson.bleed});

            let prompts = {};
            req.jam.prompts.forEach(pt => {
                prompts[pt.ts.toISOString()] = pt.text;
            });
            // console.log('sorting prompts');
            // sort the log by prmpt then by ts
            req.jam.log.sort((a, b) => {
                if (!a.prompt || !b.prompt) {
                    return -1; // sort logs with no prompt to the start
                } else {
                    if (a.prompt.getTime() === b.prompt.getTime()) {
                        return a.ts < b.ts;
                    } else {
                        return a.prompt.getTime() > b.prompt.getTime() ? 1 : -1;
                    }
                }
            });
            let lastPrompt = '';
            for (const i in req.jam.log) {
                const log = req.jam.log[i];

                if (log.prompt === undefined) {
                    log.prompt = req.jam.prompts[0].ts; // put logs with no prompt under the first prompt
                }

                // if (i > 16) break;
                if (i === 0) {
                    console.log(log);
                }
                const fromName = req.jam.jammers[log.from] ?
                    req.jam.jammers[log.from].firstName.trim() + ' ' + req.jam.jammers[log.from].lastName.trim() :
                    '';
                const prompt = prompts[log.prompt.toISOString()] ?
                    prompts[log.prompt.toISOString()].replace('{VIP_NAME}', req.jam.vipName) :
                    '';

                // create prompt page
                if (lastPrompt !== log.prompt.toISOString() && prompt !== '') {
                    lastPrompt = log.prompt.toISOString();
                    bookJson.addPromptPage(prompt);
                }

                const lg = {
                    from: fromName,
                    text: log.text,
                    images: log.images,
                    promptText: prompt
                }

                for (const img of log.images) {
                    if (img.path === undefined) {
                        continue;
                    }

                    const imgBox = bookJson.createImage(
                        `${ config.express.url }/photos/${img.path}`,
                        // `${ config.aws.s3.url }/${ config.aws.s3.bookBucket }/${img.path}`,
                        5,
                        5,
                        img.width,
                        img.height,
                        bookJson.getColumnWidth(),
                        bookJson.getColumnHeight());
                    bookJson.addToPage2Column(imgBox.width, imgBox.height, imgBox);
                }

                if (lg.text !== '') {
                    const { text, attrib, height, width} = bookJson.createTextAndAttirbution(lg.text, lg.from, bookJson);
                    try {
                        if (text !== undefined) {
                            bookJson.addToPage2Column(width, height, [text, attrib]);
                        }
                    } catch (err) {
                        console.log(err);
                    }
                }
            }

            const bookId = bookService.getObjectId();
            const filePath = `${req.params.id}/books/${bookId.toString()}/book.json`;
            await awsService.saveFile(
                filePath,
                JSON.stringify(bookJson.toJson())
            );
            book = await bookService.create({
                _id: bookId,
                filePath,
                pageCount: bookJson.pages.length,
                coverColor: '#d6682c',
                jamId: req.jam._id,
                userId: req.session.user._id,
                status: 'created'
            });
        }
        res.json(book);
    } catch (err) {
        return next(err);
    }
}

exports.logs = async (req, res, next) => {
    try {
        const jam = req.jam;
        if (jam.log !== undefined) {
            let prompts = {};
            jam.prompts.forEach(pt => {
                prompts[pt.ts.toISOString()] = pt.text;
            });

            let ret = [];
            if (jam.log) {
                jam.log.forEach((lg, index) => {
                    if (lg.prompt && prompts[lg.prompt.toISOString()] === undefined) {
                        console.log('ERROR: no associated prompt ', lg.prompt, index);
                    } else {
                        const log = {
                            txt: lg.text,
                            images: lg.images
                        }
                        if (lg.prompt) {
                            log.prompt = prompts[lg.prompt.toISOString()].replace('{VIP_NAME}', jam.vipName);
                        }

                        if (jam.jammers[lg.from]) {
                            log.jammer = `${jam.jammers[lg.from].firstName} ${jam.jammers[lg.from].lastName}`;
                        } else {
                            log.jammer = 'deleted jammer';
                        }
                        ret.push(log);
                    }
                });
            }

            res.json({ log: ret, bucket:  config.aws.s3.bookBucket });
        } else {
            res.json([]);
        }
    } catch (err) {
        return next(err);
    }
}

exports.logUpdate = async (req, res, next) => {
    try {
        const qry = {
            $set: {
                [`log.${req.params.index - 1}.text`]: req.body.text
            }
        }
        await JamService.updateJamByUserId( req.jam._id, req.session.user._id, qry);
        res.status(201).send();
    } catch (err) {
        return next(err)
    }
}

exports.logDelete = async (req, res, next) => {
    try {
        const qry = {
            $unset: {
                [`log.${req.params.index - 1}`]: 1
            }
        }
        await JamService.updateJamByUserId(req.jam._id, req.session.user._id, qry);
        await JamService.updateJamByUserId(req.jam._id, req.session.user._id, {$pull: { 'log': null }});
        res.status(201).send();
    } catch (err) {
        return next(err)
    }
}

exports.types = async (req, res, next) => {
    try {
        console.log('TYPES in JAMS');
        const types = await typeModel.find({lang: req.query.lang}, {projection: {id: "$_id", name: 1, cat: "$group", _id: false}}).toArray();
        res.json(types);
    } catch (err) {
        return next(err);
    }
}