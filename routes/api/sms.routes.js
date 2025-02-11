const SmsRouter = require('express').Router();
const smsController = require('controllers/sms.controller');

// /api/sms/callback
SmsRouter.route('/callback').post(smsController.callback);

// /api/sms/incoming/:jamId
SmsRouter.route('/incoming/:jamId?').post(smsController.incoming);

module.exports = SmsRouter;