// More information about the API (in Finnish): https://spot-hinta.fi/
// Support Shelly script and Spot-hinta.fi API development and maintenance: https://www.buymeacoffee.com/spothintafi

// This script can control up to four different relays:
// - Max two relays with PRICE limit only
// - Max two relays with RANK (number of cheapest hours) AND PRICE limit

// Region to use. See supported regions in Swagger documentation: https://api.spot-hinta.fi/swagger/ui
let Region = "FI";

// Settings - Price limit - rule 1
let SETTINGS_PRICELIMIT_1 =
{
    // User settings
    RelayIsInUse: false, // True/false: If you want to use this relay or not
    PriceAllowed: "30", // Price limit (in euro cents, without decimals). Use "-99" if not wanted. If price is now less than this the relay is turned ON (or OFF if inverted - see below)
    AllowedDays: "1,2,3,4,5,6,7", // Execution days: 1=Monday to 7=Sunday, separated with comma. 
    Relay: "0",  // Shelly's relay number (Value is between 0-3 depending how many relays Shelly has). Make sure this is correct!
    RelayName: "OilBoiler",  // Name this relay. Name is used in debug log mostly.
    Inverted: false, // True/false: Set to "true" to inverted the relay logic

    // Script technical fields. Do not edit!
    Url: 1,
    SettingsNumber: 1,
    RelayStatus: true,
    RelayStatusSource: "",
    RelayExecuted: false,
};

// Settings - Price limit - rule 2
let SETTINGS_PRICELIMIT_2 =
{
    // User settings
    RelayIsInUse: false,
    PriceAllowed: "20",
    AllowedDays: "1,2,3,4,5,6,7",
    Relay: "0",
    RelayName: "Charger",
    Inverted: false,

    // Script technical fields. Do not edit!
    Url: 1,
    SettingsNumber: 2,
    RelayStatus: true,
    RelayStatusSource: "",
    RelayExecuted: false,
};

// Settings - Rank and price limit - rule 1
let SETTINGS_RANK_PRICE_1 =
{
    // User settings
    RelayIsInUse: false,
    Rank: "5", // "Rank" limit (number of cheapest hours today)
    PriceAllowed: "0",
    MaxPrice: "999", // Maximum allowed price in euro cents.
    AllowedDays: "1,2,3,4,5,6,7",
    BackupHours: ["00", "01", "02", "03", "20", "21"], // Backup hours; if API is not answering or internet connection is down.
    BoosterHours: "99,99", // Relay is always ON during booster hours. Use "99,99" to disable this.
    PriorityHours: "99,99", // Hours you want to prioritize. If PriceModifier: is "0" these hours always get the smallest 'rank'. Use "99,99" to disable this.
    PriorityHoursRank: "3",  // How many priority hours are prioritized. i.e. "3" = 3 cheapest priority hours.
    PriceModifier: "-2,50", // If priority hours have lower price - such as 'night electricity' - the difference in Euro cents. 
    Relay: "0",
    RelayName: "WaterHeater",
    Inverted: false,

    // Script technical fields. Do not edit!
    Url: 2,
    SettingsNumber: 3,
    RelayStatus: true,
    RelayStatusSource: "",
    RelayExecuted: false,
};

// Settings - Rank and price limit - rule 2
let SETTINGS_RANK_PRICE_2 =
{
    // User settings
    RelayIsInUse: false,
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

    // Script technical fields. Do not edit!
    Url: 2,
    SettingsNumber: 4,
    RelayStatus: true,
    RelayStatusSource: "",
    RelayExecuted: false,
};

// ------------------------------------
// Script - no need to modify (usually)
// ------------------------------------

// Variables needed to control the execution
let currentHour = "";
let currentHourUpdated = "";
let rounds = 0;

