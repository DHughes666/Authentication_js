require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const mongoose = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const encrypt = require('mongoose-encryption');
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

//Apply the unique validator to the schema
// userSchema.plugin(uniqueValidator);


// Create a secret

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']})


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
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save()
  .then(usey => res.render("secrets", {userwithSecrets: usey}))
  .catch(err => res.send(err))

})

app.post("/login", function(req, res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username})
  .then(foundUser => {
    if (foundUser.password === password) {
      res.render("secrets", {userwithSecrets: foundUser})
    }
  })
  .catch(err => res.send(err))
})











const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
