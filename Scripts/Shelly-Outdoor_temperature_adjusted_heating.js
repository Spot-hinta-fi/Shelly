/* More information about the API's (in Finnish): https://spot-hinta.fi/
 * Support API development and maintenance: https://www.buymeacoffee.com/spothintafi
 * 
 * With this script, it is possible to control up to three relays according weather forecase adjusted 'rank' 
 * If you want to test different parameters effect, go to Swagger tool and use "debug" parameter:
 * https://api.spot-hinta.fi/swagger/ui
 */


// ***********************************
// SETTINGS for RELAY 1 - change these
// ***********************************
let SETTINGS_1 =
{
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    Region: "FI", // See all supported regions from Swagger documentation: https://api.spot-hinta.fi/swagger/ui
    RankAtZeroDegrees: "5", // "Rank" (number of cheapest hours) when outdoor temperature is 0°C
    RankAdjusterPercentage: "15", // Percentage how much "Rank" is adjusted when outdoor temperature changes by one degree
    MinimumRank: "3", // Minimum 'Rank' when temperature goes above zero and Rank is getting smaller
    PriceAlwaysAllowed: "3", // "Allow always cheap prices". Price when relay is always ON.
    MaxPrice: "999", // This is the maximum allowed price in Euro cents.
    AllowedDays: "1,2,3,4,5,6,7", // Allowed days from Monday to Sunday. Modify only if you don't want everyday execution.
    PostalCode: "00100", // Postal code (Finland only!), which area temperature is used in calculations
    Latitude: "", // Latitude. Overrides PostalCode. Simple service to check the coordinates: https://www.latlong.net/
    Longitude: "", // Longitude. Overrides PostalCode. Simple service to check the coordinates: https://www.latlong.net/
    BackupHours: ["00", "01", "02", "03", "20", "21"],  // Backup hours if API is not answering or Internet connection is down.
    BoosterHours: "99,99", // During these hours relay is always ON. If you don't want this, use "99,99"
    PriorityHours: "99,99", // List here hours you want to prioritize. With PriceModifier: "0", these hours always get the smallest 'rank'
    PriceModifier: "-2,50", // Put here the difference in Euro cents if priority hours have lower price, like 'night electricity'
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "Bathroom floor",  // Whatever name for this relay. Used in debug logging mostly.
    Inverted: false, // If "true", relay logic is inverted
};

// ***********************************
// SETTINGS for RELAY 2 - change these
// ***********************************
let SETTINGS_2 =
{
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    Region: "FI", // See all supported regions from Swagger documentation: https://api.spot-hinta.fi/swagger/ui
    RankAtZeroDegrees: "5", // "Rank" (number of cheapest hours) when outdoor temperature is 0°C
    RankAdjusterPercentage: "15", // Percentage how much "Rank" is adjusted when outdoor temperature changes by one degree
    MinimumRank: "3", // Minimum 'Rank' when temperature goes above zero and Rank is getting smaller
    PriceAlwaysAllowed: "3", // "Allow always cheap prices". Price when relay is always ON.
    MaxPrice: "999", // This is the maximum allowed price in Euro cents.
    AllowedDays: "1,2,3,4,5,6,7", // Allowed days from Monday to Sunday. Modify only if you don't want everyday execution.
    PostalCode: "00100", // Postal code (Finland only!), which area temperature is used in calculations
    Latitude: "", // Latitude. Overrides PostalCode. Simple service to check the coordinates: https://www.latlong.net/
    Longitude: "", // Longitude. Overrides PostalCode. Simple service to check the coordinates: https://www.latlong.net/
    BackupHours: ["00", "01", "02", "03", "20", "21"],  // Backup hours if API is not answering or Internet connection is down.
    BoosterHours: "99,99", // During these hours relay is always ON. If you don't want this, use "99,99"
    PriorityHours: "99,99", // List here hours you want to prioritize. With PriceModifier: "0", these hours always get the smallest 'rank'
    PriceModifier: "-2,50", // Put here the difference in Euro cents if priority hours have lower price, like 'night electricity'
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "Big boiler",  // Whatever name for this relay. Used in debug logging mostly.
    Inverted: false, // If "true", relay logic is inverted
};

