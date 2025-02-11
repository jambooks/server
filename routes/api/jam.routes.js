const loadJam = require('middlewares/load-jam.middleware');
const jamController = require('controllers/jam.controller');
const JamsRouter = require('express').Router();
JamsRouter.use(require('middlewares/authMiddleWare'));

JamsRouter.route('/types').get(jamController.types);

JamsRouter.route('/').get(jamController.getJams);
JamsRouter.route('/').post(jamController.addJam);
JamsRouter.route('/:id').get(
    loadJam({jammers: false, log: false}),
    jamController.getJam
);
JamsRouter.route('/:id').delete(
    loadJam({phoneNumber: 1}),
    jamController.deleteJam
);
JamsRouter.route('/:id').put(jamController.updateJam);
JamsRouter.route('/:id').patch(jamController.patchJam);
JamsRouter.route('/:id/assets').delete(
    loadJam({name: 1}),
    jamController.deleteAssets
);
JamsRouter.route('/:id/start').post(
    loadJam({}),
    jamController.startJam
);
JamsRouter.route('/:id/end').post(
    loadJam({}),
    jamController.endJam
)
JamsRouter.route('/:id/update').put(jamController.updateJam);
JamsRouter.route('/add').post(jamController.addJam);
JamsRouter.route('/:id/createBook').post(
    loadJam({}),
    jamController.createBook
);
JamsRouter.route('/:id/prompts').get(
    loadJam({ prompts: 1, status: 1 }),
    jamController.getJam
);
module.exports = JamsRouter;
