const assert = require('node:assert');
const config = require('shared/config');
const mongoLoader = require('loaders/mongoLoader');
let Jam;
let JamPromptService;
before(async function() {
    await mongoLoader();
    // const app = express();
    // await loaders({ expressApp: app });
    console.log('BEFORE');
    Jam = require('models')('Jams');
    JamPromptService = require('services/jam-prompt.service');
});

after(function() {
    console.log('AFTER');
    config.mongo.conn.close();
})

describe('jam-prompt.service working', function() {



    it('MST twice a day', async function() {
        let jam = {
            startDate: new Date('2023-02-13'),
            endDate: new Date('2023-02-20'),
            type: Jam.getObjectId('62aa43f50c90557a743e9408'),
            lang: 'en',
            freq: 1, // twice a day
            tod: 1, // morning
            tz: 'America/Denver',
            neverEnds: false
        };

        const ret = await JamPromptService.getDefaultPrompts(jam);
        assert.equal(ret.length, 16, 'Should be 16');
        assert.equal(ret[0].ts.getTime(), (new Date('2023-02-13T16:00:00.000Z')).getTime(), 'MST')
    });

    it('PT once a day in the morning', async function() {
        let jam = {
            startDate: new Date('2023-02-13'),
            endDate: new Date('2023-02-20'),
            type: Jam.getObjectId('62aa43f50c90557a743e9408'),
            lang: 'en',
            freq: 0, // once a day
            tod: 1, // morning
            tz: 'America/Los_Angeles',
            neverEnds: false
        };

        const ret = await JamPromptService.getDefaultPrompts(jam);
        assert.equal(ret.length, 8, '8 days only once a day should be 8');
        assert.equal(ret[0].ts.getTime(), (new Date('2023-02-13T17:00:00.000Z')).getTime(), 'PT AM')
    });

    it('CT once a day in the afternoon', async function() {
        let jam = {
            startDate: new Date('2023-02-13'),
            endDate: new Date('2023-02-15'),
            type: Jam.getObjectId('62aa43f50c90557a743e9408'),
            lang: 'en',
            freq: 0, // once a day
            tod: 2, // afternoon
            tz: 'America/Chicago',
            neverEnds: false
        };

        const ret = await JamPromptService.getDefaultPrompts(jam);
        assert.equal(ret.length, 3, '3 days only once a day should be 3');
        assert.equal(ret[0].ts.getTime(), (new Date('2023-02-13T19:00:00.000Z')).getTime(), 'CT AM')
    });

    it('Bogus jam type', async function() {
        let jam = {
            startDate: new Date('2023-02-13'),
            endDate: new Date('2023-02-15'),
            type: Jam.getObjectId('62ac07940c90557a743e9428'),
            lang: 'en',
            freq: 0, // once a day
            tod: 2, // afternoon
            tz: 'America/Chicago',
            neverEnds: false
        };

        const ret = await JamPromptService.getDefaultPrompts(jam);
        assert.equal(ret.length, 0, 'Shoud return empty array');
    });

});
