var crg = require('./radius-geocoder.js');
var request = require('request-promise-native');
require('dotenv').config();
const api_key = process.env.GOOGLEMAPS_API_KEY;

module.exports = function(userLat, userLong, distanceTraveled) {
    var origin_address, destination_address;
    var url = `https://www.googleapis.com/maps/api/geocode/json?latlng=${userLat},${userLong}&key=${api_key}`;

   	return getNearestCity(userLat, userLong, distanceTraveled);


    function getAddress(){
        request.post(url, (req, res) => {
            let parsedBody;
            try {
                parsedBody = JSON.parse(res.body);
            } catch(e) {
                //Handle error
                console.log(e);
            }
            origin_address = parsedBody.results[0].formatted_address
            console.log("origin address is: ", origin_address);
        });
    }
}


function getNearestCity(userLat, userLong, distanceTraveled){
        // Return the nearest cities within a certain distance of the provided lat/lon
        var results = crg(userLat, userLong, distanceTraveled);

        // console.log("results: ", results);
        console.log(userLat)
        console.log(userLong)
        console.log(api_key)

        // Slice = Extracts part of string and returns extracted part of new string (why would we want to slice this at 50?)
        // Map =
        const promises = results.slice(0, 50).map((city) => request.get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLat},${userLong}&destinations=${city.latitude},${city.longitude}&key=${api_key}&mode=walking&units=metric`));

        // console.log("promises: ", promises);

        var distanceTraveled_meters = distanceTraveled * 1000;
        var minHamming = 10000;
        var nearCity;
        var errorCount = 0;

        // Uncertain about Promise.all functionality
        // Uncertain about reduce(nearestCity, currentCity)
        return Promise.all(promises)
            // iterate through elements in 'responses'
            // use to prepare the array of values for processing 
        	.then((responses) => responses.map(o=>JSON.parse(o)))
            // reduce(new var set equal to return of function inside .reduce(), next element in 'responses')
        	.then((responses) => responses.reduce((nearestCity, currentCity)=>{
        		// console.log("city: ", currentCity);
        		// console.log("rows:",currentCity.rows[0]);
        		// console.log("current city info - ",currentCity.rows[0].elements[0]);
        		// console.log("nearest city info - ",nearestCity.rows[0].elements[0]);
        		// console.log("current city: ",currentCity);
                // console.log("current city destination address: ",currentCity.destination_addresses[0]);
                // console.log("nearestCity status: ", currentCity.rows[0].elements[0].status);
                console.log("Current city: ",currentCity.rows[0]);
                var status = currentCity.rows[0].elements[0].status;

                console.log("got status");

                if (status === "OK"){
                    console.log("status is valid")
                    var hamming = Math.abs(currentCity.rows[0].elements[0].distance.value - distanceTraveled_meters);
                    console.log("Hamming val: ", hamming, " for ", currentCity.destination_addresses[0]);
                    if(hamming < minHamming) {
                        minHamming = hamming;
                        console.log("************************   new nearest city: ", currentCity.destination_addresses[0]);
                        return currentCity;
                    }
                    else return nearestCity;
                }

                else{
                    // console.log(currentCity.rows[0].elements[0].status);
                    console.log("status is not valid, no search results found");
                    // errorCount++;
                    return nearestCity;
                }
        	}), 0)
        	.then(console.log())
        	.catch(console.error);
}
