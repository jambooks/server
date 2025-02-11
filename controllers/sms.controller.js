const config = require('shared/config')
const jamsModel = require('shared/models')('Jams');
const messagingService = require('shared/services')('Messaging');
const textsModel = require('shared/models')('Texts');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const { SendMessage } = require('shared/lib/sqs');

exports.callback = async (req, res, next) => {
    try {
        let retJson = {};
        res.json(retJson);
    } catch (err) {
        return next(err);
    }
}


exports.incoming = async (req, res) => {
    try {
        const inc = new Incoming(res, req);
        await inc.setup();
        await inc.handleText(req.body.Body);
        await inc.saveJam();
        await inc.publishImageJobs();
    } catch (err) {
        console.log(err);
        res.sendStatus(200); // swollow all errors from incoming messages
    }
};

const en = {
    next: 'When you are ready for the next prompt text back NEXT.',
    firstResponse: 'Got your response! Now that you\'ve replied to a Prompt, remember that you don\'t need to wait for another Prompt - you can send in photos and texts anytime, and they\'ll be added to your Jambook. When another Prompt comes, make sure to reply to that Prompt first, and then continue to send in whatever else you want included in your Jambook!',
    secondResponse: 'Got it! And always remember to send lots of pictures. Pictures will make your Jambook beautiful.\n\nAnd when you\'re sending pictures, be sure to send them one at time for the best quality book!',
    thirdResponse: 'Got your response. Thanks! When you\'re sending your texts, remember that there\'s no need to send corrections for misspellings or anything else. Your Jamboss will have the ability to edit everything you send in before the book is printed, so there\'s no need to send corrections. It\'ll just make stuff messy.',
    standardResponse: 'Got it! It\'s going into your Jambook.',
    who: 'Hey! Do you want to Jam with us? Text back "JAM" to get started!',
    stopped: 'You are stopped',
    welcome: 'Remember these three rules to make your Jam as easy and awesome as possible:\n\n' +
        '1. Send pictures one at a time!\n' +
        '2. If you don’t want to answer a prompt, reply SKIP at any time to get to the next one.\n' +
        '3. Need help? help.jambooks.co\n\n' +
        'Let’s Jam!\n',
    confirm: 'Let\'s Jam! Just to confirm, you\'re agreeing to allow Jambooks to send you text messages to create your Jambook with your friends and family, correct? In addition, Jambooks will text you offers and information. You can opt-out anytime by texting STOP. You can also get help by replying HELP to any text. Message and data rates may apply. Does this all sound good? Reply YES to confirm.',
    firstName: 'What is your first name?',
    lastName: 'What is your last name?',
    needYes: 'We are looking for "yes"',
    want: 'Not sure what you want.'
}

class Incoming {
    constructor(res, req) {
        this.res = res;
        this.req = req;
        this.sets;
        this.jam;
        this.jammer;
        this.keyword;
        this.from;
        this.lockedPrompts = [];
        this.updates = {};
        this.twiml = null;
    }

    async setup() {
        await textsModel.insertOne(this.req.body);

        this.twiml = new MessagingResponse();
        if (this.req.params.jamId) {
            this.jam = await jamsModel.findOne({ _id: this.req.params.jamId });
        } else {
            this.jam = await jamsModel.findOne({ phoneNumber: this.req.body.To }); // jam phone number
        }

        if (this.jam === null) {
            throw new Error('Could not find jam associated with phone number:' + this.req.body.To);
        }

        this.from = this.req.body.From;
        if (this.jam.jammers[this.from]) {
            this.jammer = this.jam.jammers[this.from];
        } else {
            this.jammer = {
                numReplies: 0,
                numTexts: 0,
                numCue: 0
            };
            this.jam.jammers[this.from] = this.jammer;
        }
    }

    respond(message, mediaUrl) {
        if (message) {
            this.message(message, mediaUrl);
        }
        this.res.writeHead(200, {'Content-Type': 'text/xml'});
        this.res.end(this.twiml.toString());
    }

