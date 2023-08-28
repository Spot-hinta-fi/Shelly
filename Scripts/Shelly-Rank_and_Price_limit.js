// Spot-hinta.fi service is a privately funded service. If you want to support it, you can do it here:
// https://www.buymeacoffee.com/spothintafi  -- Thank you!

// This script can control two relays with 'ranks' and/or price limit
// NOTE! Shelly firmware must be updated to version 1.0.0 (or later) before using this script!

// Region to use. See supported regions in Swagger documentation: https://api.spot-hinta.fi/swagger/ui
let Region = "FI";

// First settings to control relay
let SETTINGS_1 =
{
    // Relay settings. Update these.
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    Relay: "0",  // Number of the relay within Shelly. First relay is always "0", next "1", etc.
    RelayName: "Waterboiler",  // Name for this relay which can be given freely. Used in debug logging mostly.

    // Settings for relay control logic. Update these.
    RanksAllowed: "1,2,3,4,5", // List allowed 'ranks' in this rule. 'Rank' tells how cheap the hour is relatively to other hours. Cheapest hour is 1, the most expensive is 24. Use RanksAllowed: "0", if only price limit is wanted.
    PriceAlwaysAllowed: "0", // Allowed price (in euro cents, without decimals). Use "average" for a daily average price. Use "-999" if not wanted.
    MaxPrice: "999", // Maximum allowed price in euro cents.
    AllowedDays: "1,2,3,4,5,6,7", // Allowed days from Monday to Sunday. Modify only if you don't want everyday execution.
    AllowedMonths: "1,2,3,4,5,6,7,8,9,10,11,12", // Execution months: 1=January to 12=December, separated with a comma. 
    BackupHours: [1, 2, 3, 21], // Backup hours; if API is not answering or internet connection is down. Use [99], if you don't want any backup hours.
    BoosterHours: "99", // Comma separated list of booster hours. Relay is always ON during booster hours. Use "99" to disable this.
    PriorityHours: "99", // Comma separated list of hours you want to prioritize. If 'PriceModifier' is "0" these hours always get the smallest 'rank'. Use "99" to disable this.
    PriorityHoursRank: "3",  // This limits how many hours are prioritized (for example 3 cheapest hours from the list of priority hours)
    PriceModifier: "0", // If priority hours have lower price - such as 'night electricity' - the difference in Euro cents. F.ex. "-2.50"
    Inverted: false, // If "true", relay logic is inverted

    // Script technical fields. Do not edit!
    SettingsNumber: 1,
    RelayStatus: true,
    RelayStatusSource: "",
    RelayExecuted: false,
};

// Second settings for the same or another relay
let SETTINGS_2 =
{
    // Relay settings. Update these.
    RelayIsInUse: false,
    Relay: "0",
    RelayName: "Floor heater",

    // Settings for relay control logic. Update these.
    RanksAllowed: "1,2,3,4,5", 
    PriceAlwaysAllowed: "0",
    MaxPrice: "999",
    AllowedDays: "1,2,3,4,5,6,7",
    AllowedMonths: "1,2,3,4,5,6,7,8,9,10,11,12",
    BackupHours: [1, 2, 3, 21],
    BoosterHours: "99,99",
    PriorityHours: "99,99",
    PriorityHoursRank: "3",
    PriceModifier: "0",
    Inverted: false,

    // Script technical fields. Do not edit!
    SettingsNumber: 2,
    RelayStatus: true,
    RelayStatusSource: "",
    RelayExecuted: false,
};

// --------------------------
// Script - no need to modify
// --------------------------

// Variables needed to control the execution
let currentHour = "";
let currentHourUpdated = "";
let rounds = 0;

// This is triggered by the timer (see end of the script)
function ExecuteRelayRules() {

    // Counter of exeutution rounds. First round means mostly.
    rounds = rounds + 1;

    // Reset relays if hour has changed
    InitializeRelaysIfHourHasChanged(rounds);

    // This was initialization round. Next round is the first actual processing round.
    if (rounds === 1) { print("Script initialization done."); return; }

    // Return if current hour is already done.
    if (HasCurrentHourBeenDone() === true) {
        return;
    }

    // Execute Relays which are in use and not executed yet.
    ExecuteRelayRule(SETTINGS_1);
    ExecuteRelayRule(SETTINGS_2);
}

// Executes HTTP GET query for a given settings
function ExecuteRelayRule(Settings) {

    // Do nothing if relay is not in use or it is already executed for this hour
    if (Settings.RelayIsInUse === false || Settings.RelayExecuted === true) { return; }

    // Get URL
    let urlToCall = BuildUrl(Settings);

    // HTTP Get Request to API
    print("Execute HTTP GET. Relay name: " + Settings.RelayName + " - URL: " + urlToCall);
    Shelly.call("HTTP.Request", { method: "GET", url: urlToCall, timeout: 10, ssl_ca: "*" }, ProcessHttpRequestResponse, Settings);
}

// Process response for HTTP GET
function ProcessHttpRequestResponse(response, error_code, error_msg, Settings) {

    // Process response and get status if processing was done successfully.
    let response = SetRelayStatusInShellyBasedOnHttpStatus(response, error_code, error_msg, Settings);

    // Update relay executed status
    if (Settings.SettingsNumber === 1) { SETTINGS_1.RelayExecuted = response; }
    if (Settings.SettingsNumber === 2) { SETTINGS_2.RelayExecuted = response; }
}

