let axios = require('axios');
/*
let getLocationFromBrowser = () => {
    return (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
    };
}
*/

let getLocationFromBrowser = async () => {
    try {
        let userPosition = await axios('/userLocation');
        console.log(userPosition);
        return await userPosition.json()
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    getLocationFromBrowser
}
