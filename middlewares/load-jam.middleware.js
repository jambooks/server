const JamService = require('@jambooks/shared/services/jam.service');

module.exports = (projection) => {
    return async (req, res, next) => {
        if (!projection) {
            projection = {
                log: 1,
                jammers: 1,
                prompts: 1,
                vipName: 1,
                pageCount: 1,
                type: 1
            }
        }
        const jam = await JamService.getJamByUserId(
            req.params.id,
            req.session.user._id,
            projection
        );
        if (!jam) {
            next({
                'status': 404,
                message: 'Jam not found'
            });
        } else {
            req.jam = jam;
            next();
        }
    }
}