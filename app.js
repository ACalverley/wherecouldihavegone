//use express
require('dotenv').config();
let fs = require('fs');
let bodyParser = require('body-parser');
let express = require("express");
let passport = require('passport');
let current_date = require("current-date");
let FitbitApiClient = require("fitbit-node");
let request = require('request-promise-native');
let getNearestCity = require('./public/JS/run-radius-geocoder.js');
let formatQuery = require('./public/JS/formatQuery.js');
let getLocation = require('./public/JS/location.js')
let app = express();
const port = process.env.PORT || 3000;
const api_key = process.env.GOOGLEMAPS_API_KEY; // config done in heroku
const letsEncryptResponse = process.env.CERTBOT_RESPONSE
const callbackURL = "https://www.wherecouldihavegone.com/callback";
const devCallbackURL = "http://www.localhost:3000/callback";

// console.log("Client ID: ",process.env.FITBIT_CLIENTID)

// SSL Certificate
/*
const privateKey = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};
*/

app.use(express.static(__dirname, { dotfiles: 'allow' } ));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded());
// app.set('view engine', 'ejs');

var resPath = "activities/distance/date/";
var timePeriod;
var url;
var accessToken;
var userLat, userLong;
var distanceSum, user_destination, ugandaChild_destination, origin, ugandaChildDistance;

const client = new FitbitApiClient({
  clientId: process.env.FITBIT_CLIENTID,
  clientSecret: process.env.FITBIT_CLIENT_SECRET,
  apiVersion: '1.2' // 1.2 is the default
});

// Return the Let's Encrypt certbot response:
//app.get('/.well-known/acme-challenge/:content', function(req, res) {
//  res.send(letsEncryptReponse);
//});

// redirect the user to the Fitbit authorization page
app.get("/authorize", (req, res) => {
  console.log("calling fitbit api");
    // request access to the user's activity, heartrate, location, nutrion, profile, settings, sleep, social, and weight scopes
  res.redirect(client.getAuthorizeUrl('activity location profile settings social weight', devCallbackURL, 'login'));
});

app.get('/callback', async function(req, res) {
  const {access_token:accessToken} = await client.getAccessToken(req.query.code, devCallbackURL);
  const date = current_date('date', '-');
  ugandaChildDistance = (3 * 30) * 12;
  const url = `/activities/distance/date/${date}/3m.json`;

  const [body, response] = await client.get(url, accessToken);

  distanceSum = body["activities-distance"].reduce((sum, {value})=>sum + Number(value), 0).toFixed(2);

  res.render("getUserLocation.ejs", {distanceTraveled: distanceSum});
});

app.get('/mainPage', (req, res) => {
  console.log("loading main page");

  res.render("maps_2path.ejs", {
      distanceTraveled: distanceSum,
      userLat: userLat,
      userLong: userLong,
      user_destination: user_destination,
      ugandaChild_destination: ugandaChild_destination,
      origin: origin
  });
});

app.post("/userLocation", async (req, res) => {
  console.log("Lat: ", req.body.lat);
  console.log("Long: ", req.body.long);

  userLat = req.body.lat;
  userLong = req.body.long;

  var user_nearestCity = await getNearestCity(userLat, userLong, distanceSum);

  var ugandaChild_nearestCity = await getNearestCity(userLat, userLong, ugandaChildDistance);

  console.log("nearest city----------: ", user_nearestCity);

  user_destination = formatQuery(user_nearestCity.destination_addresses[0]);
  ugandaChild_destination = formatQuery(ugandaChild_nearestCity.destination_addresses[0]);
  console.log(user_nearestCity.origin_addresses[0])

  origin = formatQuery(user_nearestCity.origin_addresses[0]);

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
