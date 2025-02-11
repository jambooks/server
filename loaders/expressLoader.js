const Redis = require('ioredis');
const bodyParser = require('body-parser');
const config = require('shared/config');
const express = require('express');
const history = require('connect-history-api-fallback');
const routes = require('../routes');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const http = require('http')

module.exports = (app) => {
    app.disable('x-powered-by');

    const RedisStore = require('connect-redis')(session);
    const client = new Redis(config.express.session.redis_url);
    const store = new RedisStore({
        client,
        prefix: config.express.session.prefix,
        ttl: config.express.session.ttl
    });

    app.use(cors({
        // origin: 'https://unkpg.com'
        origin: '*'
    }));

    app.get(/^\/photos/, function(req, res, next) {
        try {
            let url = `${config.aws.s3.url}/${config.aws.s3.bookBucket}/${req.url.replace('/photos/', '')}`;
            http.get(url.replace('https', 'http'), (ress) => {
                const data = [];
                if (ress.statusCode === 200) {
                    res.setHeader('Conetent-Length', ress.headers['content-length']);
                    res.setHeader('Content-Type', ress.headers['content-type']);
                    ress.on('data', (chunk) => {
                        data.push(chunk);
                    }).on('end', () => {
                        let buffer = Buffer.concat(data);
                        res.write(buffer,'binary');
                        res.end(undefined,'binary');
                    });
                } else {
                    res.sendStatus(404);
                }
            }).on('error', (err) => {
                console.log('download error:', err);
            });
        } catch (err) {
            return next(err);
        }
    });

    app.use(history({
        index: '/'
    }));

    app.use(session({
        cookie: {
            domain: config.express.session.domain,
            httpOnly: false
        },
        name: config.express.session.cookieName,
        resave: true,
        saveUninitialized: false, // recommended: only save session when data exists
        secret: config.express.session.secret,
        store
    }));

    app.use((req, res, next) => {
        if (req.originalUrl === '/stripecom/webhook') {
            bodyParser.json({
                limit: '30mb',
                verify: (req, res, buf) => {
                    req.rawBody = buf
                }
            })(req, res, next);
        }
        else {
            // express.json()(req, res, next);
            bodyParser.json({
                limit: '30mb'
            })(req, res, next);
        }
    });

    // get raw body and json
    // app.use(bodyParser.json({
    //     limit: '30mb',
    //     verify: (req, res, buf) => {
    //         req.rawBody = buf
    //     }
    // }));

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.text({ limit: '30mb' }));

    app.get('/', function (req, res) {
        if (req.originalUrl.indexOf('editor') > -1) {
            res.sendFile(path.resolve(__dirname + '/../public/editor/index.html'));
        } else {
            res.sendFile(path.resolve(__dirname + '/../public/index.html'));
        }
    });

    app.use(express.static(__dirname + '/../public'));
    app.use(express.static(__dirname + '/../public/editor'));

    // include the routes
    routes(app);

    app.use((req, res, next) => {
        const err = new Error('Not Found');
        err.status = 404;
        err.url = req.url;
        console.log('404', req.url, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        next(err);
    });

    // if you remove the next param things will not work correctly
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        // console.error(err.stack);
        // console.log(err);
        // console.log(err.status);
        res.json({ error: err.message });
    });
}
