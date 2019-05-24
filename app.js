//use express
require('dotenv').config()
require('now-env');
let fs = require('fs');
let bodyParser = require('body-parser');
let express = require("express");
let passport = require('passport');
let current_date = require("current-date");
let FitbitApiClient = require("fitbit-node");
let geoLocation = require('./public/JS/run-radius-geocoder.js');
let formatQuery = require('./public/JS/formatQuery.js');
let getLocation = require('./public/JS/location.js')
let app = express();
const port = process.env.PORT || 3000;
const api_key = process.env.GOOGLEMAPS_API_KEY; // config done in heroku
const callbackURL = "https://wherecouldihavegone.com/fitbitCallback";
const devCallbackURL = "http://localhost:3000/fitbitCallback";

let getNearestCity = geoLocation.getNearestCity;
let getUserAddress = geoLocation.getUserAddress;

// console.log("Client ID: ",process.env.FITBIT_CLIENTID)

app.use(express.static(__dirname, { dotfiles: 'allow' } ));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies

var resPath = "activities/distance/date/";
var timePeriod;
var url;
var accessToken;
var userLat, userLong;
var distanceSum, user_destination, ugandaChild_destination, origin, ugandaChildDistance;
ugandaChildDistance = (3 * 30) * 12;

const client = new FitbitApiClient({
  clientId: process.env.FITBIT_CLIENTID,
  clientSecret: process.env.FITBIT_CLIENT_SECRET,
  apiVersion: '1.2' // 1.2 is the default
});

// redirect the user to the Fitbit authorization page
app.get("/authorize", (req, res) => {
  console.log("calling fitbit api");
    // request access to the user's activity, heartrate, location, nutrion, profile, settings, sleep, social, and weight scopes
  res.redirect(client.getAuthorizeUrl('activity location profile settings social weight', callbackURL, 'login'));
});

app.get('/fitbitCallback', async (req, res) => {
  const {access_token:accessToken} = await client.getAccessToken(req.query.code, callbackURL);
  const date = current_date('date', '-');
  ugandaChildDistance = (3 * 30) * 12;
  const url = `/activities/distance/date/${date}/3m.json`;

  const [body, response] = await client.get(url, accessToken);

  distanceSum = body["activities-distance"].reduce((sum, {value})=>sum + Number(value), 0).toFixed(2);

  res.redirect('/findCities');
});


app.get('/mainPage', (req, res) => {
  console.log("loading main page");

  res.render("maps_2path_new.ejs", {
      distanceTraveled: distanceSum,
      userLat: userLat,
      userLong: userLong,
      user_destination: user_destination,
      ugandaChild_destination: ugandaChild_destination,
      origin: origin
  });
});


app.post("/userLocation", (req, res) => {
  console.log("Lat: ", req.body.lat);
  console.log("Long: ", req.body.long);

  userLat = req.body.lat;
  userLong = req.body.long;
  const isDemo = req.body.isDemo;
  
  // when Demo button is clicked!
  if (isDemo == 1) {
    distanceSum = 63.7;
    res.redirect('/findCities');
  } else {
    console.log("calling authorize");
    res.redirect('/authorize');
  }
});

app.get("/findCities", async (req, res) => {

  var user_nearestCity = await getNearestCity(userLat, userLong, distanceSum);

  if (user_nearestCity == null){
    console.log("fitbit has 0 distance travelled");
    origin = await getUserAddress(userLat, userLong);
    console.log(origin);
    user_destination = origin;
  } else {
    user_destination = formatQuery(user_nearestCity.destination_addresses[0]);
    origin = formatQuery(user_nearestCity.origin_addresses[0]);
  }

  var ugandaChild_nearestCity = await getNearestCity(userLat, userLong, ugandaChildDistance);
  ugandaChild_destination = formatQuery(ugandaChild_nearestCity.destination_addresses[0]);
  
  console.log("nearest city----------: ", user_destination);
 
  console.log("user destination:", user_destination);
  console.log("uganda child destination:", ugandaChild_destination);
  console.log("origin: ", origin);
  
  res.redirect("/mainPage");
});

app.get("/getDistance", (req, res) => {
    client.get(url, accessToken).then(result => {
        res.send(result[0]);
    });
});

//function that runs when loading a page (get request)
app.get("/test", function(req, res){
    res.render("maps_1path.ejs", {
        distanceTraveled: 100,
        userLat: 50,
        userLong: -50,
        destination: "372 Maple St, Deseronto, ON K0K 1X0, Canada",
        origin: "119 Collingwood St, Kingston, ON K7L 3X6, Canada"
    });
});

app.get("*", function(req, res){
   res.send("Sorry, page not found");
});

app.listen(port, process.env.IP, function(){
    console.log(`Server has started! Running on port: ${port}`);
});
