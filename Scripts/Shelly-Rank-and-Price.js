// You can support spot-hinta.fi service here: https://www.buymeacoffee.com/spothintafi
// Supported Shelly firmwares: 1.0.3, 1.0.7

// Region to use
let Region = "FI"; // Supported regions: DK1, DK2, EE, FI, LT, LV, NO1, NO2, NO3, NO4, NO5, SE1, SE2, SE3, SE4

// First settings to control relay
let SETTINGS_1 =
{
    // Relay settings. Update these.
    RelayIsInUse: false, // Change this to true/false depending if you want to use this relay or not
    Relay: "0", // Number of the relay within Shelly. First relay is always "0", next "1", etc.
    RelayName: "Waterboiler",  // Name for this relay which can be given freely. Used in debug logging mostly.

    // Settings for relay control logic. Update these.
    RanksAllowed: "1,2,3,4,5", // List allowed 'ranks' in this rule. 'Rank' tells how cheap the hour is relatively to other hours. Cheapest hour is 1, the most expensive is 24. Use RanksAllowed: "0", if only price limit is wanted.
    PriceAlwaysAllowed: "0", // Allowed price (in euro cents, without decimals). Use "average" for a daily average price. Use "-999" if not wanted.
    MaxPrice: "999", // Maximum allowed price in euro cents.
    AllowedDays: "1,2,3,4,5,6,7", // Allowed days from 1=Monday to 7=Sunday. Modify only if you don't want everyday execution.
    AllowedMonths: "1,2,3,4,5,6,7,8,9,10,11,12", // Execution months: 1=January to 12=December, separated with a comma. 
    BackupHours: [1, 2, 3, 21], // Backup hours (0...23). If Internet connection is down. Use [99], if you don't want any backup hours.
    BoosterHours: "99", // Comma separated list of booster hours (0...23). Relay is always ON during booster hours. Use "99" to disable this.
    PriorityHours: "99", // Comma separated list of hours (0...23) you want to prioritize. If 'PriceModifier' is "0" these hours always get the smallest 'rank'. Use "99" to disable this.
    PriorityHoursRank: "3",  // This limits how many hours are prioritized (for example 3 cheapest hours from the list of priority hours)
    PriceModifier: "0", // If priority hours have lower price - such as 'night electricity' - the difference in Euro cents. F.ex. "-2.50"
    Inverted: false, // If "true", relay logic is inverted

    // Script technical fields. Do not edit!
    SettingsNumber: 1, RelayStatus: true, RelayStatusSource: "", RelayExecuted: false, Url: ""
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
    SettingsNumber: 2, RelayStatus: true, RelayStatusSource: "", RelayExecuted: false, Url: ""
};

// Script starts here - Do not edit anything below
// Variables needed to control the execution
print("Rank and Price script is starting...");
let currentHour = -1; let roundRobin = 0;

Timer.set(20000, true, function () {

    if (currentHour !== new Date().getHours()) {
        currentHour = new Date().getHours();
        if (SETTINGS_1.RelayIsInUse === true) { SETTINGS_1.RelayExecuted = false } else { SETTINGS_1.RelayExecuted = true; };
        if (SETTINGS_2.RelayIsInUse === true) { SETTINGS_2.RelayExecuted = false } else { SETTINGS_2.RelayExecuted = true; };
    }
    if (SETTINGS_1.RelayExecuted === true && SETTINGS_2.RelayExecuted === true) { print("Current hour is already done."); return; }
    if (roundRobin === 0) { ExecuteRelayRule(SETTINGS_1); roundRobin = 1; return; }
    if (roundRobin === 1) { ExecuteRelayRule(SETTINGS_2); roundRobin = 0; return; }
});

function ExecuteRelayRule(Settings) {
    if (Settings.RelayIsInUse === false || Settings.RelayExecuted === true) { return; }
    print("Execute HTTP GET. Relay name: " + Settings.RelayName + " - URL: " + Settings.Url);
    Shelly.call("HTTP.Request", { method: "GET", url: Settings.Url, timeout: 10, ssl_ca: "*" }, ProcessHttpRequestResponse, Settings);
}

function ProcessHttpRequestResponse(response, error_code, error_msg, Settings) {
    let relayExecuted = SetRelayStatusInShellyBasedOnHttpStatus(response, error_code, error_msg, Settings);
    if (Settings.SettingsNumber === 1) { SETTINGS_1.RelayExecuted = relayExecuted; }
    if (Settings.SettingsNumber === 2) { SETTINGS_2.RelayExecuted = relayExecuted; }
}

function SetRelayStatusInShellyBasedOnHttpStatus(response, error_code, error_msg, Settings) {
    if (error_code === 0 && response !== null) {
        if (response.code === 200) { SetRelayStatusInShelly(Settings, true, "api"); return true; }
        if (response.code === 400) { SetRelayStatusInShelly(Settings, false, "api"); return true; }
    }

    print("HTTP status code does not indicate success. Error_code: " + JSON.stringify(error_code));
    if (Settings.BackupHours.indexOf(cHour) > -1) {
        print("Executing backup rule for relay: " + Settings.RelayName + " - Current hour is a backup hour");
        SetRelayStatusInShelly(Settings, true, "backupHour");
    } else {
        print("Current hour is not a backup hour. Relay name: " + Settings.RelayName);
        SetRelayStatusInShelly(Settings, false, "backupHour");
    }

    return false;
}

function SetRelayStatusInShelly(Settings, newStatus, relayStatusSource) {
    if (Settings.Inverted === true && newStatus === true) { newStatus = false; }
    else if (Settings.Inverted === true && newStatus === false) { newStatus = true; }

    // Don't close relay if it is already registered as closed AND source in last control is 'api'
    if (Settings.RelayStatus === false && newStatus === false && Settings.RelayStatusSource === "api") {
        print("Relay is already closed. Not closing again."); return;
    }

    // Set relay in Shelly
    print("Changing relay status. Id: " + Settings.Relay + " -- New relay status: " + newStatus);
    Shelly.call("Switch.Set", "{ id:" + Settings.Relay + ", on:" + JSON.stringify(newStatus) + "}", null, null);

    // Save status information into settings
    if (Settings.SettingsNumber === 1) { SETTINGS_1.RelayStatus = newStatus; SETTINGS_1.RelayStatusSource = relayStatusSource; }
    if (Settings.SettingsNumber === 2) { SETTINGS_2.RelayStatus = newStatus; SETTINGS_2.RelayStatusSource = relayStatusSource; }
}

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
SETTINGS_1.Url = BuildUrl(SETTINGS_1);
SETTINGS_2.Url = BuildUrl(SETTINGS_2);