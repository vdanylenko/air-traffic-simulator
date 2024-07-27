const flights = require('./schedule.json');
const airports = require('./airports.json');

const AIRPLANE_SPEED = 10000;
const calculateDistance = function (airport1, airport2) {
    // Extract the latitude and longitude coordinates of the first airport
    const lat1 = airport1.coordinates.latitude;
    const lon1 = airport1.coordinates.longitude;

    // Extract the latitude and longitude coordinates of the second airport
    const lat2 = airport2.coordinates.latitude;
    const lon2 = airport2.coordinates.longitude;

    // Radius of the Earth in meters
    const R = 6371e3;

    // Convert latitude from degrees to radians
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;

    // Calculate the differences in latitude and longitude in radians
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    // Apply the Haversine formula to calculate the great-circle distance
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    // Calculate the angular distance in radians
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Calculate the distance in meters
    const distance = R * c;

    // Calculate the initial bearing from airport1 to airport2
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    const bearing = (θ * 180 / Math.PI + 360) % 360; // Convert from radians to degrees

    // Return both the distance and the direction
    return {
        distance: distance,
        direction: bearing
    };
};

const scheduleFlight = function (flight) {
    // get current time
    const currentTime = new Date().getTime();

    // get info on the airports - departure and arrival
    const departureAirport = airports[flight.departureAirport];
    const destinationAirport = airports[flight.destinationAirport];

    // get the distance between the airports
    const res = calculateDistance(departureAirport, destinationAirport)

    const distance = res.distance;
    const direction = res.direction;

    // get flight departure time
    const departureTime = new Date();

    const [hours, minutes, seconds] = flight.departureTime.split(':');
    departureTime.setHours(hours, minutes, seconds, 0);

    // estimate the progress of the flight
    const elapsedTime = currentTime - departureTime.getTime();
    const travelTime = (distance / AIRPLANE_SPEED) * 1000;
    const progress = elapsedTime / travelTime;

    // if the flight is not in the air - then give its status
    if (progress < 0) {
        return ({flightNumber: flight.flightNumber, status: "not departed"});
    }

    if (progress >= 1) {
        return ({flightNumber: flight.flightNumber, status: "landed"});
    }
    // console.log({progress, flightNumber: flight.flightNumber});
    // if not estimate the position
    const currentPosition = {
        latitude: departureAirport.coordinates.latitude + (destinationAirport.coordinates.latitude - departureAirport.coordinates.latitude) * progress,
        longitude: departureAirport.coordinates.longitude + (destinationAirport.coordinates.longitude - departureAirport.coordinates.longitude) * progress
    };
    // console.log({lat: currentPosition.latitude, lon: currentPosition.longitude})
    return ({
        flight,
        direction: direction,
        status: 'in flight',
        coordinates: {lat: currentPosition.latitude, lon: currentPosition.longitude},
        timestamp: Date.now()
    });

}

// const simulateFlights = function () {
//     flightStatuses = flights.map(flight => scheduleFlight(flight));
//
//     const inProgress  = flightStatuses.filter(flight => flight.status === 'in flight');
//     inProgress.map(status => console.log(status));
//     const landed = flightStatuses.filter(flight => flight.status === 'landed');
//     const notDeparted = flightStatuses.filter(flight => flight.status === 'not departed');
//     console.log(inProgress.length);
//     console.log(landed.length);
//     console.log(notDeparted.length);
// }


const getFlightsInProgress = () => {
    return flights.map(flight => scheduleFlight(flight))
        .filter(flight => flight.status === 'in flight');
}

module.exports = getFlightsInProgress;