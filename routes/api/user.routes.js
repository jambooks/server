const UserRouter = require('express').Router();
UserRouter.use(require('middlewares/authMiddleWare'));
const userController = require('controllers/user.controller');

UserRouter.route('/').get(userController.index);
UserRouter.route('/').patch(userController.update);

module.exports = UserRouter;