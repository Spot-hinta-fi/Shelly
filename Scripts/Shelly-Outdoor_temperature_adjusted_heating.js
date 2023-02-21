// More information about the API's (in Finnish): https://spot-hinta.fi/
// Support API development and maintenance: https://www.buymeacoffee.com/spothintafi

// With this script, it is possible to control up to three relays according weather forecase adjusted 'rank'
// If you want to test different parameters effect, go to Swagger tool and use "debug" parameter: https://api.spot-hinta.fi/swagger/ui

// Region to use. See supported regions in Swagger documentation: https://api.spot-hinta.fi/swagger/ui
let Region = "FI";

// Settings - Rule 1
let SETTINGS_1 =
{
    // User settings
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    RankAtZeroDegrees: "5", // "Rank" (number of cheapest hours) when outdoor temperature is 0°C
    RankAdjusterPercentage: "15", // Percentage how much "Rank" is adjusted when outdoor temperature changes by one degree
    MinimumRank: "3", // Minimum 'Rank' when temperature goes above zero and Rank is getting smaller
    PriceAlwaysAllowed: "3", // // Price limit (in full euro cents). If price is now below less than this the relay is turned ON (or OFF if inverted - see below)
    MaxPrice: "999", // Maximum allowed price in euro cents.
    AllowedDays: "1,2,3,4,5,6,7", // Allowed days from Monday to Sunday. Modify only if you don't want everyday execution.
    PostalCode: "00100", // Postal code (Finland only!), which area temperature is used in calculations
    Latitude: "", // Latitude. Overrides PostalCode. Simple service to check the coordinates: https://www.latlong.net/
    Longitude: "", // Longitude. Overrides PostalCode. Simple service to check the coordinates: https://www.latlong.net/
    BackupHours: ["00", "01", "02", "03", "20", "21"],  // Backup hours if API is not answering or Internet connection is down.
    BoosterHours: "99,99", // Relay is always ON during booster hours. If you don't want this use "99,99"
    PriorityHours: "99,99", // Hours you want to prioritize. If PriceModifier: is "0" these hours always get the smallest 'rank'
    PriorityHoursRank: "3",  // How many priority hours are prioritized. i.e. "3" = 3 cheapest priority hours.
    PriceModifier: "-2,50", // If priority hours have lower price - such as 'night electricity' - the difference in Euro cents. 
    Relay: "0",  // Number of the relay within Shelly. Make sure this is correct
    RelayName: "Bathroom floor",  // Whatever name for this relay. Used in debug logging mostly.
    Inverted: false, // If "true", relay logic is inverted

    // Script technical fields. Do not edit!!
    Url: 1,
    SettingsNumber: 1,
    RelayStatus: false,
    RelayStatusSource: "",
    RelayExecuted: false,
};

// Settings - rule 2
let SETTINGS_2 =
{
    // User settings
    RelayIsInUse: false,
    RankAtZeroDegrees: "5",
    RankAdjusterPercentage: "15",
    MinimumRank: "3",
    PriceAlwaysAllowed: "3",
    MaxPrice: "999",
    AllowedDays: "1,2,3,4,5,6,7",
    PostalCode: "00100",
    Latitude: "",
    Longitude: "",
    BackupHours: ["00", "01", "02", "03", "20", "21"],
    BoosterHours: "99,99",
    PriorityHours: "99,99",
    PriorityHoursRank: "3",
    PriceModifier: "-2,50",
    Relay: "0",
    RelayName: "Big boiler",
    Inverted: false,

    // Script technical fields. Do not edit!
    Url: 1,
    SettingsNumber: 2,
    RelayStatus: false,
    RelayStatusSource: "",
    RelayExecuted: false,
};

