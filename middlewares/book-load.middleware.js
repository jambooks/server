const bookService = require('shared/services/book.service');

module.exports = (projection = {}) => {
    return async (req, res, next) => {
        if (!projection) {
            projection = {}
        }
        const book = await bookService.getById(
            req.params.bookId,
            projection
        );
        if (!book) {
            next({
                'status': 404,
                message: 'Book not found'
            });
        } else {
            req.book = book;
            next();
        }
    }
}