// This is triggered by the timer (see end of the script)
function ExecuteRelayRules() {

    // Counter of exeutution rounds. First round means mostly.
    rounds = rounds + 1;

    // Update current hour in a global variable.
    UpdateCurrentHour(rounds);

    // Reset relays if hour has changed
    InitializeRelaysIfHourHasChanged(rounds);

    // This was initialization round. Next round is the first actual processing round.
    if (rounds === 1) { print("Script initialization done."); return; }

    // Return if current hour is already done.
    if (HasCurrentHourBeenDone() === true) {
        return;
    }

    // Execute Relays which are in use and not executed yet.
    ExecuteRelayRule(SETTINGS_PRICELIMIT_1);
    ExecuteRelayRule(SETTINGS_PRICELIMIT_2);
    ExecuteRelayRule(SETTINGS_RANK_PRICE_1);
    ExecuteRelayRule(SETTINGS_RANK_PRICE_2);
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
    if (Settings.SettingsNumber === 1) { SETTINGS_PRICELIMIT_1.RelayExecuted = response; }
    if (Settings.SettingsNumber === 2) { SETTINGS_PRICELIMIT_2.RelayExecuted = response; }
    if (Settings.SettingsNumber === 3) { SETTINGS_RANK_PRICE_1.RelayExecuted = response; }
    if (Settings.SettingsNumber === 4) { SETTINGS_RANK_PRICE_2.RelayExecuted = response; }
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
        print("Relay is already closed. Not closing again (this allows possible other script to act)");
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

    if (Settings.SettingsNumber === 1) { SETTINGS_PRICELIMIT_1.RelayStatus = newStatus; SETTINGS_PRICELIMIT_1.RelayStatusSource = relayStatusSource; }
    if (Settings.SettingsNumber === 2) { SETTINGS_PRICELIMIT_2.RelayStatus = newStatus; SETTINGS_PRICELIMIT_2.RelayStatusSource = relayStatusSource; }
    if (Settings.SettingsNumber === 3) { SETTINGS_RANK_PRICE_1.RelayStatus = newStatus; SETTINGS_RANK_PRICE_1.RelayStatusSource = relayStatusSource; }
    if (Settings.SettingsNumber === 4) { SETTINGS_RANK_PRICE_2.RelayStatus = newStatus; SETTINGS_RANK_PRICE_2.RelayStatusSource = relayStatusSource; }
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

// Get the current hour and put it in global variable
function UpdateCurrentHour(rounds) {

    Shelly.call("Shelly.GetStatus", "", function (res, rounds) {
        if (res.sys.time !== null) {
            currentHourUpdated = res.sys.time.slice(0, 2);  // f.ex. "21:34"
            if (rounds === 1) { currentHour = currentHourUpdated; }
        }
        else {
            currentHourUpdated = ""; // Time is null if Shelly does not have connection to time server
        }
    }, rounds);
}

// Initialize relay statuses if hour has changed
function InitializeRelaysIfHourHasChanged(rounds) {

    if (currentHour !== currentHourUpdated || rounds === 1) {
        // Update current hour
        currentHour = currentHourUpdated;

        // Skip relays which are not in use - set their "RelayExecuted" state to true.
        if (SETTINGS_PRICELIMIT_1.RelayIsInUse === true) { SETTINGS_PRICELIMIT_1.RelayExecuted = false } else { SETTINGS_PRICELIMIT_1.RelayExecuted = true; };
        if (SETTINGS_PRICELIMIT_2.RelayIsInUse === true) { SETTINGS_PRICELIMIT_2.RelayExecuted = false } else { SETTINGS_PRICELIMIT_2.RelayExecuted = true; };
        if (SETTINGS_RANK_PRICE_1.RelayIsInUse === true) { SETTINGS_RANK_PRICE_1.RelayExecuted = false } else { SETTINGS_RANK_PRICE_1.RelayExecuted = true; };
        if (SETTINGS_RANK_PRICE_2.RelayIsInUse === true) { SETTINGS_RANK_PRICE_2.RelayExecuted = false } else { SETTINGS_RANK_PRICE_2.RelayExecuted = true; };
    }
}

// Check if all relays are done for this hour.
function HasCurrentHourBeenDone() {

    if (SETTINGS_PRICELIMIT_1.RelayExecuted === true &&
        SETTINGS_PRICELIMIT_2.RelayExecuted === true &&
        SETTINGS_RANK_PRICE_1.RelayExecuted === true &&
        SETTINGS_RANK_PRICE_2.RelayExecuted === true) {
        print("Current hour is already done.");
        return true;
    }

    return false;
}

// Builds URL to call the API
function BuildUrl(Settings) {

    // Price limit URL
    if (Settings.Url === 1) {
        return "https://api.spot-hinta.fi/JustNow/" + Settings.PriceAllowed + "?region=" + Region + "&allowedDays=" + Settings.AllowedDays;
    }

    // Price and Rank limit URL
    if (Settings.Url === 2) {
        let url = "https://api.spot-hinta.fi/JustNowRank/" + Settings.Rank + "/" + Settings.PriceAllowed;
        url += "?maxPrice=" + Settings.MaxPrice;
        url += "&allowedDays=" + Settings.AllowedDays;
        url += "&boosterHours=" + Settings.BoosterHours;
        url += "&priorityHours=" + Settings.PriorityHours;
        url += "&priorityHoursRank=" + Settings.PriorityHoursRank;
        url += "&priceModifier=" + Settings.PriceModifier;
        url += "&region=" + Region;
        return url;
    }

    return "";
}

// Main timer to execute rules
Timer.set(30000, true, ExecuteRelayRules);