// Control the relays based on the result from the API call
function SetRelayStatusInShellyBasedOnHttpStatus(response, error_code, error_msg, Settings) {

    // Check for network errors
    if (error_code !== 0 || response === null) {
        print("Network error occurred: " + error_msg);
        RunBackupHourRule(Settings);
        return false;
    }

    if (response.code === 200) {
        SetRelayStatusInShelly(Settings, true, "api"); // Relay is turned on.
        return true;
    }
    else if (response.code === 400) {
        SetRelayStatusInShelly(Settings, false, "api"); // Relay is turned off.
        return true;
    }
    else {
        print("HTTP status code does not indicate success. HTTP status code: " + JSON.stringify(response.code));
        RunBackupHourRule(Settings);
        return false;
    }
}

// Change relay status in Shelly
function SetRelayStatusInShelly(Settings, newStatus, relayStatusSource) {

    // Set status messages
    let statusMessage = "";
    if (newStatus === true && Settings.Inverted === true) { statusMessage = "Turn relay off (inverted). Relay name: " + Settings.RelayName; }
    if (newStatus === false && Settings.Inverted === true) { statusMessage = "Turn relay on (inverted). Relay name: " + Settings.RelayName; }
    if (newStatus === true && Settings.Inverted === false) { statusMessage = "Turn relay on. Relay name: " + Settings.RelayName; }
    if (newStatus === false && Settings.Inverted === false) { statusMessage = "Turn relay off. Relay name: " + Settings.RelayName; }

    // Switch behavior based on Inverted-setting
    if (Settings.Inverted === true && newStatus === true) { newStatus = false; }
    else if (Settings.Inverted === true && newStatus === false) { newStatus = true; }

    // Don't close relay if it is already registered as closed AND source in last control is 'api'
    // When closing has been done by 'backupHour', relay can be closed again.
    if (Settings.RelayStatus === false && newStatus === false && Settings.RelayStatusSource === "api") {
        print("Relay is already closed. Not closing again (this allows possible other script to work with same relay)");
        return;
    }

    // Set relay in Shelly
    print(statusMessage);
    Shelly.call("Switch.Set", "{ id:" + Settings.Relay + ", on:" + JSON.stringify(newStatus) + "}", null, null);

    // Save status information into settings
    SetRelayStatusInSettings(Settings, newStatus, relayStatusSource);
}

// Set relay status for a given settings
function SetRelayStatusInSettings(Settings, newStatus, relayStatusSource) {
    if (Settings.SettingsNumber === 1) { SETTINGS_1.RelayStatus = newStatus; SETTINGS_1.RelayStatusSource = relayStatusSource; }
    if (Settings.SettingsNumber === 2) { SETTINGS_2.RelayStatus = newStatus; SETTINGS_2.RelayStatusSource = relayStatusSource; }
}

// This is executed if API did not respond properly. This is NOT considered as successful execution
function RunBackupHourRule(Settings) {

    // Check if settings has BackupHours property
    let hasBackupRules = false;
    for (let property in Settings) {
        if (property === "BackupHours") { hasBackupRules = true; }
    }

    // Return if not configured
    if (hasBackupRules === false) { print("This setting does not have BackupHours property. Relay name: " + Settings.RelayName); return; }

    // Check if current hour is listed in backup hours
    let currentHourIsListed = false;
    for (let i = 0; i < Settings.BackupHours.length; i++) {
        print("Backup hour: " + Settings.BackupHours[i]);
        if (Settings.BackupHours[i] === currentHour) { currentHourIsListed = true; }
    }

    // When current hour has not been updated for some reason, it might be better to consider this as backup hour
    // Comment this line, if you don't like the behavior.
    if (currentHour === null || currentHour === "") { currentHourIsListed = true; }

    // Set Shelly relay according if hour is backup hour. 
    print("Executing backup rule for relay: " + Settings.RelayName + " - Current hour: " + currentHour + " - Current hour is backup hour: " + JSON.stringify(currentHourIsListed));
    SetRelayStatusInShelly(Settings, currentHourIsListed, "backupHour");
}

// Initialize relay statuses if hour has changed
function InitializeRelaysIfHourHasChanged(rounds) {

    // Update current hour in a global variable.
    let date = new Date();
    currentHourUpdated = date.getHours();

    if (currentHour !== currentHourUpdated || rounds === 1) {
        
        // Update current hour
        currentHour = currentHourUpdated;

        // Skip relays which are not in use - set their "RelayExecuted" state to true.
        if (SETTINGS_1.RelayIsInUse === true) { SETTINGS_1.RelayExecuted = false } else { SETTINGS_1.RelayExecuted = true; };
        if (SETTINGS_2.RelayIsInUse === true) { SETTINGS_2.RelayExecuted = false } else { SETTINGS_2.RelayExecuted = true; };
    }
}

// Check if all relays are done for this hour.
function HasCurrentHourBeenDone() {

    if (SETTINGS_1.RelayExecuted === true && SETTINGS_2.RelayExecuted === true) {
        print("Current hour is already done.");
        return true;
    }

    return false;
}

// Builds URL to call the API
function BuildUrl(Settings) {

    let url = "https://api.spot-hinta.fi/JustNowRanksAndPrice";
        url += "?ranksAllowed=" + Settings.RanksAllowed;
        url += "&priceAlwaysAllowed=" + Settings.PriceAlwaysAllowed;
        url += "&maxPrice=" + Settings.MaxPrice;
        url += "&allowedDays=" + Settings.AllowedDays;
        url += "&allowedMonths=" + Settings.AllowedMonths;
        url += "&boosterHours=" + Settings.BoosterHours;
        url += "&priorityHours=" + Settings.PriorityHours;
        url += "&priorityHoursRank=" + Settings.PriorityHoursRank;
        url += "&priceModifier=" + Settings.PriceModifier;
        url += "&region=" + Region;
        return url;
}

// Main timer to execute rules
Timer.set(30000, true, ExecuteRelayRules);