// Settings - rule 3
let SETTINGS_3 =
{
    // User settings
    RelayIsInUse: false,
    RankAtZeroDegrees: "5",
    RankAdjusterPercentage: "15",
    MinimumRank: "3",
    PriceAlwaysAllowed: "3",
    MaxPrice: "999",
    AllowedDays: "1,2,3,4,5,6,7",
    PostalCode: "00100",
    Latitude: "",
    Longitude: "",
    BackupHours: ["00", "01", "02", "03", "20", "21"],
    BoosterHours: "99,99",
    PriorityHours: "99,99",
    PriorityHoursRank: "3",
    PriceModifier: "-2,50",
    Relay: "0",
    RelayName: "Livingroom",
    Inverted: false,

    // Script technical fields. Do not edit!
    Url: 1,
    SettingsNumber: 3,
    RelayStatus: false,
    RelayStatusSource: "",
    RelayExecuted: false,
};


// ------------------------------------
// Script - no need to modify (usually)
// ------------------------------------

// Variables needed to control execution
let currentHour = ""; let currentHourUpdated = ""; let firstRound = true;

// This is triggered by the timer (see end of the script)
function ExecuteRelayRules() {

    // Update current hour in a global variable.
    UpdateCurrentHour();

    // Reset relays if hour has changed
    InitializeRelaysIfHourHasChanged();

    // Return if current hour is already done.
    if (HasCurrentHourBeenDone() === true) {
        return;
    }

    // Execute Relays which are in use and not executed yet.
    ExecuteRelayRule(SETTINGS_1);
    ExecuteRelayRule(SETTINGS_2);
    ExecuteRelayRule(SETTINGS_3);
}

// Executes HTTP GET query for a given settings
function ExecuteRelayRule(Settings) {

    // Do nothing if relay is not in use or it is already executed for this hour
    if (Settings.RelayIsInUse === false || Settings.RelayExecuted === true) { return; }

    // Get URL
    let urlToCall = BuildUrl(Settings);

    // HTTP Get Request to API
    print("Execute HTTP GET. Relay name: " + Settings.RelayName + " - URL: " + urlToCall);
    Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, ProcessHttpRequestResponse, Settings);
}

// Process response for HTTP GET
function ProcessHttpRequestResponse(response, error_code, error_msg, Settings) {

    // Process response and get status if processing was done successfully.
    let response = SetRelayStatusInShellyBasedOnHttpStatus(response, error_code, error_msg, Settings);

    // Update relay executed status
    if (Settings.SettingsNumber === 1) { SETTINGS_1.RelayExecuted = response; }
    if (Settings.SettingsNumber === 2) { SETTINGS_2.RelayExecuted = response; }
    if (Settings.SettingsNumber === 3) { SETTINGS_3.RelayExecuted = response; }
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
    };
}

// Change relay status in Shelly
function SetRelayStatusInShelly(Settings, newStatus, relayStatusSource) {

    // Set status messages
    let statusMessage = "";
    if (newStatus === true && Settings.Inverted === true) { statusMessage = "Turn relay off (inverted). Relay name: " + Settings.RelayName; }
    if (newStatus === false && Settings.Inverted === true) { statusMessage = "Turn relay on (inverted). Relay name: " + Settings.RelayName; }
    if (newStatus === true && Settings.Inverted === false) { statusMessage = "Turn relay on. Relay name: " + Settings.RelayName; }
    if (newStatus === false && Settings.Inverted === false) { statusMessage = "Turn relay off. Relay name: " + Settings.RelayName; }

    // Switch status based on Inverted-setting
    if (Settings.Inverted === true && newStatus === true) { newStatus = false; }
    else if (Settings.Inverted === true && newStatus === false) { newStatus = true; }

    // Don't close relay if it is already registered as closed AND source in last control is 'api'
    // When closing has been done by 'backupHour', relay can be closed again.
    if (Settings.RelayStatus === false && newStatus === false && Settings.RelayStatusSource === "api") {
        print("Relay is already closed. Not closing again (this allows possible other script to act)");
        return;
    }

    // Set relay in Shelly
    print(statusMessage);
    Shelly.call("Switch.Set", "{ id:" + Settings.Relay + ", on:" + JSON.stringify(newStatus) + "}", null, null);

    // Save status information into settings
    SetRelayStatusInSettings(Settings, newStatus, relayStatusSource);
}

