const MessageService = require('@jambooks/shared/services')('Messaging');
const awsService = require('@jambooks/shared/services/aws.service');
const bookService = require('@jambooks/shared/services/book.service');
const emailService = require('@jambooks/shared/services/email.service');
const jamService = require('@jambooks/shared/services/jam.service');
const orderService = require('@jambooks/shared/services/order.service');
const stripeService = require('@jambooks/shared/services/stripe.service');
const config = require('@jambooks/shared/config');
// const { nanoid } = require('nanoid');
const sharp = require("sharp");

exports.create = async (req, res, next) => {
    try {
        const book = await bookService.create(req.jam, req.session.user._id);
        await jamService.updateJamByUserId(
            req.jam._id,
            req.session.user._id,
            { $set: { status: 'book' } }
        );
        res.json(book);
    } catch (err) {
        return next(err);
    }
}

exports.load = async (req, res, next) => {
    try {
        const book = await bookService.getById(req.params.id);
        const ret = {mod: '000'};
        if (!book) {
            next({status: 404, message: 'Book not found'});
        } else {
            ret.pageCount = book.pageCount;
            ret.jamId = book.jamId;
            ret.type = 'anon';
            if (req.session.user) {
                ret.type = req.session.user.type;
            }
            if (book.userId.toString() === req.session?.user?._id) {
                ret.mod = '700';
            } else {
                ret.mod = '004';
            }
            if (ret.mod === '000') {
                next({status: 401, message: 'access denied'});
            } else {
                const bookJson = await awsService.getFile(bookService.getBookPath(book) + '/book.json')
                ret.book = JSON.parse(bookJson);
                res.send(ret);
            }
        }
    } catch (err) {
        return next(err);
    }
}

exports.save = async (req, res, next) => {
    try {
        if (req.book.pageCount !== req.body.pageCount) {
            await bookService.update(req.book._id, {
                $set: { pageCount: req.body.pageCount }
            })
        }
        const filePath = bookService.getBookPath(req.book) + '/book.json';
        await awsService.saveFile(filePath, req.body.book)
        res.sendStatus(200);
    } catch (err) {
        return next(err)
    }
}

exports.saveCover = async (req, res, next) => {
    try {
        const imgBuffer = new Buffer(req.body.file.replace('data:image/png;base64,', ''),'base64');
        const image = sharp(imgBuffer);
        image
            .metadata()
            .then(metadata => {
                const spineWidth = 53;
                return image
                    .extract({
                        left: Math.floor((metadata.width / 2) + Math.floor(spineWidth / 2)),
                        top: 0,
                        width: metadata.width - Math.floor((metadata.width / 2) + Math.floor(spineWidth / 2)),
                        height: metadata.height})
                    .resize({ width: 300 })
                    .toBuffer()
                    .then( async (img) => {
                            const imgPath = bookService.getBookPath(req.book) + '/cover.png';
                            await awsService.saveFile(imgPath, img, {
                                ACL: 'public-read',
                                ContentType: 'image/png'
                            });
                            await bookService.update(req.book._id, {
                                $set: {
                                    coverColor: req.body.color,
                                    // coverUrl: `${config.aws.s3.url}/${config.aws.s3.bookBucket}/${imgPath}?${nanoid(6)}`
                                    coverUrl: `${config.express.url}/photos/${imgPath}`
                                }
                            });
                    })
            })
        res.sendStatus(201);
    } catch (err) {
        return next(err)
    }
}

exports.images = async (req, res, next) => {
    try {
        const jamImages = await awsService.listObjects(`${ req.book.jamId }/images/lowres`);
        const uploaded = await awsService.listObjects(`${bookService.getBookPath(req.book)}/images/lowres`);
        const uploads = [];
        const sms = [];
        let upImages = [];
        jamImages['Contents'].forEach(im => {
            sms.push(im);
        });
        if (uploaded['Contents']) {
            uploaded['Contents'].forEach(im => {
                uploads.push(im);
            });
            uploads.sort((a, b) => ((a.LastModified < b.LastModified) ? 1 : -1));
            upImages = uploads.map(obj => ({
                // url: `${ config.aws.s3.url }/${ config.aws.s3.bookBucket }/${ obj.Key }`
                // url: `${ config.aws.s3.url }/${ obj.Key }?foo=2`
                url: `${ config.express.url }/photos/${ obj.Key }`
            }));
        }
        sms.sort((a, b) => ((a.LastModified > b.LastModified) ? 1 : -1));
        const smsImages = sms.map(obj => ({
            // url: `${ config.aws.s3.url }/${ config.aws.s3.bookBucket }/${ obj.Key }`
            // url: `${ config.aws.s3.url }/${ obj.Key }`
            url: `${ config.express.url }/photos/${ obj.Key }`
        }));
        res.json({images: [...upImages, ...smsImages]});
    } catch (err) {
        next(err);
    }
}

