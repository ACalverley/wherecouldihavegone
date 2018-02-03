//use express
var express = require("express");
var passport = require('passport');
var FitbitApiClient = require("fitbit-node");
var app = express();
    
//all files to be rendered are ejs (no longer need .ejs at the end)
app.set("view enginer", "ejs");

app.use(express.static(__dirname + '/public'));




const client = new FitbitApiClient({
	clientId: "null",
	clientSecret: "null",
	apiVersion: '1.2' // 1.2 is the default
});

// redirect the user to the Fitbit authorization page
app.get("/authorize", (req, res) => {
	// request access to the user's activity, heartrate, location, nutrion, profile, settings, sleep, social, and weight scopes
	res.redirect(client.getAuthorizeUrl('activity heartrate location nutrition profile settings sleep social weight', 'https://immense-shelf-22042.herokuapp.com/', 'login'));
});

// handle the callback from the Fitbit authorization flow
app.get("/callback", (req, res) => {
	// exchange the authorization code we just received for an access token
	client.getAccessToken(req.query.code, 'https://immense-shelf-22042.herokuapp.com/').then(result => {
		// use the access token to fetch the user's profile information
		client.get("/profile.json", result.access_token).then(results => {
		  //  console.log("success!");
			res.send(result[0]);
		});
	}).catch(res.send);
});



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