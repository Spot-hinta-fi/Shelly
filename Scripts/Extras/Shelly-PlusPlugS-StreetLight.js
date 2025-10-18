// Thank you for your support: https://www.buymeacoffee.com/spothintafi
// Supported Shelly firmwares: 1.4.4 - 1.7.1. Script version: 2025-10-18

// Note: This script works only with "Shelly Plus Plug S" -smart plug
// Note: The script works with 15-minute prices

// Region to use
let Region = "FI"; // Supported regions: DK1, DK2, EE, FI, LT, LV, NO1, NO2, NO3, NO4, NO5, SE1, SE2, SE3, SE4

// You have the option to set precise price limits or disable them, adjusting LED color based on relative prices:
// The 33% cheapest periods will be displayed in green, the 33% most expensive in red, and the remaining 33% in orange.
const UsePriceLimits = false; // When set to "false," utilize relative prices instead of fixed price limits.
const CheapPriceLimit = 5;  // Sets the price limit in euro cents. When the price falls below this limit, the color is "Green"
const ExpensivePriceLimit = 12; // Establishes the expensive price limit in euro cents. When the price exceeds this limit, the color is set to "Red"

// Configure colors
const CheapPriceColor = [0, 100, 0]; // Green
const MiddlePriceColor = [100, 30, 0]; // Orange
const ExpensivePriceColor = [100, 0, 0]; // Red
const UnknownPriceColor = [0, 0, 100]; // Blue

// Script starts here, do not edit
print("PlusPlugS-StreetLight: script is starting... (color will be set in 30 seconds)");
let config;
let currentHour = -1;
let currentQuarter = -1; // Track 15-minute periods (0, 1, 2, 3)
let currentHourColor = UnknownPriceColor;
let urlToCall = "";

if (UsePriceLimits === true) {
    urlToCall = "https://api.spot-hinta.fi/JustNow/" + CheapPriceLimit + "/" + ExpensivePriceLimit + "?region=" + Region
} else {
    urlToCall = "https://api.spot-hinta.fi/JustNowRank?region=" + Region;
}

// Get current configuration. Only color is modified, other settings remain.
Shelly.call("PLUGS_UI.GetConfig", null, function (response) { config = response; });

// Timer to change color each 15-minute period. Checks every 30 seconds if period has changed.
Timer.set(30000, true, function () {
    let now = new Date();
    let newHour = now.getHours();
    let newMinute = now.getMinutes();
    let newQuarter = Math.floor(newMinute / 15);

    if (currentHour === newHour && currentQuarter === newQuarter) {
        return;
    }

    currentHour = newHour;
    currentQuarter = newQuarter;
    let timeString = newHour + ":" + (newQuarter * 15);
    print("PlusPlugS-StreetLight: 15-minute period has changed (" + timeString + "), getting what color the LED light should be...");
    Shelly.call("HTTP.Request", { method: "GET", url: urlToCall, timeout: 10, ssl_ca: "*" }, ProcessResponse);
});

function ProcessResponse(response, error_code) {
    if (error_code === 0 && response !== null && response.code === 200) {
        let responseCode = response.body * 1;

        if (UsePriceLimits === true) {
            if (responseCode === 0) {
                print("PlusPlugS-StreetLight: Period is cheap");
                currentHourColor = CheapPriceColor;
            }
            else if (responseCode === 1) {
                print("PlusPlugS-StreetLight: Period is middle price");
                currentHourColor = MiddlePriceColor;
            }
            else if (responseCode === 2) {
                print("PlusPlugS-StreetLight: Period is expensive");
                currentHourColor = ExpensivePriceColor;
            }
            else {
                print("PlusPlugS-StreetLight: Unexpected response code: " + responseCode);
                currentHourColor = UnknownPriceColor;
            }
            ChangeColor(currentHourColor);
        }
        else {
            // Dynamic pricing: 96 periods per day (24h × 4 = 96 fifteen-minute periods)
            // Split into thirds: 1-32 (cheap), 33-64 (middle), 65-96 (expensive, can be up to 100 during winter time change)

            if (responseCode >= 1 && responseCode <= 32) {
                print("PlusPlugS-StreetLight: Period is cheap. Rank: " + responseCode + "/96");
                currentHourColor = CheapPriceColor;
            }
            else if (responseCode >= 33 && responseCode <= 64) {
                print("PlusPlugS-StreetLight: Period is middle price. Rank: " + responseCode + "/96");
                currentHourColor = MiddlePriceColor;
            }
            else if (responseCode >= 65 && responseCode <= 100) {
                print("PlusPlugS-StreetLight: Period is expensive. Rank: " + responseCode + "/96");
                currentHourColor = ExpensivePriceColor;
            }
            else {
                print("PlusPlugS-StreetLight: Invalid rank: " + responseCode + " (expected 1-96)");
                currentHourColor = UnknownPriceColor;
            }
            ChangeColor(currentHourColor);
        }
    }
    else {
        print("PlusPlugS-StreetLight: An error occurred while fetching rank data");
        ChangeColor(UnknownPriceColor);
        currentHour = -1;
        currentQuarter = -1;
    }
}

function ChangeColor(color) {
    if (config === null || config === undefined) {
        print("PlusPlugS-StreetLight: Config not loaded yet, retrying in 10 seconds...");
        Timer.set(10000, false, function () { ChangeColor(color); });
        return;
    }

    // Set plug to switch mode to ensure that price level lights work
    config.leds.mode = "switch";
    config.leds.colors["switch:0"].on.rgb = color;
    config.leds.colors["switch:0"].on.brightness = 100;
    config.leds.colors["switch:0"].off.rgb = color;
    config.leds.colors["switch:0"].off.brightness = 10;

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
    currentQuarter = -1;
}