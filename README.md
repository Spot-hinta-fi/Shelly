# API.SPOT-HINTA.FI / Shelly smart relays
Simple Shelly scripts to automate relays according to the Finnish electricity spot prices, which are read from the api.spot-hinta.fi (see this site https://spot-hinta.fi for more info in Finnish). Purpose is to install all three scripts into Shelly and then configure for each relay appropriate controlling mechanism.

## Installation instructions
Shelly beginners, see this first: https://spot-hinta.fi/shelly-ohjeita-aloittelijalle/  (in Finnish).

1. Open Shelly UI with a browser
2. Upload all three scripts, "Monitoring" script as last script
3. Configure scripts according to your needs, scripts have lots of comments
4. Activate also Monitoring script and then test that Monitoring script works by manually stopping two other scripts
5. Test scripts by changing parameters to see that relay is doing its job

Enjoy automatic control of your relays when electricity price is cheap (or.. maybe not cheap, but not the most expensive either)


## Shelly scripts in this package

1. "Rank and Price limit" - this script can control up to four relays (2 + 2) according to the fixed price and "rank"
2. "Outdoor temperature adjusted heating" - this script can control up to 3 relays according to the adjusted "rank" based on temperature forecast
3. "Monitoring" - this script keeps first two scripts running and optionally restarts Shelly if Internet connection is lost
