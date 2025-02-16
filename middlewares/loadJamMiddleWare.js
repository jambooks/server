const jamsModel = require('@jambooks/shared/models')('Jams');

module.exports = (projection) => {
  return async (req, res, next) => {
        jamsModel.setUser(req.session.user);
        console.log(projection);
        if (!projection) {
            projection = {
                log: 1,
                jammers: 1,
                prompts: 1,
                vipName: 1,
                pageCount: 1
            }
        }
        const jam = await jamsModel.findOne(
            { _id: req.params.id },
            {
                projection: projection
            });
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