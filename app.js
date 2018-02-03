//use express
var express = require("express");
var passport = require('passport');
var fitbitStrat = require( 'passport-fitbit-oauth2' ).FitbitOAuth2Strategy;
var app = express();
    
//all files to be rendered are ejs (no longer need .ejs at the end)
app.set("view enginer", "ejs");

app.use(express.static(__dirname + '/public'));


passport.use(new fitbitStrat({
    clientID: "22CLZZ",
    clientSecret: "d392657b7f9473d6a77da8f99dfcbf7d",
    callbackURL: "https://immense-shelf-22042.herokuapp.com/"
  },
  function(accessToken, refreshToken, profile, done) {
      
      console.log(profile.id);
      
    // User.findOrCreate({ fitbitId: profile.id }, function (err, user) {
    //   return done(err, user);
    // });
  }
));


//function that runs when loading a page (get request)
app.get("/", function(req,res){
    res.render("home.ejs");
});

app.get("*", function(req, res){
   res.send("Sorry, page not found...What are you doing with your life?"); 
});

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server has started!");
});