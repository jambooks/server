const authMiddleWare = require('./authMiddleWare');
const adminMiddleWare = require('./adminAuthMiddleWare');
module.exports = {
    authMiddleWare,
    adminMiddleWare
};
