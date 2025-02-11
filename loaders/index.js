const express = require('./expressLoader');
const mongo = require('shared/loaders/mongo.loader');

module.exports = async ({ expressApp }) => {
    await mongo();
    express(expressApp);
}
