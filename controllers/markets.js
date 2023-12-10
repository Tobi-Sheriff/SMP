const Market = require('../models/market');
const User = require('../models/user');
const { cloudinary } = require("../cloudinary");



module.exports.index = async (req, res) => {
    const markets = await Market.find({});
    res.render('markets/index', { markets});
}

module.exports.renderNewForm = (req, res) => {
    res.render('markets/new');
}

module.exports.createMarket = async (req, res, next) => {
    const market = new Market(req.body.market);
    market.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    market.author = req.user._id;
    await market.save();
    req.flash('success', 'Successfully made a new market!');
    res.redirect(`/markets/${market._id}`)
}

module.exports.showMarket = async (req, res,) => {
    const market = await Market.findById(req.params.id).populate({
        path: 'images',
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!market) {
        req.flash('error', 'Cannot find that market!');
        return res.redirect('/markets');
    }
    res.render('markets/show', { market });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const market = await Market.findById(id)
    if (!market) {
        req.flash('error', 'Cannot find that market!');
        return res.redirect('/markets');
    }
    res.render('markets/edit', { market });
}

module.exports.updateMarket = async (req, res) => {
    const { id } = req.params;
    const market = await Market.findByIdAndUpdate(id, { ...req.body.market });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    market.images.push(...imgs);
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await market.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    await market.save();
    req.flash('success', 'Successfully updated market!');
    res.redirect(`/markets/${market._id}`)
}

module.exports.deleteMarket = async (req, res) => {
    const { id } = req.params;
    const market = await Market.findById(id);
    market.images.map((image) => cloudinary.uploader.destroy(image.filename));
    await Market.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted market')
    res.redirect('/markets');
}