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
    PriceAllowed: "30", // Price limit. If price NOW is below this, relay is turned ON
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "OilBoiler",  // Whatever name for this relay. Used in debug logging mostly.
};

// ***********************************************
// SETTINGS for Price Limit relay 2 - change these
// ***********************************************
let SETTINGS_PRICELIMIT_2 =
{
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    PriceAllowed: "20", // Price limit. If price NOW is below this, relay is turned ON
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "Charger",  // Whatever name for this relay. Used in debug logging mostly.
};

// ********************************************************
// SETTINGS for Price AND Rank limit relay 1 - change these
// ********************************************************
let SETTINGS_RANK_PRICE_1 =
{
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    Rank: "5", // "Rank" limit (number of cheapest hours today)
    PriceAllowed: "5", // "Allow always cheap prices". Price when relay is always ON.
    BackupHours: ["00", "01", "02", "03", "20", "21"],  // Backup hours if API is not answering or Internet connection is down.
    BoosterHours: "20,21", // During these hours relay is always ON. If you don't want this, use "99,99"
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "WaterHeater",  // Whatever name for this relay. Used in debug logging mostly.
};

// ********************************************************
// SETTINGS for Price AND Rank limit relay 1 - change these
// ********************************************************
let SETTINGS_RANK_PRICE_2 =
{
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    Rank: "5", // "Rank" limit (number of cheapest hours today)
    PriceAllowed: "5", // "Allow always cheap prices". Price when relay is always ON.
    BackupHours: ["00", "01", "02", "03", "20", "21"],  // Backup hours if API is not answering or Internet connection is down.
    BoosterHours: "20,21", // During these hours relay is always ON. If you don't want this, use "99,99"
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "WaterHeater too",  // Whatever name for this relay. Used in debug logging mostly.
};


// **************************************
// MAIN SCRIPT - NO NEED TO TOUCH USUALLY
// **************************************

// Variables needed to control execution
let currentHour = "";
let Relay_1_Executed = false;
let Relay_2_Executed = false;
let Relay_3_Executed = false;
let Relay_4_Executed = false;


// Main timer, which calls the API to decide actions on relays. Only one successful execution per hour per relay is done.
Timer.set(50000, true, function (ud) {

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

            let urlToCall = "https://api.spot-hinta.fi/JustNow/" + SETTINGS_PRICELIMIT_1.PriceAllowed;

            Shelly.call("HTTP.GET", { url: urlToCall }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_PRICELIMIT_1.RelayName);
                let result = RunResponse(error_code, error_msg, res.code, SETTINGS_PRICELIMIT_1.Relay, SETTINGS_PRICELIMIT_1.RelayName, SETTINGS_PRICELIMIT_1.BackupHours);
                if (result === true) Relay_1_Executed = true;
            }, null);
        }

        // Second relay control is executed
        if (Relay_2_Executed === false) {

            let urlToCall = "https://api.spot-hinta.fi/JustNow/" + SETTINGS_PRICELIMIT_2.PriceAllowed;

            Shelly.call("HTTP.GET", { url: urlToCall }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_PRICELIMIT_2.RelayName);
                let result = RunResponse(error_code, error_msg, res.code, SETTINGS_PRICELIMIT_2.Relay, SETTINGS_PRICELIMIT_2.RelayName, SETTINGS_PRICELIMIT_2.BackupHours);
                if (result === true) Relay_2_Executed = true;
            }, null);
        }

        // Third relay control is executed
        if (Relay_3_Executed === false) {

            let urlToCall = "https://api.spot-hinta.fi/JustNowRank/";
            urlToCall += SETTINGS_RANK_PRICE_1.Rank + "/" + SETTINGS_RANK_PRICE_1.PriceAllowed + "?BoosterHours=" + SETTINGS_RANK_PRICE_1.BoosterHours;

            Shelly.call("HTTP.GET", { url: urlToCall }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_RANK_PRICE_1.RelayName);
                let result = RunResponse(error_code, error_msg, res.code, SETTINGS_RANK_PRICE_1.Relay, SETTINGS_RANK_PRICE_1.RelayName, SETTINGS_RANK_PRICE_1.BackupHours);
                if (result === true) Relay_3_Executed = true;
            }, null);
        }

        // Fourth relay control is executed
        if (Relay_4_Executed === false) {

            let urlToCall = "https://api.spot-hinta.fi/JustNowRank/";
            urlToCall += SETTINGS_RANK_PRICE_2.Rank + "/" + SETTINGS_RANK_PRICE_2.PriceAllowed + "?BoosterHours=" + SETTINGS_RANK_PRICE_2.BoosterHours;

            Shelly.call("HTTP.GET", { url: urlToCall }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_RANK_PRICE_2.RelayName);
                let result = RunResponse(error_code, error_msg, res.code, SETTINGS_RANK_PRICE_2.Relay, SETTINGS_RANK_PRICE_2.RelayName, SETTINGS_RANK_PRICE_2.BackupHours);
                if (result === true) Relay_4_Executed = true;
            }, null);
        }

    }, null);
}, null);


// This controls the relay actions based on the result from the API call
function RunResponse(errorCode, errorMessage, responseCode, relay, relayName, backupHours) {
    // Network errors
    if (errorCode !== 0) {
        print("Network error occurred: " + errorMessage);
        print(errorCode);
        RunBackupHourRule(backupHours, relay, relayName);
        return false;
    }

    if (responseCode === 200) {
        print("Relay '" + relayName + "' ON");
        Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Relay ON
        return true;
    }
    else if (responseCode === 400) {
        print("Relay '" + relayName + "' OFF");
        Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Relay OFF
        return true;
    }
    else {
        print("Executing backup rule for relay: " + relayName);
        RunBackupHourRule(backupHours, relay, relayName);
        return false;
    };
}

// This is executed if API did not respond properly. This is NOT considered as successful execution
function RunBackupHourRule(backupHours, relay, relayName) {

    let currentHourIsListed = false;
    for (let i = 0; i < backupHours.length; i++) {
        if (backupHours[i] === currentHour) { currentHourIsListed = true; }
    }

    if (currentHourIsListed) {
        print("Error situation. Turn relay '" + relayName + "' ON during backup hours.");
        Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Error situation. Relay ON.
    }
    else {
        print("Error situation. Turn relay '" + relayName + "' OFF outside backup hours");
        Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Error situation. Relay OFF.
    }
}
