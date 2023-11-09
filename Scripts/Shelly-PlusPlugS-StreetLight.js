// You can support spot-hinta.fi service here: https://www.buymeacoffee.com/spothintafi
// Supported Shelly firmwares: 1.0.3 - 1.0.8. Script version: 2023-11-09

// NOTE! This script works only with "Shelly Plus Plug S" -smart plug

// Region to use
let Region = "FI"; // Supported regions: DK1, DK2, EE, FI, LT, LV, NO1, NO2, NO3, NO4, NO5, SE1, SE2, SE3, SE4

// You have the option to set precise price limits or disable them, adjusting LED color based on relative prices:
// The 8 cheapest hours will be displayed in green, the 8 most expensive in red, and the remaining 8 hours in yellow.
const UsePriceLimits = true; // When set to "false," utilize relative prices instead of fixed price limits.
const CheapPriceLimit = 5;  // Sets the price limit in euro cents. When the price falls below this limit, the color is "Green"
const ExpensivePriceLimit = 12; // Establishes the expensive price limit in euro cents. When the price exceeds this limit, the color is set to "Red"

// Configure colors
const CheapPriceColor = [0, 100, 0]; // Green
const MiddlePriceColor = [100, 60, 0]; // Yellow
const ExpensivePriceColor = [100, 0, 0]; // Red
const UnknownPriceColor = [100, 100, 100]; // White

// Script starts here, do not edit
print("PlusPlugS-StreetLight: script is starting... (color will be set in 60 seconds)");
let config; let currentHour = -1; let currentHourColor = UnknownPriceColor; let urlToCall = "";

if (UsePriceLimits === true) {
    urlToCall = "https://api.spot-hinta.fi/JustNow/" + CheapPriceLimit + "/" + ExpensivePriceLimit + "?region=" + Region
} else {
    urlToCall = "https://api.spot-hinta.fi/JustNowRank?region=" + Region;
}

// Get current configuration. Only color is modified, other settings remain.
Shelly.call("PLUGS_UI.GetConfig", null, function (response) { config = response; });

// Timer to  change color each hour. Color changes during the first minute of an hour
Timer.set(60000, true, function () {
    if (currentHour === new Date().getHours()) { return; }
    else {
        currentHour = new Date().getHours();
        print("PlusPlugS-StreetLight: Hour has changed, getting what color the LED light should be...");
        Shelly.call("HTTP.Request", { method: "GET", url: urlToCall, timeout: 10, ssl_ca: "*" }, ProcessResponse);
    }
});

function ProcessResponse(response, error_code) {
    if (error_code === 0 && response !== null && response.code === 200) {
        let responseCode = response.body * 1;
        if (UsePriceLimits === true) {
            if (responseCode === 0) { print("PlusPlugS-StreetLight: Hour is cheap"); currentHourColor = CheapPriceColor; }
            if (responseCode === 1) { print("PlusPlugS-StreetLight: Hour is middle price"); currentHourColor = MiddlePriceColor; }
            if (responseCode === 2) { print("PlusPlugS-StreetLight: Hour is expensive"); currentHourColor = ExpensivePriceColor; }
            ChangeColor(currentHourColor);
        }
        else {
            if (responseCode <= 8) { print("PlusPlugS-StreetLight: Hour is cheap. Rank: " + responseCode); currentHourColor = CheapPriceColor; }
            else if (responseCode >= 17) { print("PlusPlugS-StreetLight: Hour is expensive. Rank: " + responseCode); currentHourColor = ExpensivePriceColor; }
            else { print("PlusPlugS-StreetLight: Hour is middle price. Rank: " + responseCode); currentHourColor = MiddlePriceColor; }
            ChangeColor(currentHourColor);
        }
    }
    else {
        print("PlusPlugS-StreetLight: An error occurred while fetching rank data"); ChangeColor(UnknownPriceColor); currentHour = -1;
    }
}

function ChangeColor(color) {
    config.leds.colors["switch:0"].on.rgb = color;
    config.leds.colors["switch:0"].off.rgb = color;
    let urlToUpdateColor = "http://localhost/rpc/PLUGS_UI.SetConfig?config=" + JSON.stringify(config);
    Shelly.call("HTTP.Request", { method: "GET", url: urlToUpdateColor, timeout: 15, ssl_ca: "*" }, ProcessColorChangeResponse);
}

function ProcessColorChangeResponse(response, error_code, error_msg) {

    if (error_code === 0 && response !== null) {
        print("PlusPlugS-StreetLight: Successfully changed the color of the led.");
        return;
    }

    print("PlusPlugS-StreetLight: Color change was not successful. Error code: " + error_code + " - Error message: " + error_msg);
    currentHour = -1;
}