/* More information about the API's (in Finnish): https://spot-hinta.fi/
* Support API development and maintenance: https://www.buymeacoffee.com/spothintafi
* 
* With this script it is possible to control up to FOUR different relays:
* 
* - Max. two relays with spot price only. Use case example: oil boiler heater coil
* - Max. two relays with "rank" (number of cheapest hours) AND price limit. Use case example: water boilers */


// ***********************************************
// SETTINGS for Price Limit relay 1 - change these
// ***********************************************
let SETTINGS_PRICELIMIT_1 =
{
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    Region: "FI", // See all supported regions from Swagger documentation: https://api.spot-hinta.fi/swagger/ui
    PriceAllowed: "30", // Price limit. If price NOW is below this relay is turned ON (or OFF if inverted check)
    AllowedDays: "1,2,3,4,5,6,7", // Allowed days from Monday to Sunday. Modify only if you don't want everyday execution.
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "OilBoiler",  // Whatever name for this relay. Used in debug logging mostly.
    Inverted: false, // If "true", relay logic is inverted
};

// ***********************************************
// SETTINGS for Price Limit relay 2 - change these
// ***********************************************
let SETTINGS_PRICELIMIT_2 =
{
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    Region: "FI", // See all supported regions from Swagger documentation: https://api.spot-hinta.fi/swagger/ui
    PriceAllowed: "20", // Price limit. If price NOW is below this relay is turned ON (or OFF if inverted check)
    AllowedDays: "1,2,3,4,5,6,7", // Allowed days from Monday to Sunday. Modify only if you don't want everyday execution.
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "Charger",  // Whatever name for this relay. Used in debug logging mostly.
    Inverted: false, // If "true", relay logic is inverted
};

// ********************************************************
// SETTINGS for Price AND Rank limit relay 1 - change these
// ********************************************************
let SETTINGS_RANK_PRICE_1 =
{
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    Region: "FI", // See all supported regions from Swagger documentation: https://api.spot-hinta.fi/swagger/ui
    Rank: "5", // "Rank" limit (number of cheapest hours today)
    PriceAllowed: "0", // "Allow always cheap prices". Price when relay is always ON. Full Euro cents.
    MaxPrice: "999", // This is the maximum allowed price in Euro cents.
    AllowedDays: "1,2,3,4,5,6,7", // Allowed days from Monday to Sunday. Modify only if you don't want everyday execution.
    BackupHours: ["00", "01", "02", "03", "20", "21"],  // Backup hours if API is not answering or Internet connection is down.
    BoosterHours: "99,99", // During these hours relay is always ON. If you don't want this, use "99,99"
    PriorityHours: "99,99", // List here hours you want to prioritize. With PriceModifier: "0", these hours always get the smallest 'rank'
    PriorityHoursRank: "3",  // This limits how many hours are prioritized (i.e. 3 cheapest hours from priority hours)
    PriceModifier: "-2,50", // Put here the difference in Euro cents if priority hours have lower price, like 'night electricity'
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "WaterHeater",  // Whatever name for this relay. Used in debug logging mostly.
    Inverted: false, // If "true", relay logic is inverted
};

// ********************************************************
// SETTINGS for Price AND Rank limit relay 1 - change these
// ********************************************************
let SETTINGS_RANK_PRICE_2 =
{
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    Region: "FI", // See all supported regions from Swagger documentation: https://api.spot-hinta.fi/swagger/ui
    Rank: "5", // "Rank" limit (number of cheapest hours today)
    PriceAllowed: "0", // "Allow always cheap prices". Price when relay is always ON. Full Euro cents.
    MaxPrice: "999", // This is the maximum allowed price in Euro cents.
    AllowedDays: "1,2,3,4,5,6,7", // Allowed days from Monday to Sunday. Modify only if you don't want everyday execution.
    BackupHours: ["00", "01", "02", "03", "20", "21"],  // Backup hours if API is not answering or Internet connection is down.
    BoosterHours: "99,99", // During these hours relay is always ON. If you don't want this, use "99,99"
    PriorityHours: "99,99", // List here hours you want to prioritize. With PriceModifier: "0", these hours always get the smallest 'rank'
    PriorityHoursRank: "3",  // This limits how many hours are prioritized (i.e. 3 cheapest hours from priority hours)
    PriceModifier: "-2,50", // Put here the difference in Euro cents if priority hours have lower price, like 'night electricity'
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "WaterHeater two",  // Whatever name for this relay. Used in debug logging mostly.
    Inverted: false, // If "true", relay logic is inverted
};


