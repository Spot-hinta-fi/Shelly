// You can support spot-hinta.fi service here: https://www.buymeacoffee.com/spothintafi
// Supported Shelly firmwares: 1.0.3 - 1.0.8. Script version: 2023-11-09

// NOTE! This script works only with "Shelly Plus Plug S" -smart plug

// Region to use
let Region = "FI"; // Supported regions: DK1, DK2, EE, FI, LT, LV, NO1, NO2, NO3, NO4, NO5, SE1, SE2, SE3, SE4

// Configure colors
const CheapPriceColor = [0, 100, 0]; // Green
const MiddlePriceColor = [100, 60, 0]; // Yellow
const ExpensivePriceColor = [100, 0, 0]; // Red
const UnknownPriceColor = [100, 100, 100]; // White

// Customized price limits. Overrides the standard functionality of 8 hours relative blocks.
// Define cheap price limit (green) and expensive price limit (red). What is left between is middle price (yellow).
const UsePriceLimits = false; // Change to 'true' if you want to define price limits for colors
const CheapPriceLimit = 5;  // Cheap price limit in euro cents
const ExpensivePriceLimit = 12; // Expensive price limit in euro cents


// Script starts here, do not edit
print("PlusPlugS-StreetLight script is starting... (color will be set in 60 seconds)");
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
        print("Hour has changed, getting what color the LED light should be...");
        Shelly.call("HTTP.Request", { method: "GET", url: urlToCall, timeout: 10, ssl_ca: "*" }, ProcessResponse);
    }
});

function ProcessResponse(response, error_code) {
    if (error_code === 0 && response !== null && response.code === 200) {
        if (UsePriceLimits === true) {
            if (response.body === 0) { print("Hour is cheap"); currentHourColor = CheapPriceColor; }
            if (response.body === 1) { print("Hour is middle price"); currentHourColor = MiddlePriceColor; }
            if (response.body === 2) { print("Hour is expensive"); currentHourColor = ExpensivePriceColor; }
            ChangeColor(currentHourColor);
        }
        else {
            if (response.body <= 8) { print("Hour is cheap. Rank: " + response.body); currentHourColor = CheapPriceColor; }
            else if (response.body >= 17) { print("Hour is expensive. Rank: " + response.body); currentHourColor = ExpensivePriceColor; }
            else { print("Hour is middle price. Rank: " + response.body); currentHourColor = MiddlePriceColor; }
            ChangeColor(currentHourColor);
        }
    }
    else {
        print("An error occurred while fetching rank data"); ChangeColor(UnknownPriceColor); currentHour = -1;
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
        print("Successfully changed the color of the led. Response: " + JSON.stringify(response));
        return;
    }

    print("Color change was not successful. Error code: " + error_code + " - Error message: " + error_msg);
    currentHour = -1;
}