    message(msg, mediaUrl) {
        if (msg && mediaUrl) {
            const message = this.twiml.message();
            message.body(msg);
            message.media(mediaUrl);
        } else {
            this.twiml.message(msg);
        }
        return this;
    }

    setJammerStatus(status) {
        this.jammer.status = status;
        return this;
    }

    async sendDelayed(to, text, url, from) {
        await this.delay(10000);
        messagingService.send(to, text, url, from);
    }

    delay(ms = 500) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        })
    }

    async handleText(text) {
        const keyword = text.trim().toLowerCase();
        if (keyword === 'stop') {
            this.setJammerStatus('stopped');
            // do not respond because twilio automagically does
        } else if (this.jammer.status === 'stopped' && keyword === 'start') {
            if (this.jammer.firstName === '') {
                this.setJammerStatus('firstName').respond(en.firstName);
            } else if (this.jammer.lastName === '') {
                this.setJammerStatus('lastName').respond(en.lastName);
            } else {
                this.setJammerStatus('Active');
                // no need to send a message because twilio already did
            }
        } else if (this.jammer.status === 'stopped') {
            this.respond(en.stopped);
        } else if (this.jammer.status === undefined) {
            if (keyword === 'jam') {
                this.setJammerStatus('consent').respond(en.confirm, 'https://s3.us-west-2.amazonaws.com/media-dev.jambooks.co/infographic.jpeg');
            } else {
                this.setJammerStatus('invited').respond(en.who);
            }
            this.jammer.firstName = '';
            this.jammer.lastName = '';
        } else if (this.jammer.status === 'invited') {
            if (keyword === 'jam') {
                this.setJammerStatus('consent').respond(en.confirm, 'https://s3.us-west-2.amazonaws.com/media-dev.jambooks.co/infographic.jpeg');
            } else {
                this.respond(en.want);
            }
        } else if (this.jammer.status === 'consent') {
            if (keyword === 'yes') {
                if (this.jammer.firstName === '') {
                    this.setJammerStatus('firstName').respond(en.firstName);
                } else {
                    this.setJammerStatus('Active').respond(en.welcome, 'https://s3.us-west-2.amazonaws.com/media-dev.jambooks.co/3rules.jpeg');
                    const nextPrompt = this.getNextPrompt();
                    if (nextPrompt) {
                        this.jammer.numCue = 1;
                        // this.message(nextPrompt);
                        this.sendDelayed(this.from, nextPrompt, null, this.jam.phoneNumber);
                    }
                    // this.respond();
                }
            } else {
                this.respond(en.needYes);
            }
        } else if (this.jammer.status === 'firstName') {
            this.jammer.firstName = this.req.body.Body;
            this.setJammerStatus('lastName').respond(en.lastName);
        } else if (this.jammer.status === 'lastName') {
            this.jammer.lastName = this.req.body.Body;
            this.setJammerStatus('Active').respond(en.welcome, 'https://s3.us-west-2.amazonaws.com/media-dev.jambooks.co/3rules.jpeg');
            const nextPrompt = this.getNextPrompt();
            if (nextPrompt) {
                this.jammer.numCue = 1;
                // messagingService.send(this.from, nextPrompt, null, this.jam.phoneNumber);
                this.sendDelayed(this.from, nextPrompt, null, this.jam.phoneNumber);
            }
            // this.respond();
        } else if (keyword === 'back') {
            await this.sendPreviousPrompt();
        } else if (keyword === 'next') {
            await this.sendNextPrompt();
        } else if (keyword === 'skip') {
            await this.sendNextPrompt(true);
        } else {
            this.jammer.numTexts++;
            this.jammer.numReplies++;
            this.jammer.numCue = 1;

            if (this.jammer.numTexts === 1) {
                this.message(en.firstResponse);
            } else if (this.jammer.numTexts === 2) {
                this.message(en.secondResponse);
            } else if (this.jammer.numTexts === 3) {
                this.message(en.thirdResponse);
            }

            if (!this.isCaughtUp() && this.jammer.numReplies === 1) {
                this.message(en.next).respond();
            } else {
                if (this.jammer.numTexts > 3) {
                    this.message(en.standardResponse).respond();
                } else {
                    this.respond();
                }
            }

            const images = Object.keys(this.req.body).filter(fl => (fl.indexOf('MediaUrl')!== -1));
            const log = {
                from: this.from,
                text: this.req.body.Body,
                ts: (new Date()),
                images: []
            };

            if (this.jammer.prompt) {
                log.prompt = new Date(this.jammer.prompt);
            }

            // need to get the width, height and url in s3 for each image.
            for (let img of images) {
                // console.log(req.body[img]);
                log.images.push({incomingUrl: this.req.body[img]});
                // log.images.push(imgUrl);
            }
            this.jammer.locked = true;
            this.addJamLog(log);
        }
    }

    addJamLog(log) {
        this.updates['$push'] = {log: log};
    }

    async saveJam() {
        // save the user
        if (Object.values(this.jammer).length > 0) {
            this.updates['$set'] = {
                [`jammers.${this.from}`]: this.jammer
            }
        }

        // set the prompts to locked
        if (this.lockedPrompts.length) {
            this.lockedPrompts.forEach(id => {
                this.updates['$set'][`prompts.${id}.locked`] = true;
            });
        }

        // only save the jammers and the log, nothing else should have changed
        this.jam = await jamsModel.updateOne({_id: this.jam._id}, this.updates, { returnRecord: true });
    }

    async sendNextPrompt(skip = false) {
        const nextPrompt = this.getNextPrompt(skip);
        if (nextPrompt) {
            this.respond(nextPrompt);
        } else {
            this.respond('You\'re all caught up');
        }
    }

    async sendPreviousPrompt(skip = false) {
        const nextPrompt = this.getPreviousPrompt(skip);
        if (nextPrompt) {
            this.respond(nextPrompt);
        } else {
            this.respond('You\'re at the start.');
        }
    }

    getPreviousPrompt(skip = false) {
        let ret = false;
        if (this.jammer.status === 'Active') {
            let pts = {};
            for (let j = 0; j < this.jam.prompts.length; j++) {
                pts[this.jam.prompts[j].ts.toISOString()] = this.jam.prompts[j].text.replace('{VIP_NAME}', this.jam.vipName);
            }
            if (this.jammer.prompt === undefined) { // no prompts set yet
                // send the first prompt and set prompt = ts
                this.lockedPrompts.push(0);
                ret = Object.values(pts)[0];
                this.jammer.prompt = Object.keys(pts)[0];
                this.jammer.numReplies = 0;
                this.jammer.numCue = 0;
            } else {
                if (this.jammer.numReplies === 0 && !skip) { // jammer has not replied
                    // resend current prompt
                    ret = pts[this.jammer.prompt];
                    this.jammer.numCue = 1;
                } else { // send next prompt
                    for (let j = 0; j < this.jam.prompts.length; j++) {
                        const nextPromptTime = (new Date(this.jam.prompts[j].ts)).getTime();
                        if (nextPromptTime < (new Date()).getTime() && nextPromptTime > (new Date(this.jammer.prompt)).getTime()) {
                            ret = pts[this.jam.prompts[j].ts.toISOString()];
                            this.jammer.prompt = this.jam.prompts[j].ts.toISOString();
                            this.jammer.numReplies = 0;
                            this.jammer.numCue = 1;
                            this.lockedPrompts.push(j);
                            break;
                        }
                    }
                }
            }
            return ret;
        }
    }

    getNextPrompt(skip = false) {
        let ret = false;
        if (this.jammer.status === 'Active') {
            let pts = {};
            if (this.jam.prompts) {
                for (let j = 0; j < this.jam.prompts.length; j++) {
                    pts[this.jam.prompts[j].ts.toISOString()] = this.jam.prompts[j].text.replace('{VIP_NAME}', this.jam.vipName);
                }
            }
            if (this.jammer.prompt === undefined) { // no prompts set yet
                // send the first prompt and set prompt = ts
                const firstPrompt = this.jam.prompts[0];
                if ((new Date(firstPrompt.ts)).getTime() < (new Date()).getTime()) {
                    ret = firstPrompt.text;
                    this.lockedPrompts.push(0);
                    ret = Object.values(pts)[0];
                    this.jammer.prompt = Object.keys(pts)[0];
                    this.jammer.numReplies = 0;
                    this.jammer.numCue = 0;
                }
            } else {
                if (this.jammer.numReplies === 0 && !skip) { // jammer has not replied
                    // resend current prompt
                    ret = pts[this.jammer.prompt];
                    this.jammer.numCue = 1;
                } else { // send next prompt
                    for (let j = 0; j < this.jam.prompts.length; j++) {
                        const nextPromptTime = (new Date(this.jam.prompts[j].ts)).getTime();
                        if (nextPromptTime < (new Date()).getTime() && nextPromptTime > (new Date(this.jammer.prompt)).getTime()) {
                            ret = pts[this.jam.prompts[j].ts.toISOString()];
                            this.jammer.prompt = this.jam.prompts[j].ts.toISOString();
                            this.jammer.numReplies = 0;
                            this.jammer.numCue = 1;
                            this.lockedPrompts.push(j);
                            break;
                        }
                    }
                }
            }
            return ret;
        }
    }

    isCaughtUp() {
        let caughtUp = true;
        if (this.jam?.prompts && this.jam.prompts.length) {
            for (let j = 0; j < this.jam.prompts.length; j++) {
                const nextPromptTime = (new Date(this.jam.prompts[j].ts)).getTime();
                if (nextPromptTime < (new Date()).getTime() && nextPromptTime > (new Date(this.jammer.prompt).getTime())) {
                    caughtUp = false;
                    break;
                }
            }
        }
        return caughtUp;
    }

    // create an image job for each image that needs to be processed
    async publishImageJobs() {
        // this.jam.log.forEach( async (lg, logIndex) => {
        // for (const lg of this.jam.log) {
        try {
            if (this.jam.log === undefined) return;
            let messages = [];
            for (let logIndex=0; logIndex < this.jam.log.length; logIndex++) {
                const lg = this.jam.log[logIndex];
                if (lg.images.length > 0) {
                    for (let i = 0; i < lg.images.length; i++) {
                        if (lg.images[i].path === undefined) {
                            // console.log(lg.images[i].incomingUrl);
                            const today = (new Date()).toISOString().split('T')[0];
                            const opts = {
                                MessageGroupId: 'SmsImages',
                                MessageDeduplicationId: `${this.jam._id.toString()}-${logIndex}-${i}-${today}`,
                                MessageAttributes: {
                                    Url: {
                                        DataType: 'String',
                                        StringValue: lg.images[i].incomingUrl
                                    },
                                    jamId: {
                                        DataType: 'String',
                                        StringValue: this.jam._id.toString()
                                    },
                                    logId: {
                                        DataType: 'String',
                                        StringValue: `${logIndex}`
                                    },
                                    imageId: {
                                        DataType: 'String',
                                        StringValue: `${i}`
                                    },
                                    bucket: {
                                        DataType: 'String',
                                        StringValue: config.aws.s3.bookBucket
                                    },
                                    webhook: {
                                        DataType: 'String',
                                        StringValue: `${config.express.url}/api/jams/${this.jam._id.toString()}`
                                    }
                                }
                            };
                            if (config.aws?.sqs?.SmsImageFifo) {
                                messages.push(SendMessage(config.aws.sqs.SmsImageFifo, 'Process photo', opts));
                            }
                        }
                    }
                }
            }
            // console.log('Images to process: ', messages.length);
            if (messages.length) {
                // const req =
                await Promise.all(messages);
                // console.log(req);
            }
            return;
        } catch (e) {
            console.log(e);
        }
    }
}

