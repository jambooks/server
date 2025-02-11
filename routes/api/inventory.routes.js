const InventoryRouter = require('express').Router();
InventoryRouter.use(require('middlewares/authMiddleWare'));
const inventoryController = require('controllers/inventory.controller');

InventoryRouter.route('/pricing').get(inventoryController.getSoftCoverBookPricing);

module.exports = InventoryRouter;