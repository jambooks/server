const UserRouter = require('express').Router();
UserRouter.use(require('middlewares/adminAuthMiddleWare'));
const userController = require('controllers/user.controller');

UserRouter.route('/search').get(userController.search);
UserRouter.route('/update/:id').patch(userController.adminUpdate);
UserRouter.route('/passwd').post(userController.updatePassword);
module.exports = UserRouter;