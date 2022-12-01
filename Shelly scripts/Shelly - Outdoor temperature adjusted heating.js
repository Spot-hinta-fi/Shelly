/* More information about the API's (in Finnish): https://spot-hinta.fi/
 * Support API development and maintenance: https://www.buymeacoffee.com/spothintafi
 * 
 * With this script, it is possible to control up to three relays according temporature adjusted 'rank' */


// ***********************************
// SETTINGS for RELAY 1 - change these
// ***********************************
let SETTINGS_1 =
{
    RelayIsInUse: true, // Change this to true/false depending if you want to use this relay or not
    RankAtZeroDegrees: "5", // "Rank" (number of cheapest hours) when outdoor temperature is 0°C
    RankAdjusterPercentage: "15", // Percentage how much "Rank" is adjusted when outdoor temperature changes by one degree
    MinimumRank: "3", // Minimum 'Rank' when temperature goes above zero and Rank is getting smaller
    PriceAlwaysAllowed: "3", // "Allow always cheap prices". Price when relay is always ON.
    PostalCode: "00100", // Postal code (Finnish), which area temperature is used in calculations
    BackupHours: ["00", "01", "02", "03", "20", "21"],  // Backup hours if API is not answering or Internet connection is down.
    BoosterHours: "20,23", // During these hours relay is always ON. 
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "Bathroom floor",  // Whatever name for this relay. Used in debug logging mostly.
};

// ***********************************
// SETTINGS for RELAY 2 - change these
// ***********************************
let SETTINGS_2 =
{
    RelayIsInUse: true, // Change this to true/false depending if you want to use this relay or not
    RankAtZeroDegrees: "5", // "Rank" (number of cheapest hours) when outdoor temperature is 0°C
    RankAdjusterPercentage: "15", // Percentage how much "Rank" is adjusted when outdoor temperature changes by one degree
    MinimumRank: "3", // Minimum 'Rank' when temperature goes above zero and Rank is getting smaller
    PriceAlwaysAllowed: "3", // "Allow always cheap prices". Price when relay is always ON.
    PostalCode: "00100", // Postal code (Finnish), which area temperature is used in calculations
    BackupHours: ["00", "01", "02", "03", "20", "21"],  // Backup hours if API is not answering or Internet connection is down.
    BoosterHours: "20,23", // During these hours relay is always ON. 
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "Big boiler",  // Whatever name for this relay. Used in debug logging mostly.
};