// **************************************
// MAIN SCRIPT - NO NEED TO TOUCH USUALLY
// **************************************

// Variables needed to control execution
let currentHour = "";
let Relay_1_Executed = false; let rclosed1 = false;
let Relay_2_Executed = false; let rclosed2 = false;
let Relay_3_Executed = false; let rclosed3 = false;
let Relay_4_Executed = false; let rclosed4 = false;

// Main timer, which calls the API to decide actions on relays. Only one successful execution per hour per relay is done.
Timer.set(60000, true, function (ud) {

    // Calling the status to get the current time
    Shelly.call("Shelly.GetStatus", "", function (res) {

        // Check if hour has changed
        let hour = res.sys.time.slice(0, 2); // f.ex. "21:34"
        if (currentHour !== hour) {
            currentHour = hour;

            // Force relay "executed" if it is not in use
            if (SETTINGS_PRICELIMIT_1.RelayIsInUse === true) { Relay_1_Executed = false } else { Relay_1_Executed = true; };
            if (SETTINGS_PRICELIMIT_2.RelayIsInUse === true) { Relay_2_Executed = false } else { Relay_2_Executed = true; };
            if (SETTINGS_RANK_PRICE_1.RelayIsInUse === true) { Relay_3_Executed = false } else { Relay_3_Executed = true; };
            if (SETTINGS_RANK_PRICE_2.RelayIsInUse === true) { Relay_4_Executed = false } else { Relay_4_Executed = true; };
        }

        // Do not run anymore if execution has been successfull for all relays
        if (Relay_1_Executed === true && Relay_2_Executed === true && Relay_3_Executed === true && Relay_4_Executed === true) {
            print("Already executed this hour successfully.");
            return;
        }

        // First relay control is executed
        if (Relay_1_Executed === false) {

            let urlToCall = "https://api.spot-hinta.fi/JustNow/" + SETTINGS_PRICELIMIT_1.PriceAllowed +
                "?region=" + SETTINGS_PRICELIMIT_1.Region +
                "&allowedDays=" + SETTINGS_PRICELIMIT_1.AllowedDays;

            print("URL to call: " + urlToCall);

            Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_PRICELIMIT_1.RelayName);
                let result = RunResponse(error_code, error_msg, res.code,
                    SETTINGS_PRICELIMIT_1.Relay, SETTINGS_PRICELIMIT_1.RelayName, SETTINGS_PRICELIMIT_1.BackupHours, SETTINGS_PRICELIMIT_1.Inverted, 1);
                if (result === true) Relay_1_Executed = true;
            }, null);
        }

        // Second relay control is executed
        if (Relay_2_Executed === false) {

            let urlToCall = "https://api.spot-hinta.fi/JustNow/" + SETTINGS_PRICELIMIT_2.PriceAllowed +
                "?region=" + SETTINGS_PRICELIMIT_2.Region +
                "&allowedDays=" + SETTINGS_PRICELIMIT_2.AllowedDays;

            print("URL to call: " + urlToCall);

            Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_PRICELIMIT_2.RelayName);
                let result = RunResponse(error_code, error_msg, res.code,
                    SETTINGS_PRICELIMIT_2.Relay, SETTINGS_PRICELIMIT_2.RelayName, SETTINGS_PRICELIMIT_2.BackupHours, SETTINGS_PRICELIMIT_2.Inverted, 2);
                if (result === true) Relay_2_Executed = true;
            }, null);
        }

        // Third relay control is executed
        if (Relay_3_Executed === false) {

            let urlToCall = BuildUrl(SETTINGS_RANK_PRICE_1);
            print("URL to call: " + urlToCall);

            Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_RANK_PRICE_1.RelayName);
                let result = RunResponse(error_code, error_msg, res.code, SETTINGS_RANK_PRICE_1.Relay, SETTINGS_RANK_PRICE_1.RelayName, SETTINGS_RANK_PRICE_1.BackupHours, SETTINGS_RANK_PRICE_1.Inverted, 3);
                if (result === true) Relay_3_Executed = true;
            }, null);
        }

        // Fourth relay control is executed
        if (Relay_4_Executed === false) {

            let urlToCall = BuildUrl(SETTINGS_RANK_PRICE_2);
            print("URL to call: " + urlToCall);

            Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_RANK_PRICE_2.RelayName);
                let result = RunResponse(error_code, error_msg, res.code, SETTINGS_RANK_PRICE_2.Relay, SETTINGS_RANK_PRICE_2.RelayName, SETTINGS_RANK_PRICE_2.BackupHours, SETTINGS_RANK_PRICE_2.Inverted, 4);
                if (result === true) Relay_4_Executed = true;
            }, null);
        }
    }, null);
}, null);

