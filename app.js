require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

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
    email: String,
    password: String
})
userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model('user', userSchema)
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

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
    if(req.isAuthenticated()) {
        res.render('secrets')
    } else {
        res.redirect('/login')
    }
})

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

app.listen(process.env.PORT || 3000, function() {
    console.log('Server started at port 3000')
})