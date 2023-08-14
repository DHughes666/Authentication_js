require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const md5 = require("md5");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const mongoose = require("mongoose");

mongoose.connect('mongodb://localhost:27017/AuthenticateDB', {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => {
  console.log("CONNECTION OPEN!!!");
}).catch(err => {
  console.log("OH NO ERROR!!!");
  console.log(err);
})

const userSchema = new mongoose.Schema ({
  email: {
    type: String,
    required: [true, 'Please provide an email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password']
  }
});



//Now we can create the schema
const User = new mongoose.model('User', userSchema);



app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){

  bcrypt.hash(req.body.password, saltRounds, function(err, hash){
    const newUser = new User({
      email: req.body.username,
      password: hash
    });

    newUser.save()
    .then(usey => res.render("secrets", {userwithSecrets: usey}))
    .catch(err => res.send(err))
  });
});

app.post("/login", function(req, res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username})
  .then(foundUser => {
    bcrypt.compare(password, foundUser.password, function(err, resy){
      if (resy == true) {
        res.render("secrets", {userwithSecrets: foundUser})
      }
    })
  })
  .catch(err => res.send(err))
})











const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
