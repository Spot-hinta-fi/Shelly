# API.SPOT-HINTA.FI / Shelly smart relays
Spot-hinta.fi Shelly scripts automate relays according to the electricity spot-prices, which are read from the api.spot-hinta.fi. Scripts work in Finland, Sweden, Norway, Denmark, Estonia, Latvia and Lithuania. See API Swagger documentation for details: https://api.spot-hinta.fi/swagger/ui

Study scripts and read comments to select which script works best for your own needs.

## Installation instructions

1. Open Shelly internal UI with a web-browser. Update Shelly firmware to the latest version
2. Install scripts simply with Shelly Library functionality, use this library URL: http://api.spot-hinta.fi/Shelly/scripts
3. Configure scripts according to your needs, scripts have many comments in English.
4. Use Monitoring script to secure script execution. Test that Monitoring script works by manually stopping monitored scripts.
5. Test scripts by changing the parameters to see that relay is doing expected job.

Enjoy automatic control of your relays when the electricity price is cheap (or.. maybe not cheap, but not the most expensive either)


## Shelly scripts in this package

1. "Vesivaraaja" - This script is for Finnish market and designed especially for water boiler heating (night and afternoon hours)
2. "Pikakoodi" - this script is for Finnish market to provide simple pre-defined rules for heating. 
3. "Minimal heating" - this script is a minimal but still very versatile script for, for example water boiler heating
4. "SmartHeating" - this script is Smart! It can control heating based on outdoor temperature plus much more!
5. "Rank and Price limit" - this script can control two relays according to the fixed price, average price and also using the cheapest hours 
6. "SmartMonitoring" - Stores history of relay status changes in spot-hinta.fi cloud. Monitors Internet connection and script executions.
7. "Street light" - Shows Green/Yellow/Red color led depending on electricity price. Only for Shelly Plus Plug S -device!
