//use express
var express = require("express");
var passport = require('passport');
var current_date = require("current-date");
var FitbitApiClient = require("fitbit-node");
var bodyParsern = require('body-parser');
var request = require('request');
var app = express();
var date = current_date('date', '-');

app.use(express.static(__dirname + '/public'));

var resPath = "activities/distance/date/";
var timePeriod; 
var url;
var accessToken;
var userLat, userLong;

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
	res.redirect(client.getAuthorizeUrl('activity heartrate location nutrition profile settings sleep social weight', 'http://wherecouldihavegone.com/callback', 'login'));
});

// handle the callback from the Fitbit authorization flow
app.get("/callback", (req, res) => {
	// exchange the authorization code we just received for an access token
	client.getAccessToken(req.query.code, 'http://wherecouldihavegone.com/callback').then(result => {
		// use the access token to fetch the user's profile information
		accessToken = result.access_token;

        request.post("https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyDU-JY9CP6t-A6tBjSsvamsBiRg0hgY2T4", (req, res) => {
            let parsedBody;
            try {
                parsedBody = JSON.parse(res.body);
            } catch(e) {
                //Handle error
                console.log(e);
            }
            console.log(parsedBody);
            userLat = parsedBody.location.lat;
            userLong = parsedBody.location.lng;
            console.log("lat is: ", userLat, " long is: ", userLat);
        });
	}).catch(res.send);
	
	res.render("maps.ejs",{lat: userLat, long: userLong});
});


app.get("/getTimePeriod", (req, res) => {
   res.render("maps.ejs"); 
});

app.get("/getDistance", (req, res) => {
    client.get(url, accessToken).then(result => {
        res.send(result[0]);
    });
});

//function that runs when loading a page (get request)
app.get("/", function(req, res){
    res.render("index.html");
});

app.get("*", function(req, res){
   res.send("Sorry, page not found...What are you doing with your life?"); 
});

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server has started!");
});