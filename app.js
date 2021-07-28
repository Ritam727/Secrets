require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate = require('mongoose-findorcreate')

const app = express()
app.use(express.urlencoded({extended:true}))
app.use(express.static(__dirname+'/public'))
app.set('view engine', 'ejs')
app.use(session({
    secret: "Thisisasecrettobekept.",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

mongoose.connect('mongodb://localhost:27017/secretsDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true})

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String
})
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model('user', userSchema)

passport.use(User.createStrategy())
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user)
        })
    }
))

app.get('/', function(req, res) {
    res.render('home')
})

app.get('/login', function(req, res) {
    res.render('login')
})

app.get('/register', function(req, res) {
    res.render('register')
})

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/')
})

app.get('/secrets', function(req, res) {
    User.find({secret: {$ne: null}}, function(err, users) {
        if(err) {
            console.log(err)
        } else {
            if(users) {
                res.render('secrets', {
                    usersWithSecrets: users
                })
            } else {

            }
        }
    })
})

app.get('/submit', function(req, res) {
    if(req.isAuthenticated()) {
        res.render('submit')
    } else {
        res.redirect('/login')
    }
})

app.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }))

app.get('/auth/google/secrets', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/secrets');
});

app.post('/register', function(req, res) {
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if(err) {
            console.log('Couldn\'t register')
            console.log(err)
            res.redirect('/register')
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/secrets')
            })
        }
    })
})

app.post('/login', function(req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, function(err) {
        if(err) {
            console.log(err)
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/secrets')
            })
        }
    })
})

app.post('/submit', function(req, res) {
    User.findById(req.user.id, function(err, user) {
        if(err) {
            console.log(err)
        } else {
            if(user) {
                user.secret = req.body.secret
                user.save(function() {
                    res.redirect('/secrets')
                })
            }
        }
    })
})

app.listen(process.env.PORT || 3000, function() {
    console.log('Server started at port 3000')
})