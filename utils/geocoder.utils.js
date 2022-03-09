const NodeGeocoder = require('node-geocoder');

const options = {
    /* provider: process.env.GEOCODER_PROVIDER, */
    provider: 'mapquest',
    httpAdapter: 'https',
    /*  apiKey: process.env.GEOCODER_API_KEY, */
    apiKey: 'RbXFQCCe0GeZLTniHwtILuLOux5K1q48',
    formatter: null
}

const geocoder = NodeGeocoder(options);

module.exports = geocoder;