// ***********************************
// SETTINGS for RELAY 3 - change these
// ***********************************
let SETTINGS_3 =
{
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    Region: "FI", // See all supported regions from Swagger documentation: https://api.spot-hinta.fi/swagger/ui
    RankAtZeroDegrees: "5", // "Rank" (number of cheapest hours) when outdoor temperature is 0°C
    RankAdjusterPercentage: "15", // Percentage how much "Rank" is adjusted when outdoor temperature changes by one degree
    MinimumRank: "3", // Minimum 'Rank' when temperature goes above zero and Rank is getting smaller
    PriceAlwaysAllowed: "3", // "Allow always cheap prices". Price when relay is always ON.
    MaxPrice: "999", // This is the maximum allowed price in Euro cents.
    AllowedDays: "1,2,3,4,5,6,7", // Allowed days from Monday to Sunday. Modify only if you don't want everyday execution.
    PostalCode: "00100", // Postal code (Finland only!), which area temperature is used in calculations
    Latitude: "", // Latitude. Overrides PostalCode. Simple service to check the coordinates: https://www.latlong.net/
    Longitude: "", // Longitude. Overrides PostalCode. Simple service to check the coordinates: https://www.latlong.net/
    BackupHours: ["00", "01", "02", "03", "20", "21"],  // Backup hours if API is not answering or Internet connection is down.
    BoosterHours: "99,99", // During these hours relay is always ON. If you don't want this, use "99,99"
    PriorityHours: "99,99", // List here hours you want to prioritize. With PriceModifier: "0", these hours always get the smallest 'rank'
    PriceModifier: "-2,50", // Put here the difference in Euro cents if priority hours have lower price, like 'night electricity'
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "Livingroom",  // Whatever name for this relay. Used in debug logging mostly.
    Inverted: false, // If "true", relay logic is inverted
};


// **************************************
// MAIN SCRIPT - NO NEED TO TOUCH USUALLY
// **************************************

// Variables needed to control execution
let currentHour = "";
let Relay_1_Executed = false;
let Relay_2_Executed = false;
let Relay_3_Executed = false;

// Main timer, which calls the API to decide actions on relays
// Only one successful execution per hour per relay is done.
Timer.set(60000, true, function (ud) {

    // Calling the status to get the current time
    Shelly.call("Shelly.GetStatus", "", function (res) {

        // Check if hour has changed
        let hour = res.sys.time.slice(0, 2); // f.ex. "21:34"
        if (currentHour !== hour) {
            currentHour = hour;

            // Force relay "executed" if it is not in use
            if (SETTINGS_1.RelayIsInUse === true) { Relay_1_Executed = false } else { Relay_1_Executed = true; };
            if (SETTINGS_2.RelayIsInUse === true) { Relay_2_Executed = false } else { Relay_2_Executed = true; };
            if (SETTINGS_3.RelayIsInUse === true) { Relay_3_Executed = false } else { Relay_3_Executed = true; };
        }

        // Do not run anymore if execution has been successfull for all relays
        if (Relay_1_Executed === true && Relay_2_Executed === true && Relay_3_Executed === true) {
            print("Already executed this hour successfully.");
            return;
        }

        // First relay control is executed
        if (Relay_1_Executed === false) {

            let urlToCall = GetDynamicUrl(SETTINGS_1);
            print("URL to call (dynamic 1): " + urlToCall);

            Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_1.RelayName);
                let result = RunResponse(error_code, error_msg, res.code,
                    SETTINGS_1.Relay, SETTINGS_1.RelayName, SETTINGS_1.BackupHours, SETTINGS_1.Inverted);
                if (result === true) Relay_1_Executed = true;
            }, null);
        }

        // Second relay control is executed
        if (Relay_2_Executed === false) {

            let urlToCall = GetDynamicUrl(SETTINGS_2);
            print("URL to call (dynamic 2): " + urlToCall);

            Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_2.RelayName);
                let result = RunResponse(error_code, error_msg, res.code,
                    SETTINGS_2.Relay, SETTINGS_2.RelayName, SETTINGS_2.BackupHours, SETTINGS_2.Inverted);
                if (result === true) Relay_2_Executed = true;
            }, null);
        }

        // Third relay control is executed
        if (Relay_3_Executed === false) {

            let urlToCall = GetDynamicUrl(SETTINGS_3);
            print("URL to call (dynamic 3): " + urlToCall);

            Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_3.RelayName);
                let result = RunResponse(error_code, error_msg, res.code,
                    SETTINGS_3.Relay, SETTINGS_3.RelayName, SETTINGS_3.BackupHours, SETTINGS_3.Inverted);
                if (result === true) Relay_3_Executed = true;
            }, null);
        }
    }, null);
}, null);


