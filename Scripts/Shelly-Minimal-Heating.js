// Thank you for your support: www.buymeacoffee.com/spothintafi
// Supported Shelly firmwares: 1.4.4 - 1.7.1. Script version: 2025-10-05
// Note: The script works with 15-minute prices, meaning the selected periods can start and end at 15-minute intervals.

// Change these settings as you like
let Region = "FI"; // Supported regions: DK1, DK2, EE, FI, LT, LV, NO1, NO2, NO3, NO4, NO5, SE1, SE2, SE3, SE4
let SelectedPricePeriods = ["1-4"]; // Selects the cheapest price periods (Note! use quotes only for ranges). You can also define individually: [1,2,3,4].
let PricePeriodLength = 60; // Duration of one price period ("rank") in minutes (15, 30, 45, 60, 75, 90, or 120). Total activation time = SelectedPricePeriods count × PricePeriodLength.
let Relays = [0]; // Relays to control. For example: [0, 1, 2] to control three relays.
let NightHours = [22, 23, 0, 1, 2, 3, 4, 5, 6]; // Night transfer hours. These usually don’t need to be changed (not even during daylight saving time changes).
let PriceDifference = -1.43; // Difference between night and day prices. A negative value means the night transfer is cheaper by this amount. Information available from the electricity distribution company.
let OnlyNightHours = false; // If true, cheapest hours are only searched from the night hours. Default is false == all hours.
let PriceAlwaysAllowed = -1.43; // Daytime price that is always allowed. During night hours, prices higher by the amount of the PriceDifference are also allowed.
let MaximumPrice = 99.9; // Maximum allowed price in euro cents.
let BackupHours = [3, 4, 5, 6]; // If Internet connection is down, turn relay ON during these hours (0...23). Use [99], if you don't want any backup hours.
let Inverted = false; // If "true", relay logic is inverted (= relay is turned ON when price is too exepensive and OFF when cheap)

// Code starts here - do not change
if (OnlyNightHours == true) { PriceDifference = -999; }
let url = "https://api.spot-hinta.fi/PlanAhead?region=" + Region + "&priorityHours=" + NightHours.join() + "&priceModifier=" + PriceDifference;
url += "&ranksAllowed=" + SelectedPricePeriods.join() + "&rankDuration=" + PricePeriodLength + "&priceAlwaysAllowed=" + PriceAlwaysAllowed + "&maxPrice=" + MaximumPrice;
let hour = -1; let nextMessage = new Date(new Date().getTime() + 2 * 60 * 1000); let previousAction = ""; print("Minimal-Heating: Control starts in 15 seconds.");
let instructions = null; let loadInstructions = true; let instructionsTimeOut = new Date(); let previousStatus = ""; let nextStatusChange = new Date();

Timer.set(15000, true, function () {
    if (loadInstructions == true || instructionsTimeOut < new Date()) { LoadInstructionsFromServer(); }
    else { ChangeRelayStatusIfNeeded(); }

    if (new Date() > nextMessage) {
        nextMessage = new Date(new Date().getTime() + 2 * 60 * 1000);
        print("Minimal-Heating: Control is running. Relay state: " + previousStatus + " - Next state change: " + nextStatusChange.toString());
    }
});

function ChangeRelayStatusIfNeeded() {
    let relayStatus = GetCurrentlyExpectedRelayStatus();
    if (loadInstructions == true) { print("Minimal-Heating: New control data must be loaded."); return; }
    if (previousStatus !== relayStatus.result) { SetRelayStatus(relayStatus.result); return; }
}

function SetRelayStatus(newStatus) {
    let invertedStatus = newStatus; if (Inverted == true) { invertedStatus = !newStatus; }
    previousStatus = newStatus;
    for (let i = 0; i < Relays.length; i++) { Shelly.call("Switch.Set", "{ id:" + Relays[i] + ", on:" + invertedStatus + "}", null, null); }
    print("Minimal-Heating: Relay state changed. New state: " + invertedStatus);
}

function LoadInstructionsFromServer() {
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (res, err) {
        if (err != 0 || res == null || res.code !== 200 || res.body == null) {
            print("Minimal-Heating: Error fetching control data. Retrying."); ActivateBackupHours();
        } else {
            instructions = JSON.parse(res.body); loadInstructions = false;
            instructionsTimeOut = new Date(instructions[0].epochMs - 10800 * 1000);
            print("Minimal-Heating: Control data fetched successfully. New data will be fetched by: " + instructionsTimeOut.toString());
        }
    });
}

function GetCurrentlyExpectedRelayStatus() {
    if (instructions == null || instructions.length == 0) { ActivateBackupHours(); return; }
    const epochMs = Date.now(); if (instructions[0].epochMs < epochMs) { ActivateBackupHours(); return; }

    for (let i = 0; i < instructions.length; i++) {
        if (instructions.length > i && instructions[i + 1].epochMs > epochMs) { continue; }
        if (instructions.length > i && instructions[i + 1].epochMs <= epochMs) { nextStatusChange = new Date(instructions[i].epochMs); return instructions[i + 1]; }
        if (instructions[i].epochMs <= epochMs) { return instructions[i]; }
    }

    print("Minimal-Heating: Error situation. No suitable control data found in the list."); ActivateBackupHours();
}

function ActivateBackupHours() {
    loadInstructions = true;
    if (BackupHours.indexOf(new Date().getHours()) > -1) { print("Minimal-Heating: Hour now is backup hour."); SetRelayStatus(true); return; }
    else { print("Minimal-Heating: Hour now is not backup hour."); SetRelayStatus(false); return; }
}