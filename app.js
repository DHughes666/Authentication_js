require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

//It is important to place this code right here, above mongoose
// and below other 'app.use'
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/AuthenticateDB', {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => {
  console.log("CONNECTION OPEN!!!");
}).catch(err => {
  console.log("OH NO ERROR!!!");
  console.log(err);
})

mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema ({
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  active: Boolean

});

//Passport will hash, sort and organize passwords into our database
userSchema.plugin(passportLocalMongoose);

//Now we can create the schema
const User = new mongoose.model('User', userSchema);

//The following codes will be added after the declaration of the model
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// const user = new DefaultUser({username: 'user'});
// await user.setPassword('password');
// await user.save();
// const { user } = await DefaultUser.authenticate()('user', password);

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  if (req.isAuthenticated()) {
    res.render("secrets", {userwithSecrets: 'Hi'})
  } else {
    res.redirect("/login");
  }
});

app.post("/register", function(req, res){
  User.register(
    {username: req.body.username}, req.body.password,
    function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    }else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res){

})











const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
