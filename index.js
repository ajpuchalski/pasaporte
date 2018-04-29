
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const Sequelize = require('sequelize');
//const crypto = require('crypto');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const app = express();
const router = express.Router();
const handlebars = require("express-handlebars").create({ defaultLayout: 'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));

// connect to db
const sequelize = new Sequelize('mydb', 'ALAINA_JOY', null, {
    host: 'localhost',
    dialect: 'sqlite',
    storage: '/Users/alainajoypuchalski/userdata.sqlite'
});

// define
const Users = sequelize.define('Users', {
    ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    FirstName: Sequelize.STRING,
    LastName: Sequelize.STRING,
    Username: Sequelize.STRING,
    Password: Sequelize.STRING
},
{
    freezeTableName: true,
    timestamps: false
},
);

const Posts = sequelize.define('Posts', {
    AuthorID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    PostID: Sequelize.INTEGER,
    Message: Sequelize.STRING,
    Timestamp: Sequelize.DATE
},
    {
    freezeTableName: true,
    timestamps: false
    },
);


// auth config
app.use(passport.initialize());

passport.serializeUser(function(Users, done){
    done(null, Users.ID);
});
  
passport.deserializeUser(function(ID, done){
    sequelize.Users.find({where: {ID: ID} }).success(function(Users){
        done(null, Users);
    }).error(function(err){
        done(err, null);
    });
});

/*passport.use(new LocalStrategy({
    usernameField: 'Username',
    passwordField: 'Password'
},
    function(Username, Password, done) {
      Users.find({ where: { Username: Username }}).sucess(function(Users) {
        if (!Users) {
          done(null, false, { message: 'Unknown user' });
        } else if (Password != Users.Password) {
          done(null, false, { message: 'Invalid password'});
        } else {
          done(null, Users);
        }
      }).error(function(err){
        done(err);
      });
    }
  ));*/

  passport.use(new LocalStrategy({
        usernameField: 'Username',
        passwordField: 'Password'
  },
    function(Username, Password, done) {
      Users.findOne({ Username: Username }, function(err, Users) {
        if (err) { return done(err); }
        if (!Users) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!Users.validPassword(Password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, Users);
      });
    }
  ));


app.post('/login', passport.authenticate('local'), (req, res) => {
    res.render('home')
});

app.post('/',
  passport.authenticate('local', { successRedirect: '/home',
                                   failureRedirect: '/login',
                                   /*failureFlash: true*/ })
);
// API
app.get('/', (req, res) => {
	res.render('register')
})

app.get('/login', (req, res) => {
	res.render('login')
})

app.get('/home', (req, res) => {
    if(!req.Users) {
        console.log('not authenticated')
        res.redirect('/login')
    } else {
        console.log('authenticated')      
	    res.render('home')        
    }
})

/*app.get('/post', (req, res) => {
    res.render('post', {
        Message: Message
    })
})*/

app.get('/', (req, res) => {
    Posts.findAll().then(Posts => {
     console.log(Posts);
      res.render('post', {
        Posts: Posts
      });
      });
    });



app.post('/signup', (req, res) => {
    Users.create({
        Username: req.body.Username,
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        Password: req.body.Password
    });
    res.render('home')
});

app.post('/post', (req, res) => {
    Posts.create({
        Message: req.body.Message
    });
    res.render('post')
});

// run server on port 8080
app.listen(8080, () => {
    console.log('server running')
});