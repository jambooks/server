const LogRouter = require('express').Router();
const loadJam = require('middlewares/loadJamMiddleWare');
const jamController = require('controllers/jam.controller');

LogRouter.route('/:id/log').get(
    loadJam(),
    jamController.logs
);
LogRouter.route('/:id/log/:index').delete(
    loadJam(),
    jamController.logDelete
);
LogRouter.route('/:id/log/:index').put(
    loadJam(),
    jamController.logUpdate
);

module.exports = LogRouter;