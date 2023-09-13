# API.SPOT-HINTA.FI / Shelly smart relays
Spot-hinta.fi Shelly scripts automate relays according to the electricity spot-prices, which are read from the api.spot-hinta.fi. Scripts work in Finland, Sweden, Norway, Denmark, Estonia, Latvia and Lithuania. See API Swagger documentation for details: https://api.spot-hinta.fi/swagger/ui

Study scripts and read comments to select which script works best for your own needs.

## Installation instructions

1. Open Shelly internal UI with a web-browser.
2. Install scripts simply with Shelly Library functionality, use this library URL: http://api.spot-hinta.fi/Shelly/library (firmware 1.0.0) and http://api.spot-hinta.fi/Shelly/scripts (firmware 1.0.2 onwards)
3. Configure scripts according to your needs, scripts have many comments in English.
4. Use Monitoring script to secure script execution. Test that Monitoring script works by manually stopping monitored scripts.
5. Test scripts by changing the parameters to see that relay is doing expected job.

Enjoy automatic control of your relays when electricity price is cheap (or.. maybe not cheap, but not the most expensive either)


## Shelly scripts in this package

1. "Minimal water heating" - this script is, as the name indicates, a minimal script targeted to a water heating with a single relay Shelly.
2. "Rank and Price limit" - this script can control two relays according to the fixed price, average price and also using the cheapest hours
3. "Outdoor temperature adjusted heating" - this script can control up to 3 relays according to the adjusted "rank" based on weather forecast
4. "Monitoring" - this script keeps other scripts running and optionally restarts Shelly, if Internet connection is lost