// Set relay closed status for a given settings
function SetRelayStatusInSettings(Settings, newStatus, relayStatusSource) {

    if (Settings.SettingsNumber === 1) { SETTINGS_1.RelayStatus = newStatus; SETTINGS_1.RelayStatusSource = relayStatusSource; }
    if (Settings.SettingsNumber === 2) { SETTINGS_2.RelayStatus = newStatus; SETTINGS_2.RelayStatusSource = relayStatusSource; }
    if (Settings.SettingsNumber === 3) { SETTINGS_3.RelayStatus = newStatus; SETTINGS_3.RelayStatusSource = relayStatusSource; }
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
        if (Settings.BackupHours[i] === currentHour) { currentHourIsListed = true; }
    }

    // When current hour has not been updated for some reason, it might be better to consider this as backup hour
    // Comment this line, if you don't like the behavior.
    if (currentHour === null || currentHour === "") { currentHourIsListed = true; }

    // Set Shelly relay according if hour is backup hour. 
    print("Executing backup rule for relay: " + Settings.RelayName + " - Current hour: " + currentHour + " - Current hour is backup hour: " + JSON.stringify(currentHourIsListed));
    SetRelayStatusInShelly(Settings, currentHourIsListed, "backupHour");
}

// Builds URL to call the API
function BuildUrl(Settings) {

    let url = "https://api.spot-hinta.fi/JustNowRankDynamic";
    url += "?rankAtZeroDegrees=" + Settings.RankAtZeroDegrees;
    url += "&rankAdjusterPercentage=" + Settings.RankAdjusterPercentage;
    url += "&minimumRank=" + Settings.MinimumRank;
    url += "&priceAlwaysAllowed=" + Settings.PriceAlwaysAllowed;
    url += "&maxPrice=" + Settings.MaxPrice;
    url += "&allowedDays=" + Settings.AllowedDays;
    url += "&postalCode=" + Settings.PostalCode;
    url += "&latitude=" + Settings.Latitude;
    url += "&longitude=" + Settings.Longitude;
    url += "&boosterHours=" + Settings.BoosterHours;
    url += "&priorityHours=" + Settings.PriorityHours;
    url += "&priorityHoursRank=" + Settings.PriorityHoursRank;
    url += "&priceModifier=" + Settings.PriceModifier;
    url += "&region=" + Region;
    return url;
}

// Initialize relay statuses if hour has changed
function InitializeRelaysIfHourHasChanged() {

    if (currentHour !== currentHourUpdated || firstRound === true) {
        currentHour = currentHourUpdated;
        firstRound = false;
        // Skip relays which are not in use - set their "executed" state to true.
        if (SETTINGS_1.RelayIsInUse === true) { SETTINGS_1.RelayExecuted = false } else { SETTINGS_1.RelayExecuted = true; };
        if (SETTINGS_2.RelayIsInUse === true) { SETTINGS_2.RelayExecuted = false } else { SETTINGS_2.RelayExecuted = true; };
        if (SETTINGS_3.RelayIsInUse === true) { SETTINGS_3.RelayExecuted = false } else { SETTINGS_3.RelayExecuted = true; };
        return true;
    }

    return false;
}

// Check if all relays are done for this hour.
function HasCurrentHourBeenDone() {

    if (SETTINGS_1.RelayExecuted === true &&
        SETTINGS_2.RelayExecuted === true &&
        SETTINGS_3.RelayExecuted === true) {
        print("Current hour is already done.");
        return true;
    }

    return false;
}

// Get the current hour and put it in global variable
function UpdateCurrentHour() {

    Shelly.call("Shelly.GetStatus", "", function (res) {
        if (res.sys.time !== null) {
            currentHourUpdated = res.sys.time.slice(0, 2);  // f.ex. "21:34"
            if (firstRound === true) { currentHour = currentHourUpdated; }
        }
        else {
            currentHourUpdated = ""; // Time is null if Shelly does not have connection to time server
        }
    });

    return true;
}

// Main timer to execute rules
let rounds = 0;
Timer.set(60000, true, function () {
    rounds = rounds + 1;
    print("Starting new execution round... round number: " + JSON.stringify(rounds));
    ExecuteRelayRules();
});
