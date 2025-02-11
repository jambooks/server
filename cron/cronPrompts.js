const mongo = require('loaders/mongoLoader');
const config = require('shared/config');
const messagingService = require('services')('Messaging');

   /**
    * Find all jams that have a prompt for this minute
    *   loop through jammers and send prompts
    *
    * Run:
    * NODE_PATH=. NODE_ENV=local node cron/cronPrompts.js
    **/
(async () => {
    const nds = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
    await mongo();
    const jamModel = require('models')('Jams');
    const currentNoSeconds = new Date((new Date()).toISOString().slice(0, 16) + ':00.000Z');
    const jams = await jamModel.find({'prompts.ts': currentNoSeconds}).toArray();
    for (let i=0; i < jams.length; i++) {
        let pts = {};
        for (let j = 0; j < jams[i].prompts.length; j++) {
            pts[jams[i].prompts[j].ts.toISOString()] = jams[i].prompts[j].text.replace('{VIP_NAME}', jams[i].vipName);
        }

        for (const jammerKey of Object.keys(jams[i].jammers)) {
            const jammer = jams[i].jammers[jammerKey];
            if (jammer.status === 'Active') {
                let txt = '';
                if (jammer.prompt === undefined) { // no prompts set yet
                    // send the first prompt and set prompt = ts
                    jams[i].prompts[0].locked = true;
                    txt = Object.values(pts)[0];
                    jammer.prompt = Object.keys(pts)[0];
                    jammer.numReplies = 0;
                    jammer.numCue = 1;
                } else {
                    if (jammer.numReplies === 0) { // jammer has not replied
                        // resend current prompt
                        txt = pts[jammer.prompt];
                        jammer.numCue++;
                    } else { // send next prompt
                        for (let j = 0; j < jams[i].prompts.length; j++) {
                            if ((new Date(jams[i].prompts[j].ts)).getTime() > (new Date(jammer.prompt)).getTime()) {
                                txt = jams[i].prompts[j].text;
                                jammer.prompt = jams[i].prompts[j].ts.toISOString();
                                jammer.numReplies = 0;
                                jammer.numCue = 1;
                                jams[i].prompts[j].locked = true;
                                break;
                            }
                        }
                    }
                }
                // console.log(txt, jammerKey, jams[i].jammers);
                await messagingService.send(jammerKey, txt, null, jams[i].phoneNumber);
                if (jammer.numCue > 1) {
                    txt =  `This is the ${nds[jammer.numCue]} time this Prompt has been sent to you. If you don't want to reply to this one, reply SKIP to go to the next prompt.`;
                    await messagingService.send(jammerKey, txt, null, jams[i].phoneNumber);
                }
                await jamModel.updateOne({_id: jams[i]._id}, {$set: jams[i]});
            }
        }
    }
    config.mongo.conn.close();
})();