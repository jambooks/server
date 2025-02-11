/**
 * /routes/auth/index.js
 */

const ApiRouter = require('express').Router();

ApiRouter.use('/admin/prompts', require('./admin.prompts.routes'));
ApiRouter.use('/admin/system', require('./admin.system.routes'));
ApiRouter.use('/admin/types', require('./admin.types.routes'));
ApiRouter.use('/admin/user', require('./admin.user.routes'));
ApiRouter.use('/auth', require('./auth.routes'));
ApiRouter.use('/jams', require('./jam.routes'));
ApiRouter.use('/jams', require('./jam.jammer.routes'));
ApiRouter.use('/jams', require('./jam.log.routes'));
ApiRouter.use('/user', require('./user.routes'));
ApiRouter.use('/payments', require('./payment.routes'));
ApiRouter.use('/sms', require('./sms.routes'));
ApiRouter.use('/orders', require('./orders.routes'));
ApiRouter.use('/books', require('./books.routes'));
ApiRouter.use('/inventory', require('./inventory.routes'));

module.exports = ApiRouter;
