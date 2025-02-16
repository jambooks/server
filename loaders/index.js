const express = require('./expressLoader');
const mongo = require('@jambooks/shared/loaders/mongo.loader');

module.exports = async ({ expressApp }) => {
    await mongo();
    express(expressApp);
}
