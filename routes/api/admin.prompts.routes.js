const PromptsRouter = require('express').Router();
PromptsRouter.use(require('middlewares/adminAuthMiddleWare'));
const promptsController = require('controllers/prompts.controller');

PromptsRouter.route('/:typeId').get(promptsController.list);
PromptsRouter.route('/:id').put(promptsController.update);
PromptsRouter.route('/').post(promptsController.create);
PromptsRouter.route('/:id').delete(promptsController.delete);
module.exports = PromptsRouter;
