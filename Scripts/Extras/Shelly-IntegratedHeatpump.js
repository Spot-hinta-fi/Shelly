// Thank you for your support: https://www.buymeacoffee.com/spothintafi
// Supported Shelly firmwares: 1.0.3 - 1.4.4. Script version: 2024-12-29

// Change these settings as you like
let bn = 1; // Relay 0: Water heating - how many night hours?
let ba = 1; // Relay 0: Water heating - How many afternoon hours?
let hr = "2,3,4,5,6,7,8,9"; // Relay 1: Ranks to activate relay (f.ex. higher heating temperature)
let nhr = "17,18,19,20,21,22,23,24"; // Relay 2: Ranks to activate relay (f.ex. stopping heating during expensive hours)
let pm = -1.43; // How much cheaper night hours are? Default: Caruna Espoo 1.9.2024 onwards

// Script starts here - Do not edit anything below
let rr = 1; let utc = ""; let whon = false; let ex = false; let rn = 0; let cHour = ""; let api = "https://api.spot-hinta.fi/";
let url1 = api + "WaterBoiler/" + bn + "/" + ba;
let url2 = api + "JustNowRanksAndPrice?priorityHours=22,23,0,1,2,3,4,5,6&priceModifier=" + pm + "&ranksAllowed=" + hr;
let url3 = api + "JustNowRanksAndPrice?priorityHours=22,23,0,1,2,3,4,5,6&priceModifier=" + pm + "&ranksAllowed=" + nhr;

print("IntegratedHeatPump: Script is starting...");
Timer.set(15000, true, function () {
    let hour = new Date().getHours();
    if (cHour !== hour) { whon = false; cHour = hour; ex = false; print("IntegratedHeatPump: Hour changed.") }
    if (cHour == hour && ex == true) { print("IntegratedHeatPump: Waiting for an hour change."); return; }

    if (rr === 1) { utc = url1; rr = 2; rn = 0; }
    else if (rr === 2) { utc = url2; rr = 3; rn = 1; }
    else if (rr === 3) { utc = url3; rr = 1; rn = 2; ex = true; }
    Shelly.call("HTTP.GET", { url: utc, timeout: 15, ssl_ca: "*" }, RunResponse);
});

function RunResponse(result, error_code) {
    if (error_code !== 0 || result === null) {
        Shelly.call("Switch.Set", "{ id:" + rn + ", on:false}", null, null);
        print("IntegratedHeatPump: Relay OFF (error): " + rn);
        if (rn === 0) { whon = false; }
        return;
    }

    let on = (result.code === 200) ? true : false;
    if (on === true && rn === 0) { whon = true; } // Water heating goes on this hour    
    if (whon === true && rn > 0) { on = false; } // Other relays will not be enabled

    Shelly.call("Switch.Set", "{ id:" + rn + ", on:" + on + "}", null, null);
    print("IntegratedHeatPump: Relay number: " + rn + " - New status: " + on);
}