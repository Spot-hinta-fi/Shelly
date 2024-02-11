# API.SPOT-HINTA.FI / For Shelly Plus smart relays
Spot-hinta.fi Shelly Plus scripts automate relays according to the electricity spot-prices, which are read from the api.spot-hinta.fi. Scripts works in Finland, Sweden, Norway, Denmark, Estonia, Latvia and Lithuania. See API Swagger documentation for details: https://api.spot-hinta.fi/swagger/ui

Study scripts and read comments to select which script suits the best for your needs.

## Installation instructions

1. Open web browser and go to Shelly Web Admin aka device's web user interface.
2. Update Shelly firmware to the latest version: Settings > Firmware > Update.
3. Go to Scripts > Library > Configure URL and insert library URL: http://api.spot-hinta.fi/Shelly/scripts
4. Choose the script you like and press "Insert code". 
5. Adjust script settings according to your needs. Scripts have comments in English.
6. Test script: Change the settings and verify that the relay is does the expected thing.
7. Use SmartMonitoring script to monitor script execution. Test Monitoring script by manually stopping monitored script(s) - monitoring script should restart the script shortly. 

Enjoy automatic control of your relays when the electricity price is cheap (or maybe not cheap, but at least not the most expensive)


## Shelly scripts in this package

1. Vesivaraaja: For Finland, designed especially for water boiler heating during night and afternoon hours. NOTE! This does NOT always use the day's cheapest hours - use Minimal Heating script for maximum effiency. 
3. Pikakoodi: For Finland, to use simple pre-defined rules, see https://spot-hinta.fi/pikakoodit/
4. Minimal Heating: Excellent choice for many cases, for example for water boiler and floor heating. Very versatile.  
5. Smart Heating: Can control heating based on outdoor temperature and much more. 
6. Rank and Price Limit: Can control two relays according to the fixed price, average price and cheapest price 
7. Smart Monitoring: Monitors internet connection and script execution. Stores relay status change history to spot-hinta.fi cloud. 
8. Street light: Only for Shelly Plus Plug S as those it has the RGB led. Makes the led green/yellow/red depending on electricity price. 
