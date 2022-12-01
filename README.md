# API.SPOT-HINTA.FI / Shelly Relays
Simple Shelly scripts to automate relays according to the Finnish electricity sport-prices, which are read from the api.spot-hinta.fi (see this site https://spot-hinta.fi for more info in Finnish).
Purpose is to install all three scripts into Shelly and then configure for each relay appropriate controlling mechanism.

## Installation instructions
Shelly beginners, see this: https://spot-hinta.fi/shelly-ohjeita-aloittelijalle/  (in Finnish).

1. Open Shelly UI with a browser
2. Upload all three scripts, "Monitoring" script as last
3. Configure scripts according to your needs

Enjoy automatic control of your relays when electricity price is cheap (or at least not the most expensive)


## Shelly scripts in this package

1. "Rank and Price limit" - this script can control up to four relays (2 + 2) according to the fixed price and "rank"
2. "Outdoor temperature adjusted heating" - this script can control up to 3 relays according to the adjusted "rank" based on temperature forecast
3. "Monitoring" - this script keeps first two scripts running and optionally restarts Shelly if Internet connection is lost
