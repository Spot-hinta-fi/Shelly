// Thank you for your support: https://www.buymeacoffee.com/spothintafi
// Supported Shelly firmwares: 1.0.3 - 1.4.4. Script version: 2024-11-02

// Region to use
let Region = "FI"; // Supported regions: DK1, DK2, EE, FI, LT, LV, NO1, NO2, NO3, NO4, NO5, SE1, SE2, SE3, SE4

// First settings to control relay
let SETTINGS_1 =
{
    // Relay settings
    RelayIsInUse: false, // To activate this rule, change this to: true
    Relays: [0], // Relays to control with this rule. List relays as comma separated. For example: [0,1,2]
    RelayName: "Waterboiler",  // Name for this relay/rule
    Inverted: false, // If "true", relay logic is inverted

    // Conditions when heating should happen
    RanksAllowed: "1,2,3,4,5", // List allowed 'ranks' in this rule. Cheapest hour is 1, the most expensive is 24. Use RanksAllowed: "0", if only price limit is wanted.
    PriceAlwaysAllowed: "0", // Allowed price (in euro cents, without decimals). Use "average" for a daily average price. Use "-999" if not wanted.
    MaxPrice: "999", // Maximum allowed price in euro cents.
    BackupHours: [1, 2, 3, 21], // Backup hours (0...23). If Internet connection is down. Use [99], if you don't want any backup hours.
    BoosterHours: "99", // Comma separated list of booster hours (0...23). Relay is always ON during booster hours. Use "99" to disable this.

    // When is this rule active?
    AllowedDays: "1,2,3,4,5,6,7", // 1 = Monday and 7 = Sunday. Modify only if you don't want everyday execution.
    AllowedMonths: "1,2,3,4,5,6,7,8,9,10,11,12", // Execution months: 1=January to 12=December, separated with a comma.

    // PriorityHours have two alternative use cases:
    // A) Number of cheapest PriorityHours ("PriorityHoursRank") are given the lowest rank
    // B) Priorityhours price is modified before Rank calculation (this does not guarantee lowest ranks)
    PriorityHours: "99", // Comma separated list of hours (0...23) you want to prioritize. Use "99" to disable this.
    PriorityHoursRank: "3", // How many PriorityHours are given the lowest rank?
    PriceModifier: "0", // If PriorityHours have a lower price, you can compensate that with this parameter. F.ex. "-1.27" (euro cents)

    // Script technical fields. Do not edit!
    SettingsNumber: 1, RelayStatus: true, InvertedOn: true, InvertedOff: false, RelayExecuted: false, Url: "", IsFirstRound: true
};

// Second settings to control relay
let SETTINGS_2 =
{
    // Relay settings
    RelayIsInUse: false,
    Relays: [1],
    RelayName: "Floor heater",
    Inverted: false,

    // Conditions when heating should happen
    RanksAllowed: "1,2,3,4,5",
    PriceAlwaysAllowed: "0",
    MaxPrice: "999",
    BackupHours: [1, 2, 3, 21],
    BoosterHours: "99,99",

    // When is this rule active?
    AllowedDays: "1,2,3,4,5,6,7",
    AllowedMonths: "1,2,3,4,5,6,7,8,9,10,11,12",

    // PriorityHours have two alternative use cases:
    // A) Number of cheapest PriorityHours ("PriorityHoursRank") are given the lowest rank
    // B) Priorityhours price is modified before Rank calculation (this does not guarantee lowest ranks)
    PriorityHours: "99,99",
    PriorityHoursRank: "3",
    PriceModifier: "0",

    // Script technical fields. Do not edit!
    SettingsNumber: 2, RelayStatus: true, InvertedOn: true, InvertedOff: false, RelayExecuted: false, Url: "", IsFirstRound: true
};

// Script starts here - Do not edit anything below
print("Rank-and-Price: Script is starting...");
if (SETTINGS_1.RelayIsInUse === false && SETTINGS_2.RelayIsInUse === false) { print("Rank-and-Price: Both rules are disabled, script does nothing!"); }
let currentHour = -1; let roundRobin = 0;

Timer.set(30000, true, function () {
    if (currentHour !== new Date().getHours()) {
        currentHour = new Date().getHours();
        if (SETTINGS_1.RelayIsInUse === true) { SETTINGS_1.RelayExecuted = false } else { SETTINGS_1.RelayExecuted = true; };
        if (SETTINGS_2.RelayIsInUse === true) { SETTINGS_2.RelayExecuted = false } else { SETTINGS_2.RelayExecuted = true; };
    }
    if (SETTINGS_1.RelayExecuted === true && SETTINGS_2.RelayExecuted === true) { print("Rank-and-Price: Current hour is already done."); return; }
    if (roundRobin === 0) { ExecuteRelayRule(SETTINGS_1); roundRobin = 1; return; }
    if (roundRobin === 1) { ExecuteRelayRule(SETTINGS_2); roundRobin = 0; return; }
});

function ExecuteRelayRule(Settings) {
    if (Settings.RelayIsInUse === false || Settings.RelayExecuted === true) { return; }
    print("Rank-and-Price: running rule for a relay: " + Settings.RelayName);
    Shelly.call("HTTP.Request", { method: "GET", url: Settings.Url, timeout: 10, ssl_ca: "*" }, ProcessHttpRequestResponse, Settings);
}

function ProcessHttpRequestResponse(response, error_code, error_msg, Settings) {
    let relayExecuted = SetRelayStatusInShellyBasedOnHttpStatus(response, error_code, error_msg, Settings);
    if (Settings.SettingsNumber === 1) { SETTINGS_1.RelayExecuted = relayExecuted; }
    if (Settings.SettingsNumber === 2) { SETTINGS_2.RelayExecuted = relayExecuted; }
}

function SetRelayStatusInShellyBasedOnHttpStatus(response, error_code, error_msg, Settings) {
    if (error_code === 0 && response !== null) {
        if (response.code === 200) { SetRelayStatusInShelly(Settings, Settings.InvertedOn); return true; }
        if (response.code === 400) { SetRelayStatusInShelly(Settings, Settings.InvertedOff); return true; }
    }
    if (Settings.BackupHours.indexOf(currentHour) > -1) { SetRelayStatusInShelly(Settings, Settings.InvertedOn); return false; }
    else { SetRelayStatusInShelly(Settings, Settings.InvertedOff); return false; }
}

function SetRelayStatusInShelly(Settings, newStatus) {
    if (Settings.RelayStatus === newStatus && Settings.IsFirstRound === false) { print("Rank-and-Price: No action is done. The relay status remains the same as during previous execution."); return; }

    for (let i = 0; i < Settings.Relays.length; i++) {
        print("Rank-and-Price: Changing relay status. Id: " + Settings.Relays[i] + " - New relay status: " + newStatus);
        Shelly.call("Switch.Set", "{ id:" + Settings.Relays[i] + ", on:" + newStatus + "}", null, null);
    }

    if (Settings.SettingsNumber === 1) { SETTINGS_1.RelayStatus = newStatus; SETTINGS_1.IsFirstRound = false; }
    if (Settings.SettingsNumber === 2) { SETTINGS_2.RelayStatus = newStatus; SETTINGS_2.IsFirstRound = false; }
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
if (SETTINGS_1.Inverted === true) { SETTINGS_1.InvertedOn = false; SETTINGS_1.InvertedOff = true; }
if (SETTINGS_2.Inverted === true) { SETTINGS_2.InvertedOn = false; SETTINGS_2.InvertedOff = true; }