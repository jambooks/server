const BookRouter = require('express').Router();
const loadJam = require('middlewares/load-jam.middleware');
const loadBook = require('middlewares/book-load.middleware');
const authMiddleWare = require('middlewares/authMiddleWare');
const bookController = require('controllers/book.controller');
const multer = require('multer');
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

// create coverImage
BookRouter.route('/:bookId/coverImage').post(
    authMiddleWare,
    loadBook(),
    bookController.saveCover
);

// update the book
BookRouter.route('/:bookId').put(
    authMiddleWare,
    loadBook(),
    upload.none(),
    bookController.save
);

// get the bookJson
BookRouter.route('/:id').get(bookController.load);
BookRouter.route('/:bookId/create').post(
    authMiddleWare,
    loadJam(),
    bookController.create
);

BookRouter.route('/:bookId/images').get(
    loadBook({}),
    bookController.images
)

BookRouter.route('/:bookId/images/upload').post(
    authMiddleWare,
    upload.any(),
    loadBook(),
    bookController.upload
)

BookRouter.route('/:bookId/images').delete(
    authMiddleWare,
    loadBook(),
    bookController.deleteImage
)

BookRouter.route('/:bookId/preview').post(
    authMiddleWare,
    upload.any(),
    loadBook(),
    bookController.uploadPreview
)

BookRouter.route('/:bookId/order').post(
    loadBook(),
    bookController.order
)

BookRouter.route('/:bookId/share').post(
    authMiddleWare,
    loadBook(),
    bookController.share
)

module.exports = BookRouter;