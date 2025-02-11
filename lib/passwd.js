const bcrypt = require("bcryptjs");

exports.makePassword = (pass) => {
    return bcrypt.hashSync(pass, 10);
}