exports.upload = async (req, res, next) => {
    try {
        const proms = [];
        for (const img of req.files) {
            proms.push(saveImage(req.book, img));
        }

        Promise.all(proms)
            .then(() => {
               res.json({});
            });
    } catch (err) {
        next(err);
    }
}

const saveImage = async (book, img) => {
    const image = sharp(img.buffer);

    const typeToMime = {
        jpeg: 'image/jpeg',
        png: 'image/png'
    };

    const imagePath = `${book.jamId}/books/${book._id.toString()}/images`;
    return image.metadata()
        .then(meta => {
            img.width = meta.width;
            img.height = meta.height;
            img.contentType = typeToMime[meta.format];
            img.path = `${imagePath}/${img.fieldname}-${Date.now()}.${meta.format}`
            img.pathLowRes = `${imagePath}/lowres/${img.fieldname}-${Date.now()}.${meta.format}`
            return awsService.saveFile(img.path, img.buffer, {
                ACL: 'public-read',
                ContentType: img.contentType
            });
        })
        .then(() => {
            if (img.width > 400) {
                return image.resize(400)
                    .toBuffer();
            } else {
                img.lowResWarining = true;
                return img.buffer;
            }
        })
        .then(buff => {
            if (buff) {
                return awsService.saveFile(img.pathLowRes, buff, {
                    ACL: 'public-read',
                    ContentType: img.contentType
                });
            }
        });
}

