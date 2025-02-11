const JammersRouter = require('express').Router();
const jammerController = require('controllers/jammer.controller');
const loadJam = require('middlewares/load-jam.middleware');

JammersRouter.route('/:id/jammers').get(
    loadJam({ jammers: 1, prompts: 1, vipName: 1, pageCount: 1 }),
    jammerController.index
);

JammersRouter.route('/:id/jammers/:phone').delete(
    loadJam({ name: 1 }),
    jammerController.delete
);

JammersRouter.route('/:id/jammers/update').put(
    loadJam({ name: 1 }),
    jammerController.update
);

JammersRouter.route('/:id/jammers/invite').post(
    loadJam({ jammers: 1, inviteMessage: 1, phoneNumber: 1 }),
    jammerController.invite
);

module.exports = JammersRouter;