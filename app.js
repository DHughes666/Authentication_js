require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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

const atlasUsername = process.env.MONGODB_ATLAS_USERNAME;
const atlasPassword = process.env.MONGODB_ATLAS_PASSWORD;
const atlasClusterUrl = process.env.MONGODB_ATLAS_CLUSTER_URL;

// Connect to MongoDB Atlas

mongoose.connect(`mongodb+srv://${atlasUsername}:${atlasPassword}@${atlasClusterUrl}`, {
  useNewUrlParser: true, useUnifiedTopology: true
}).then(() => {
  console.log("CONNECTION OPEN!!!");
}).catch(err => {
  console.log("OH NO ERROR!!!");
  console.log(err);
})

mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema ({
  username: String,
  password: String,
  googleId: String,
  secret: String
});

//Passport will hash, sort and organize passwords into our database
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)

//Now we can create the schema
const User = new mongoose.model('User', userSchema);

//The following codes will be added after the declaration of the model
passport.use(User.createStrategy());

// Expanded passport.serializeUser
passport.serializeUser(function(user, done){
  done(null, user.id);
});

//Expanded passport.deserializeUser
passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// const user = new DefaultUser({username: 'user'});
// await user.setPassword('password');
// await user.save();
// const { user } = await DefaultUser.authenticate()('user', password);

app.get("/", function(req, res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

  app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login "}),
    function(req, res) {
      // Successful authentication, redirect to the secrets page.
      res.redirect("/secrets");
    });

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {userswithSecrets: foundUsers})
      }
    }
  })
});

app.get("/submit", function(req, res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login")
  }
})

app.post("/submit", function(req, res){
   const submittedSecret = req.body.secret;
   console.log(req.user);

   User.findById(req.user.id, function(err, foundUser){
     if (err) {
       console.log(err);
     }else {
       if (foundUser) {
         foundUser.secret = submittedSecret;
         foundUser.save(function(){
           res.redirect("/secrets")
         })
       }
     }
   });
});

app.get("/logout", function(req, res){
  req.logout(function(err, resp){
    if (err) {
      console.log(err);
    }else {
      res.redirect("/");
    }
  });

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
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    }else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      })
    }
  })

})











const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
