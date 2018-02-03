//use express
var express = require("express");
var passport = require('passport');
var bodyParser = require("body-parser");
var current_date = require("current-date");
var FitbitApiClient = require("fitbit-node");
var app = express();
var date = current_date('date', '-');

app.use(bodyParser.urlencoded({extended: true}));
    
//all files to be rendered are ejs (no longer need .ejs at the end)
app.set("view enginer", "ejs");

app.use(express.static(__dirname + '/public'));

var resPath = "activities/distance/date/";
var timePeriod; 
var url;
var accessToken;
var location;

const client = new FitbitApiClient({
	clientId: "22CLZZ",
	clientSecret: "d392657b7f9473d6a77da8f99dfcbf7d",
	apiVersion: '1.2' // 1.2 is the default
});

app.post("/storeTimePeriod", function(req, res) {
   timePeriod = req.body.timePeriod;
   url = "/" + resPath + date + "/" + timePeriod + ".json";
   res.redirect("/getDistance");
});

// redirect the user to the Fitbit authorization page
app.get("/authorize", (req, res) => {
	// request access to the user's activity, heartrate, location, nutrion, profile, settings, sleep, social, and weight scopes
	res.redirect(client.getAuthorizeUrl('activity heartrate location nutrition profile settings sleep social weight', 'https://immense-shelf-22042.herokuapp.com/callback', 'login'));
});

// handle the callback from the Fitbit authorization flow
app.get("/callback", (req, res) => {
	// exchange the authorization code we just received for an access token
	client.getAccessToken(req.query.code, 'https://immense-shelf-22042.herokuapp.com/callback').then(result => {
		// use the access token to fetch the user's profile information
		accessToken = result.access_token;
		
		app.post("https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyCFQ2_a-TTydH19osWZHvCrukRGJQ3ft7I", (req, res) => {
            location = res.body.location;
        });
        
        res.render("maps.ejs",{lat: location.lat, long: location.lng});
        
	}).catch(res.send);
});

app.get("/getTimePeriod", (req, res) => {
   res.render("test.ejs"); 
});

app.get("/getDistance", (req, res) => {
    client.get(url, accessToken).then(result => {
        res.send(result[0]);
    });
});

//function that runs when loading a page (get request)
app.get("/", function(req, res){
    res.render("index.ejs");
});

app.get("*", function(req, res){
   res.send("Sorry, page not found...What are you doing with your life?"); 
});


app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server has started!");
});