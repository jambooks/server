const AuthRouter = require('express').Router();
const authController = require('controllers/auth.controller');

AuthRouter.route('/check').get(authController.check);
AuthRouter.route('/forgot').post(authController.forgot);
AuthRouter.route('/join').post(authController.join);
AuthRouter.route('/login').post(authController.login);
AuthRouter.route('/logout').get(authController.logout);
AuthRouter.route('/register').post(authController.register);
AuthRouter.route('/reset').post(authController.reset);
AuthRouter.route('/suid').post(require('middlewares/adminAuthMiddleWare'), authController.suid);
AuthRouter.route('/verifyCode').post(authController.verifyCode);
AuthRouter.route('/verifyEmail/:key').get(authController.verifyEmail);

module.exports = AuthRouter;