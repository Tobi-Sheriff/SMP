const express = require('express');
const router = express.Router();
const markets = require('../controllers/markets');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateMarket } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });


router.route('/')
    .get(catchAsync(markets.index))
    .post(isLoggedIn, upload.array('image'), validateMarket, catchAsync(markets.createMarket))

router.get('/new', isLoggedIn, markets.renderNewForm)

router.route('/:id')
    .get(catchAsync(markets.showMarket))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateMarket, catchAsync(markets.updateMarket))
    .delete(isLoggedIn, isAuthor, catchAsync(markets.deleteMarket));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(markets.renderEditForm))


module.exports = router;