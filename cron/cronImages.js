const mongo = require('loaders/mongoLoader');
const config = require('config');
const { SaveFile } = require('lib/s3');
const fetch = require('node-fetch');
const sharp = require("sharp");

const typeToMime = {
    jpeg: 'image/jpeg'
};

/**
 * Find all jams that need photos uploaded and resized
 *
 * Run:
 * NODE_PATH=. NODE_ENV=local node cron/cronImages.js
 **/
(async () => {
    await mongo();
    const jamModel = require('models')('Jams');
    const jams = await jamModel.find({'log.uploadPhotos': true}, {projection:{log: 1}}).toArray();
    // console.log(jams);

    try {
        let sets = {};
        for (const jam of jams) {
            sets = {};
            if (jam.lockedForProcessing) continue;
            await jamModel.updateOne({_id: jam._id}, {$set: {lockedForProcessing: true}});
            for (const [key, log] of jam.log.entries()) {
                if (log.uploadPhotos === true) {
                    for (const img of log.images) {
                        // console.log('incomingUrl', key, img.incomingUrl);
                        if (img.incomingUrl === undefined) continue;
                        const fileName = img.incomingUrl.split('/').pop();
                        const response = await fetch(img.incomingUrl);
                        const buffer = await response.buffer();
                        const image = sharp(buffer);
                        await image.metadata()
                            .then(meta => {
                                img.width = meta.width;
                                img.height = meta.height;
                                img.contentType = typeToMime[meta.format];
                                img.path = `${jam._id}/images/${fileName}.${meta.format}`;
                                img.pathLowRes = `${jam._id}/images/lowres/${fileName}.${meta.format}`;
                                return SaveFile(`${img.path}`,
                                    buffer,
                                    {
                                        ACL: 'public-read',
                                        ContentType: img.contentType
                                    }
                                )
                            })
                            .then(() => {
                                if (img.width > 400) {
                                    return image.resize(400)
                                        .toBuffer();
                                } else {
                                    img.lowResWarining = true;
                                    return buffer;
                                }
                            })
                            .then(buff => {
                                if (buff) {
                                    return SaveFile(img.pathLowRes, buff, {
                                        ACL: 'public-read',
                                        ContentType: img.contentType
                                    });
                                }
                            })
                            .then(() => {
                                delete log.uploadPhotos;
                                sets[`log.${key}`] = log;
                            })
                            .catch(err => {
                                log.uploadPhotos = 'bad photo';
                                sets[`log.${key}`] = log;
                                console.log(err);
                            });
                    }
                }
            }
            await jamModel.updateOne({_id: jam._id}, {$set: sets, $unset: {lockedForProcessing: ''}});
        }
    } catch (err) {
        console.log(err);
    }
    config.mongo.conn.close();
})();