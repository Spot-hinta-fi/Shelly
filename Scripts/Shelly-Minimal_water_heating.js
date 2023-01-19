/* Spot-hinta.fi service is a privately funded service. If you want to support it, you can do it here:
 * https://www.buymeacoffee.com/spothintafi  -- Thank you! */

/* Parameters */
let Region = "FI"; // See all supported regions from Swagger documentation: https://api.spot-hinta.fi/swagger/ui
let Rank = "4"; // How many hours relay is on (cheapest hours) 
let PriceAllowed = "3"; // Heating is always on, when price is below this (Euro cents)
let BackupHours = ["03", "04", "05", "06"]; // If API or Internet connection is down, heat these hours
let BoosterHours = "05,17"; // Run early morning one hour and afternoon one hour. Use "99", if not wanted.

// SCRIPT, dont edit below
let cHour = ""; let bhour = false; let Executed = false;
let urlToCall = "https://api.spot-hinta.fi/JustNowRank/" + Rank + "/" + PriceAllowed + "?boosterHours=" + BoosterHours + "&region=" + Region;

Timer.set(60000, true, function () {
    Shelly.call("Shelly.GetStatus", "", function (res) {
        let hour = res.sys.time.slice(0, 2); // f.ex. "21:34"
        if (cHour !== hour) { cHour = hour; Executed = false; }
        if (Executed === true) { print("Already executed this hour successfully."); return; }
        bhour = false; for (let i = 0; i < BackupHours.length; i++) { if (BackupHours[i] === cHour) { bhour = true; } }
        Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, RunResponse);
    });
});

function RunResponse(result) {
    if (result.code === 400) { Shelly.call("Switch.Set", "{ id:0, on:false}", null, null); print("Relay OFF"); Executed = true; return; }
    if (result.code === 200) { Shelly.call("Switch.Set", "{ id:0, on:true}", null, null); print("Relay ON"); Executed = true; return; }
    if (bhour === true) { Shelly.call("Switch.Set", "{ id:0, on:true}", null, null); print("Relay ON (backup)"); Executed = false; return; }
    Shelly.call("Switch.Set", "{ id:0, on:false}", null, null); print("Relay OFF (non-backup)"); Executed = false; return;
}
