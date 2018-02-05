//use express
var express = require("express");
var passport = require('passport');
var current_date = require("current-date");
var FitbitApiClient = require("fitbit-node");
var request = require('request-promise-native');
var logic = require('./public/JS/run-radius-geocoder.js');
var app = express();
const port = process.env.PORT || 3000;
const api_key = "AIzaSyB9b1eU1IE9Tdh0Bo8y8GMabGhMiQ-XTps";

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

// app.post("/storeTimePeriod", function(req, res) {
//   timePeriod = req.body.timePeriod;
//   url = "/" + resPath + date + "/" + timePeriod + ".json";
//   res.redirect("/getDistance");
// });

// redirect the user to the Fitbit authorization page
app.get("/authorize", (req, res) => {
  console.log("we here");
    // request access to the user's activity, heartrate, location, nutrion, profile, settings, sleep, social, and weight scopes
  res.redirect(client.getAuthorizeUrl('activity heartrate location nutrition profile settings sleep social weight', 'http://localhost:3000/callback', 'login'));
});

// handle the callback from the Fitbit authorization flow
// app.get("/callback", (req, res) => {
//  // exchange the authorization code we just received for an access token
//  client.getAccessToken(req.query.code, 'http://wherecouldihavegone.com/callback').then(result => {
//    // use the access token to fetch the user's profile information
//    accessToken = result.access_token;

//         request.post("https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyDU-JY9CP6t-A6tBjSsvamsBiRg0hgY2T4", (req, res) => {
//             let parsedBody;
//             try {
//                 parsedBody = JSON.parse(res.body);
//             } catch(e) {
//                 //Handle error
//                 console.log(e);
//             }
//             console.log(parsedBody);
//             userLat = parsedBody.location.lat;
//             userLong = parsedBody.location.lng;
//             console.log("lat is: ", userLat, " long is: ", userLong);
//         });
//  }).then((result) => {
//      logic(userLat,userLong);
//  });
// });

app.get('/callback', async function(req, res) {
    const {access_token:accessToken} = await client.getAccessToken(req.query.code, 'http://localhost:3000/callback');
    // console.log(access_token);
    const date = current_date('date', '-');
    const url = `/activities/distance/date/${date}/7d.json`;
  
    const [body, response] = await client.get(url, accessToken); 
    // console.log(response.statusCode, body["activities-distance"]);

    const distanceSum = body["activities-distance"].reduce((sum, {value})=>sum + Number(value), 0);

    // request.post("https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyDU-JY9CP6t-A6tBjSsvamsBiRg0hgY2T4").then((response) => {
            // let parsedBody;
            // console.log(response);
            // try {
            //     parsedBody = JSON.parse(response);
            // } catch(e) {
            //     //Handle error
            //     console.log(e);
            // }
            // console.log(parsedBody);
            // userLat = parsedBody.location.lat;
            // userLong = parsedBody.location.lng;
              // console.log("lat is: ", userLat, " long is: ", userLong);
      // });

    const geolocationResponse = JSON.parse(await request.post(`https://www.googleapis.com/geolocation/v1/geolocate?key=${api_key}`));
    console.log(geolocationResponse);
    userLat = geolocationResponse.location.lat;
    userLong = geolocationResponse.location.lng;
    // res.send(`lat is: ${userLat}, long is: ${userLong}`);
    
    var nearestCity = await logic(userLat, userLong, distanceSum);

    // console.log("nearest city----------: ", nearestCity);

    var destination = nearestCity.destination_addresses[0];
    var bad_char_1 = destination.indexOf("-");
    if(bad_char_1) destination = destination.slice(bad_char_1 + 1, destination.length);

    console.log("destination:", destination);

    var origin = nearestCity.origin_addresses[0];
    var bad_char_2 = origin.indexOf("-");
    if(bad_char_2) origin = origin.slice(bad_char_2 + 1, origin.length);

    console.log("origin: ", origin);

    // var neat_origin = origin.replace(/)

    // console.log("destination:", destination);
    // console.log("origin: ", origin);
    
    res.render("test_maps.ejs", {userLat: userLat, userLong: userLong, destination: destination, origin: origin});
    // res.render("map-test.ejs");
});

// app.get("/getTimePeriod", (req, res) => {
//   res.render("maps.ejs"); 
// });

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

app.listen(port, process.env.IP, function(){
    console.log("Server has started!");
});