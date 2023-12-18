// import express from 'express';
const express = require('express');
const app = express();
const path = require('path');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const userRoutes = require('./routes/users');
const marketRoutes = require('./routes/markets');
const ExpressError = require('./utils/ExpressError');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require("connect-mongo");
require('dotenv').config();


// const PORT = process.env.PORT || 3000;
const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.DB_URL);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
}

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(mongoSanitize({
    replaceWith: '_'
}));

const secret = process.env.SECRET || 'justapreproductionsecret!';
const store = new MongoStore({
    mongoUrl: process.env.DB_URL,
    secret,
    touchAfter: 24 * 60 * 60
});
store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

const requireLogin = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login')
    }
    next();
}




app.use('/', userRoutes);
app.use('/markets', marketRoutes);
// app.use('/campgrounds/:id/reviews', reviewRoutes);


// app.all('*', (req, res, next) => {
//     next(new ExpressError('Page Not Found', 404))
// })
// app.use((err, req, res, next) => {
//     const { statusCode = 500 } = err;
//     if (!err.message) err.message = 'Oh No, Something Went Wrong!'
//     res.status(statusCode).render('error', { err });
// })


// console.log(process.env.PORT);
// console.log(process.env);
// console.log("MARGIN");
// console.log(process);
// app.listen(PORT, () => {
//     console.log(`SERVING ON PORT ${PORT}...`);
// })


connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log("listening for requests on...");
    })
})