const TypesRouter = require('express').Router();
TypesRouter.use(require('middlewares/adminAuthMiddleWare'));
const typeContorller = require('controllers/types.controller');

TypesRouter.route('/').get(typeContorller.list);
TypesRouter.route('/:id').put(typeContorller.update);
TypesRouter.route('/:id').delete(typeContorller.delete);
module.exports = TypesRouter;
