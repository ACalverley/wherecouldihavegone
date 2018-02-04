var crg = require('./radius-geocoder.js');
var request = require('request');

module.exports = function(userLat, userLong) {
    var origin_address, destination_address;
    var url = "https://www.googleapis.com/maps/api/geocode/json?latlng=" + userLat + "," + userLong + "&key=AIzaSyDU-JY9CP6t-A6tBjSsvamsBiRg0hgY2T4";
    
    getNearestCity(userLat, userLong);
    
    
    // getOriginAddress();
    
    
    function getAddress(){
        request.post(url, (req, res) => {
            let parsedBody;
            try {
                parsedBody = JSON.parse(res.body);
            } catch(e) {
                //Handle error
                console.log(e);
            }
            origin_address = parsedBody.results[0].formatted_address;
            console.log("origin address is: ", origin_address);
            
            
            // res.render("test_maps.ejs",{origin_address: origin_address, destination_address: destination_address});
        });
    }
}


function getNearestCity(userLat, userLong){
        // Return the nearest cities within a certain distance of the provided lat/lon
        var res = crg(userLat, userLong, 200);
        var destinationLat = res[0].latitude;
        var destinationLong = res[0].longitude;
}

