/* More information about the API (in Finnish): https://spot-hinta.fi/
* Support API development and maintenance: https://www.buymeacoffee.com/spothintafi
* 
* This script can control up to four different relays:
* 
* - Max two relays with spot price only. Use case example: oil boiler's heater coil
* - Max two relays with "rank" (number of cheapest hours) AND price limit. Use case example: water boiler */


// ***********************************************
// SETTINGS for Price Limit Relay 1
// ***********************************************
let SETTINGS_PRICELIMIT_1 =
{
    RelayIsInUse: false, // True/false: If you want to use this relay or not
    Region: "FI", // See all supported regions in Swagger documentation: https://api.spot-hinta.fi/swagger/ui
    PriceAllowed: "30", // Price limit (in euro cents, without decimals?). If price is now below less than this the relay is turned ON (or OFF if inverted - see below)
    AllowedDays: "1,2,3,4,5,6,7", // Execution days: 1=Monday to 7=Sunday, separated with comma. 
    Relay: "0",  // Shelly's relay number. Make sure this is correct!
    RelayName: "OilBoiler",  // Name this relay. Name is used in debug log mostly.
    Inverted: false, // True/false: Set to "true" to inverted the relay logic
};

// ***********************************************
// SETTINGS for Price Limit Relay 2
// ***********************************************
let SETTINGS_PRICELIMIT_2 =
{
    RelayIsInUse: false, 
    Region: "FI", 
    PriceAllowed: "20", 
    AllowedDays: "1,2,3,4,5,6,7", 
    Relay: "0",  
    RelayName: "Charger",  
    Inverted: false, 
};

// ********************************************************
// SETTINGS for Price AND Rank Limit Relay 1
// ********************************************************
let SETTINGS_RANK_PRICE_1 =
{
    RelayIsInUse: false, 
    Region: "FI", 
    Rank: "5", // "Rank" limit (number of cheapest hours today)
    PriceAllowed: "0", 
    MaxPrice: "999", // Maximum allowed price in euro cents.
    AllowedDays: "1,2,3,4,5,6,7", 
    BackupHours: ["00", "01", "02", "03", "20", "21"], // Backup hours; if API is not answering or internet connection is down.
    BoosterHours: "99,99", // Relay is always ON during booster hours. If you don't want this use "99,99"
    PriorityHours: "99,99", // Hours you want to prioritize. If PriceModifier: is "0" these hours always get the smallest 'rank'
    PriorityHoursRank: "3",  // How many priority hours are prioritized. i.e. "3" = 3 cheapest priority hours.
    PriceModifier: "-2,50", // If priority hours have lower price - such as 'night electricity' - the difference in Euro cents. 
    Relay: "0",  
    RelayName: "WaterHeater",  
    Inverted: false, 
};

// ********************************************************
// SETTINGS for Price AND Rank Limit Relay 2
// ********************************************************
let SETTINGS_RANK_PRICE_2 =
{
    RelayIsInUse: false, 
    Region: "FI", 
    Rank: "5", 
    PriceAllowed: "0", 
    MaxPrice: "999", 
    AllowedDays: "1,2,3,4,5,6,7", 
    BackupHours: ["00", "01", "02", "03", "20", "21"], 
    BoosterHours: "99,99", 
    PriorityHours: "99,99", 
    PriorityHoursRank: "3",  
    PriceModifier: "-2,50", 
    Relay: "0", 
    RelayName: "WaterHeater two", 
    Inverted: false, 
};


// **************************************
// MAIN SCRIPT - NO NEED TO MODIFY (USUALLY)
// **************************************

// Variables needed to control the execution
let currentHour = "";
let Relay_1_Executed = false; let rclosed1 = false;
let Relay_2_Executed = false; let rclosed2 = false;
let Relay_3_Executed = false; let rclosed3 = false;
let Relay_4_Executed = false; let rclosed4 = false;

// Main timer calls the API to decide what each relay does. Only one successful execution per hour per relay is done.
Timer.set(60000, true, function (ud) {

    // Get the current time
    Shelly.call("Shelly.GetStatus", "", function (res) {

        // Check if hour has changed
        let hour = res.sys.time.slice(0, 2); // f.ex. "21:34"
        if (currentHour !== hour) {
            currentHour = hour;

            // Skip relays which are not in use - set their "executed" state to true.
            if (SETTINGS_PRICELIMIT_1.RelayIsInUse === true) { Relay_1_Executed = false } else { Relay_1_Executed = true; };
            if (SETTINGS_PRICELIMIT_2.RelayIsInUse === true) { Relay_2_Executed = false } else { Relay_2_Executed = true; };
            if (SETTINGS_RANK_PRICE_1.RelayIsInUse === true) { Relay_3_Executed = false } else { Relay_3_Executed = true; };
            if (SETTINGS_RANK_PRICE_2.RelayIsInUse === true) { Relay_4_Executed = false } else { Relay_4_Executed = true; };
        }

        // Stop running if all relays have been executed succesfully
        if (Relay_1_Executed === true && Relay_2_Executed === true && Relay_3_Executed === true && Relay_4_Executed === true) {
            print("Current hour is already done successfully.");
            return;
        }

        // Execute first relay
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

        // Execute second relay
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

        // Excecute third relay
        if (Relay_3_Executed === false) {

            let urlToCall = BuildUrl(SETTINGS_RANK_PRICE_1);
            print("URL to call: " + urlToCall);

            Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_RANK_PRICE_1.RelayName);
                let result = RunResponse(error_code, error_msg, res.code, SETTINGS_RANK_PRICE_1.Relay, SETTINGS_RANK_PRICE_1.RelayName, SETTINGS_RANK_PRICE_1.BackupHours, SETTINGS_RANK_PRICE_1.Inverted, 3);
                if (result === true) Relay_3_Executed = true;
            }, null);
        }

        // Execute fourth relay
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

// Control the relays based on the result from the API call
function RunResponse(errorCode, errorMessage, responseCode, relay, relayName, backupHours, inverted, relayNumber) {

    // Check for network errors
    if (errorCode !== 0) {
        print("Network error occurred: " + errorMessage);
        print(errorCode);
        RunBackupHourRule(backupHours, relay, relayName, inverted);
        return false;
    }

    if (responseCode === 200) { /* HTTP response code 200 = OK */

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