exports.deleteImage = async (req, res, next) => {
    try {
        // strip off the host and the query string
        const file = req.body.id.replace(/http[s]?:\/\/[^/]+\//, '').split('?')[0];
        const [,jamId,,userId,,,fileName] = file.split('/');
        // if (bucket !== config.aws.s3.bookBucket) {
        //     throw Error('Cannot delete from bucket');
        // }

        if (jamId !== req.book.jamId.toString()) {
            throw Error('Invalid jam');
        }

        if (userId !== req.book._id.toString()) {
            throw new Error('Invalid book');
        }
        let files = [];
        // delete image
        files.push({Key: `${jamId}/books/${userId}/images/${fileName}`})
        // delete lowres image
        files.push({Key: `${jamId}/books/${userId}/images/lowres/${fileName}`});
        await awsService.deleteFiles(files);
        res.sendStatus(200);
    } catch (err) {
        next(err);
    }
}

exports.uploadPreview = async (req, res, next) => {
    try {
        const buf = new Buffer(req.body.file.replace('data:image/png;base64,', ''),'base64')
        await awsService.saveFile(exports.getBookPath(req.book) + `/previews/${req.body.page}.png`, buf, {
            ContentEncoding: 'base64',
            ContentType: 'image/png',
            ACL: 'public-read'
        });
        res.send(201);
    } catch (err) {
        next(err);
    }
}

exports.order = async (req, res, next) => {
    try {
        const bookId = req.params.bookId;
        const pageType = req.body.hardCover ? config.inventory.hardCoverPage: config.inventory.softCoverPage;
        let extraPageTotal = 0;
        if (req.book.pageCount - 31 > 0) {
            extraPageTotal = (req.book.pageCount - 31);
        }

        const params = {
            mode: 'payment',
            line_items: []
        };

        if (req.session.user &&
            req?.session?.user?._id &&
            req.session.user._id.toString() === req.book.userId.toString()
        ) {
            const hasUsed = await orderService.checkForOrderedPrepaidBook(req.session.user._id, req.params.bookId);
            if (hasUsed) {
                params.line_items.push(orderService.getLineItem(config.inventory.softCoverBook, 1));
            } else {
                params.line_items.push(orderService.getLineItem(config.inventory.softCoverBookPrePaid, 1));
            }
        } else {
            params.line_items.push(orderService.getLineItem(config.inventory.softCoverBook, 1));
        }

        if (req.body.hardCover) {
            params.line_items.push(orderService.getLineItem(config.inventory.hardCoverUpgrade, 1));
        }

        if (extraPageTotal) {
            params.line_items.push(orderService.getLineItem(pageType, extraPageTotal));
        }

        if (req.body.digitalCopy) {
            params.line_items.push(orderService.getLineItem(config.inventory.digitalBook, 1));
        }

        let shipping = 499;
        if (req.body.expShipping) {
            shipping = 750;
            params.shipping_options =  [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {amount: 750, currency: 'usd'},
                        display_name: 'Expedited shipping',
                        delivery_estimate: {
                            minimum: {unit: 'business_day', value: 1},
                            maximum: {unit: 'business_day', value: 3},
                        },
                    },
                },
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {amount: 499, currency: 'usd'},
                        display_name: 'Standard shipping',
                        delivery_estimate: {
                            minimum: {unit: 'business_day', value: 5},
                            maximum: {unit: 'business_day', value: 7},
                        },
                    },
                }
            ];
        } else {
            params.shipping_options =  [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {amount: 499, currency: 'usd'},
                        display_name: 'Standard shipping',
                        delivery_estimate: {
                            minimum: {unit: 'business_day', value: 5},
                            maximum: {unit: 'business_day', value: 7},
                        },
                    },
                },
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {amount: 750, currency: 'usd'},
                        display_name: 'Expedited shipping',
                        delivery_estimate: {
                            minimum: {unit: 'business_day', value: 1},
                            maximum: {unit: 'business_day', value: 3},
                        },
                    },
                },
            ];
        }

        // need to know where to ship it
        params.shipping_address_collection = {
            allowed_countries: ['US']
        }
        const orderId = orderService.getObjectId();
        if (req.session.user) {
            params.success_url = `${config.express.url}/account/orders/${orderId}`;
        } else {
            params.success_url = `${config.express.url}/order/${orderId}`;
        }
        params.cancel_url = `${config.express.url}/editor/${req.book.jamId.toString()}/${req.book._id.toString()}?cancel=true`;
        if (req.session.promoCode) {
            params['discounts'] = [ { promotion_code: req.session.promoCode }];
        }
        const ret = await stripeService.checkout(params, req.session.user);
        await orderService.create(params, bookId, req.session.user, orderId, ret.id, shipping);
        req.session.orderId = orderId;
        res.json({
            url: ret.url
        });
    } catch (err) {
        console.log(err);
        return next(err)
    }
}

exports.share = async (req, res, next) => {
    try {
        console.log(req.body);
        if (req.body.target === 'text') {
            const jam = await jamService.getById(req.book.jamId, {jammers: 1, phoneNumber: 1});
            const jammerKeys = Object.keys(jam.jammers);
            const jamBoss = jam.jammers[jammerKeys.shift()];

            const proms = [];
            console.log(jam);
            jammerKeys.forEach(jammerKey => {
                const message = req.body.message
                    .replace('{JAMMER_FIRSTNAME}', jam.jammers[jammerKey].firstName)
                    .replace('{JAMBOSS_FIRSTNAME}', jamBoss.firstName)
                    .replace('{JAMBOSS_LASTNAME}', jamBoss.lastName)
                    .replace('{BOOK_URL}', `${config.express.url}/editor/${jam._id.toString()}/${req.book._id.toString()}`);
                proms.push(MessageService.send(jammerKey, message, null, jam.phoneNumber));
            })
            Promise.all(proms)
                .then(() => {
                    res.sendStatus(201);
                });
        } else if (req.body.target === 'email') {
            await emailService.shareBook(
                req.body.email,
                `${req.session.user.firstName} ${req.session.user.lastName}`,
                req.book.coverUrl,
                req.body.message,
                `${config.express.url}/editor/${req.book.jamId.toString()}/${req.book._id.toString()}`);
            res.sendStatus(201);
        }
    } catch (err) {
        return next(err);
    }
}
