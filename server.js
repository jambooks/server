const express = require('express');
const config = require('shared/config');

const app = express();
const http = require('http').Server(app);
const loaders = require('loaders');

async function startServer () {
    await loaders({ expressApp: app });


    http.listen(config.express.port, function () {
        console.log('listening on *:' + config.express.port);
    });
}

startServer();
