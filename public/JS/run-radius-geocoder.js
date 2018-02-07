var crg = require('./radius-geocoder.js');
var request = require('request-promise-native');
const api_key = "AIzaSyB9b1eU1IE9Tdh0Bo8y8GMabGhMiQ-XTps";

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
            origin_address = parsedBody.results[0].formatted_address;
            console.log("origin address is: ", origin_address);
            
            
            // res.render("test_maps.ejs",{origin_address: origin_address, destination_address: destination_address});
        });
    }
}


function getNearestCity(userLat, userLong, distanceTraveled){
        // Return the nearest cities within a certain distance of the provided lat/lon
        var results = crg(userLat, userLong, distanceTraveled);

        const promises = results.slice(0, 50).map((city)=> request.get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLat},${userLong}&destinations=${city.latitude},${city.longitude}&key=${api_key}&mode=walking&units=metric`));

        var minHamming = 10000;
        var nearCity;

        return Promise.all(promises)
        	.then((responses)=> responses.map(o=>JSON.parse(o)))
        	.then((responses)=> responses.reduce((nearestCity, currentCity)=>{
        		// console.log("city: ", currentCity);
        		// console.log("rows:",currentCity.rows[0]);
        		// console.log("current city info - ",currentCity.rows[0].elements[0]);
        		// console.log("nearest city info - ",nearestCity.rows[0].elements[0]);
        		// console.log(currentCity);
        		var hamming = Math.abs(currentCity.rows[0].elements[0].distance.value - distanceTraveled);
        		if(hamming < minHamming) {
        			return currentCity;
        		}
        		else return nearestCity;
        	}), 0)
        	// .then(console.log)
        	.catch(console.error);
}