// This controls the relay actions based on the result from the API call
function RunResponse(errorCode, errorMessage, responseCode, relay, relayName, backupHours, inverted, relayNumber) {

    // Network errors
    if (errorCode !== 0) {
        print("Network error occurred: " + errorMessage);
        print(errorCode);
        RunBackupHourRule(backupHours, relay, relayName, inverted);
        return false;
    }

    if (responseCode === 200) {

        SetRelayClosedStatus(relayNumber, false);

        if (inverted === true) {
            print("Relay '" + relayName + "' OFF (inverted)");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Relay OFF
            return true;
        } else {
            print("Relay '" + relayName + "' ON");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Relay ON
            return true;
        }
    }
    else if (responseCode === 400 && GetRelayClosedStatus(relayNumber) === false) {

        SetRelayClosedStatus(relayNumber, true);

        if (inverted === true) {
            print("Relay '" + relayName + "' ON (inverted)");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Relay ON
            return true;
        } else {
            print("Relay '" + relayName + "' OFF");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Relay OFF
            return true;
        }
    }
    else if (responseCode === 400 && GetRelayClosedStatus(relayNumber) === true) {
        if (inverted === true) {
            print("Relay '" + relayName + "' ON already (inverted)");
            return true;
        } else {
            print("Relay '" + relayName + "' OFF already");
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
            print("Error situation. Turn relay '" + relayName + "' OFF during backup hours (INVERTED)");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Error situation. Relay OFF.
        } else {
            print("Error situation. Turn relay '" + relayName + "' ON during backup hours.");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Error situation. Relay ON.
        }
    }
    else {
        if (inverted === true) {
            print("Error situation. Turn relay '" + relayName + "' ON outside backup hours (INVERTED)");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Error situation. Relay ON.
        } else {
            print("Error situation. Turn relay '" + relayName + "' OFF outside backup hours.");
            Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Error situation. Relay OFF.
        }
    }
}

// Helper function to set relay closed status
function SetRelayClosedStatus(relayNumber, status) {
    if (relayNumber === 1) { rclosed1 = status; }
    if (relayNumber === 2) { rclosed2 = status; }
    if (relayNumber === 3) { rclosed3 = status; }
    if (relayNumber === 4) { rclosed4 = status; }
}

// Helper function to get relay closed status
function GetRelayClosedStatus(relayNumber) {
    if (relayNumber === 1) { return rclosed1; }
    if (relayNumber === 2) { return rclosed2; }
    if (relayNumber === 3) { return rclosed3; }
    if (relayNumber === 4) { return rclosed4; }
    return false;
}

// Builds URL to call the API
function BuildUrl(settingsNow) {

    let url = "https://api.spot-hinta.fi/JustNowRank/" + settingsNow.Rank + "/" + settingsNow.PriceAllowed;
    url += "?maxPrice=" + settingsNow.MaxPrice;
    url += "&allowedDays=" + settingsNow.AllowedDays;
    url += "&boosterHours=" + settingsNow.BoosterHours;
    url += "&priorityHours=" + settingsNow.PriorityHours;
    url += "&priorityHoursRank=" + settingsNow.PriorityHoursRank;
    url += "&priceModifier=" + settingsNow.PriceModifier;
    url += "&region=" + settingsNow.Region;

    return url;
}
