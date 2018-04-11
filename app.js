//use express
var express = require("express");
var passport = require('passport');
var current_date = require("current-date");
var FitbitApiClient = require("fitbit-node");
var request = require('request-promise-native');
var getNearestCity = require('./public/JS/run-radius-geocoder.js');
var formatQuery = require('./public/JS/formatQuery.js');
var app = express();
const port = process.env.PORT || 3000;
const api_key = process.env.FITBIT_API_KEY; // config done in heroku
const callbackURL = "http://www.wherecouldihavegone.com/callback";


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

// redirect the user to the Fitbit authorization page
app.get("/authorize", (req, res) => {
  console.log("calling fitbit api");
    // request access to the user's activity, heartrate, location, nutrion, profile, settings, sleep, social, and weight scopes
  res.redirect(client.getAuthorizeUrl('activity heartrate location profile settings social weight', callbackURL, 'login'));
});


app.get('/callback', async function(req, res) {
    const {access_token:accessToken} = await client.getAccessToken(req.query.code, callbackURL);
    // console.log(access_token);
    const date = current_date('date', '-');
    const ugandaChildDistance = (3 * 30) * 12;
    const url = `/activities/distance/date/${date}/3m.json`;
  
    const [body, response] = await client.get(url, accessToken); 
    // console.log(response.statusCode, body["activities-distance"]);

    const distanceSum = body["activities-distance"].reduce((sum, {value})=>sum + Number(value), 0).toFixed(2);

    console.log("distance sum: ", distanceSum);

    const geolocationResponse = JSON.parse(await request.post(`https://www.googleapis.com/geolocation/v1/geolocate?key=${api_key}`));

    console.log("geolocation response:", geolocationResponse);

    userLat = geolocationResponse.location.lat;
    userLong = geolocationResponse.location.lng;
    // res.send(`lat is: ${userLat}, long is: ${userLong}`);
    
    var user_nearestCity = await getNearestCity(userLat, userLong, distanceSum);

    var ugandaChild_nearestCity = await getNearestCity(userLat, userLong, ugandaChildDistance);

    console.log("nearest city----------: ", user_nearestCity);

    var user_destination = formatQuery(user_nearestCity.destination_addresses[0]);
    var ugandaChild_destination = formatQuery(ugandaChild_nearestCity.destination_addresses[0]);
    var origin = formatQuery(user_nearestCity.origin_addresses[0]);

    console.log("user destination:", user_destination);
    console.log("uganda child destination:", ugandaChild_destination);
    console.log("origin: ", origin);

    // var neat_origin = origin.replace(/)

    // console.log("destination:", destination);
    // console.log("origin: ", origin);
    
    res.render("maps_2path.ejs", {distanceTraveled: distanceSum, userLat: userLat, userLong: userLong, user_destination: user_destination, ugandaChild_destination: ugandaChild_destination, origin: origin});
    // res.render("map-test.ejs");
});
    

app.get("/getDistance", (req, res) => {
    client.get(url, accessToken).then(result => {
        res.send(result[0]);
    });
});

//function that runs when loading a page (get request)
app.get("/test", function(req, res){
    res.render("maps_1path.ejs", {distanceTraveled: 100, userLat: 50, userLong: -50, destination: "372 Maple St, Deseronto, ON K0K 1X0, Canada", origin: "119 Collingwood St, Kingston, ON K7L 3X6, Canada"});
});

app.get("*", function(req, res){
   res.send("Sorry, page not found"); 
});

app.listen(port, process.env.IP, function(){
    console.log("Server has started!");
});