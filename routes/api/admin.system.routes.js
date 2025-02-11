const adminMiddleWare = require('middlewares/adminAuthMiddleWare');
const systemController = require('controllers/system.controller');
const SystemRouter = require('express').Router();

SystemRouter.route('/bull/setup').post(
    adminMiddleWare,
    systemController.bullSetup
)

SystemRouter.route('/bull/finish').get(
    adminMiddleWare,
    systemController.finishOneTime
)

module.exports = SystemRouter;