// This controls the relay actions based on the result from the API call
function RunResponse(errorCode, errorMessage, responseCode, relay, relayName, backupHours, inverted) {
    // Network errors
    if (errorCode !== 0) {
        print("Network error occurred: " + errorMessage);
        print(errorCode);
        RunBackupHourRule(backupHours, relay, relayName, inverted);
        return false;
    }

    if (responseCode === 200) {
        if (inverted === true) {
            print("Relay '" + relayName + "' OFF (INVERTED)");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Relay OFF
            return true;
        } else {
            print("Relay '" + relayName + "' ON");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Relay ON
            return true;
        }
    }
    else if (responseCode === 400) {
        if (inverted === true) {
            print("Relay '" + relayName + "' ON (INVERTED)");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Relay ON
            return true;
        } else {
            print("Relay '" + relayName + "' OFF");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Relay OFF
            return true;
        }
    }
    else {
        print("Executing backup rule for relay: " + relayName);
        RunBackupHourRule(backupHours, relay, relayName, inverted);
        return false;
    };
}

// This is executed if API did not respond properly. This is NOT considered as successful execution
function RunBackupHourRule(backupHours, relay, relayName, inverted) {
    let currentHourIsListed = false;
    for (let i = 0; i < backupHours.length; i++) {
        if (backupHours[i] === currentHour) { currentHourIsListed = true; }
    }

    if (currentHourIsListed) {
        if (inverted === true) {
            print("Error situation. Turn relay '" + relayName + "' OFF during backup hours. (INVERTED)");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Error situation. Relay OFF.
        } else {
            print("Error situation. Turn relay '" + relayName + "' ON during backup hours.");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Error situation. Relay ON.
        }
    }
    else {
        if (inverted === true) {
            print("Error situation. Turn relay '" + relayName + "' ON outside backup hours. (INVERTED)");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Error situation. Relay ON.

        } else {
            print("Error situation. Turn relay '" + relayName + "' OFF outside backup hours");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Error situation. Relay OFF.
        }
    }
}

// Builds URL to call the API
function GetDynamicUrl(settingsNow) {
    let url = "https://api.spot-hinta.fi/JustNowRankDynamic";
    url += "?rankAtZeroDegrees=" + settingsNow.RankAtZeroDegrees;
    url += "&rankAdjusterPercentage=" + settingsNow.RankAdjusterPercentage;
    url += "&minimumRank=" + settingsNow.MinimumRank;
    url += "&priceAlwaysAllowed=" + settingsNow.PriceAlwaysAllowed;
    url += "&maxPrice=" + settingsNow.MaxPrice;
    url += "&allowedDays=" + settingsNow.AllowedDays;
    url += "&postalCode=" + settingsNow.PostalCode;
    url += "&latitude=" + settingsNow.Latitude;
    url += "&longitude=" + settingsNow.Longitude;
    url += "&boosterHours=" + settingsNow.BoosterHours;
    url += "&priorityHours=" + settingsNow.PriorityHours;
    url += "&priceModifier=" + settingsNow.PriceModifier;
    url += "&region=" + settingsNow.Region;
    return url;
}