// ***********************************
// SETTINGS for RELAY 3 - change these
// ***********************************
let SETTINGS_3 =
{
    RelayIsInUse: true, // Change this to true/false depending if you want to use this relay or not
    RankAtZeroDegrees: "5", // "Rank" (number of cheapest hours) when outdoor temperature is 0°C
    RankAdjusterPercentage: "15", // Percentage how much "Rank" is adjusted when outdoor temperature changes by one degree
    MinimumRank: "3", // Minimum 'Rank' when temperature goes above zero and Rank is getting smaller
    PriceAlwaysAllowed: "3", // "Allow always cheap prices". Price when relay is always ON.
    PostalCode: "00100", // Postal code (Finnish), which area temperature is used in calculations
    BackupHours: ["00", "01", "02", "03", "20", "21"],  // Backup hours if API is not answering or Internet connection is down.
    BoosterHours: "20,23", // During these hours relay is always ON. 
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "Livingroom",  // Whatever name for this relay. Used in debug logging mostly.
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
        if (currentHour !== hour)
        {
            currentHour = hour;

            // Force relay "executed" if it is not in use
            if (SETTINGS_1.RelayIsInUse === true) { Relay_1_Executed = false } else { Relay_1_Executed = true; };
            if (SETTINGS_2.RelayIsInUse === true) { Relay_2_Executed = false } else { Relay_2_Executed = true; };
            if (SETTINGS_3.RelayIsInUse === true) { Relay_3_Executed = false } else { Relay_3_Executed = true; };
        }

        // Do not run anymore if execution has been successfull for all relays
        if (Relay_1_Executed === true && Relay_2_Executed === true && Relay_3_Executed === true)
        {
            print("Already executed this hour successfully.");
            return;
        }

        // First relay control is executed
        if (Relay_1_Executed === false)
        {
            Shelly.call("HTTP.GET", { url: GetDynamicUrl(SETTINGS_1) }, function (res, error_code, error_msg, ud)
            {
                print("Performing control for relay: " + SETTINGS_1.RelayName);
                let result = RunResponse(error_code, error_msg, res.code, SETTINGS_1.Relay, SETTINGS_1.RelayName, SETTINGS_1.BackupHours);
                if (result === true) Relay_1_Executed = true;
            }, null);
        }

        // Second relay control is executed
        if (Relay_2_Executed === false)
        {
            Shelly.call("HTTP.GET", { url: GetDynamicUrl(SETTINGS_2) }, function (res, error_code, error_msg, ud)
            {
                print("Performing control for relay: " + SETTINGS_2.RelayName);
                let result = RunResponse(error_code, error_msg, res.code, SETTINGS_2.Relay, SETTINGS_2.RelayName, SETTINGS_2.BackupHours);
                if (result === true) Relay_2_Executed = true;
            }, null);
        }

        // Third relay control is executed
        if (Relay_3_Executed === false) {
            Shelly.call("HTTP.GET", { url: GetDynamicUrl(SETTINGS_3) }, function (res, error_code, error_msg, ud) {
                print("Performing control for relay: " + SETTINGS_3.RelayName);
                let result = RunResponse(error_code, error_msg, res.code, SETTINGS_3.Relay, SETTINGS_3.RelayName, SETTINGS_3.BackupHours);
                if (result === true) Relay_3_Executed = true;
            }, null);
        }
    }, null);
}, null);


// This controls the relay actions based on the result from the API call
function RunResponse(errorCode, errorMessage, responseCode, relay, relayName, backupHours)
{
    // Network errors
    if (errorCode !== 0)
    {
        print("Network error occurred: " + errorMessage);
        print(errorCode);
        RunBackupHourRule(backupHours, relay, relayName);
        return false;
    }

    if (responseCode === 200)
    {
        print("Relay '" + relayName + "' ON");
        Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Relay ON
        return true;
    }
    else if (responseCode === 400)
    {
        print("Relay '" + relayName + "' OFF");
        Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Relay OFF
        return true;
    }
    else
    {
        print("Executing backup rule for relay: " + relayName);
        RunBackupHourRule(backupHours, relay, relayName);
        return false;
    };
}

// This is executed if API did not respond properly. This is NOT considered as successful execution
function RunBackupHourRule(backupHours, relay, relayName)
{
    let currentHourIsListed = false;
    for (let i = 0; i < backupHours.length; i++)
    {
        if (backupHours[i] === currentHour) { currentHourIsListed = true; }
    }

    if (currentHourIsListed)
    {
        print("Error situation. Turn relay '" + relayName + "' ON during backup hours.");
        Shelly.call("Switch.Set", "{ id:" + relay + ", on:true}", null, null); // Error situation. Relay ON.
    }
    else
    {
        print("Error situation. Turn relay '" + relayName + "' OFF outside backup hours");
        Shelly.call("Switch.Set", "{ id:" + relay + ", on:false}", null, null); // Error situation. Relay OFF.
    }
}

// Builds URL to call the API
function GetDynamicUrl(settingsNow)
{
    let url = "https://api.spot-hinta.fi/JustNowRankDynamic";
    url += "?rankAtZeroDegrees=" + settingsNow.RankAtZeroDegrees;
    url += "&rankAdjusterPercentage=" + settingsNow.RankAdjusterPercentage;
    url += "&minimumRank=" + settingsNow.MinimumRank;
    url += "&priceAlwaysAllowed=" + settingsNow.PriceAlwaysAllowed;
    url += "&postalCode=" + settingsNow.PostalCode;
    url += "&boosterHours=" + settingsNow.BoosterHours;
    return url;
}
