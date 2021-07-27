require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')

const app = express()
app.use(express.urlencoded({extended:true}))
app.use(express.static(__dirname+'/public'))
app.set('view engine', 'ejs')
mongoose.connect('mongodb://localhost:27017/secretsDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']})

const User = new mongoose.model('user', userSchema)

app.get('/', function(req, res) {
    res.render('home')
})

app.get('/login', function(req, res) {
    res.render('login')
})

app.get('/register', function(req, res) {
    res.render('register')
})

app.post('/register', function(req, res) {
    const newUser = User({
        email: req.body.username,
        password: req.body.password
    })
    User.create(newUser, function(err) {
        if(err) {
            console.log(err)
            res.redirect('/register')
        } else {
            res.render('secrets')
        }
    })
})

app.post('/login', function(req, res) {
    User.findOne({email: req.body.username}, function(err, user) {
        if(!err) {
            if(user) {
                if(user.password === req.body.password) {
                    res.render('secrets')
                } else {
                    console.log('Wrong password')
                    res.redirect('/login')
                }
            } else {
                console.log('No user found')
                res.redirect('/register')
            }
        } else {
            console.log(err)
            res.redirect('/login')
        }
    })
})

app.listen(process.env.PORT || 3000, function() {
    console.log('Server started at port 3000')
})