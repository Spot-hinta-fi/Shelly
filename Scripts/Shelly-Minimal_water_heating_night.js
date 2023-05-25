// Spot-hinta.fi service is a privately funded service. If you want to support it, you can do it here:
// https://www.buymeacoffee.com/spothintafi  -- Thank you!

// This script and API searches for cheapest hours during the night. Day change does not affect rank calculation.
// Hours are fixed between 22:00 - 06:59. Time is in region local time.

// Settings
let Region = "FI"; // See supported regions in Swagger documentation: https://api.spot-hinta.fi/swagger/ui
let Rank = "4"; // How many hours relay is on (cheapest hours) 
let BackupHours = ["03", "04", "05", "06"]; // If API or Internet connection is down, relay is on these hours

// Script
// Technical variables
let cHour = ""; let bhour = false; let Executed = false; let rclosed = false;
let urlToCall = "https://api.spot-hinta.fi/JustNowRankNight?Rank=" + Rank + "&region=" + Region;

// Create timer
Timer.set(60000, true, function () {
    Shelly.call("Shelly.GetStatus", "", function (res) {
        let hour = res.sys.time.slice(0, 2); // f.ex. "21:34"
        if (cHour !== hour) { cHour = hour; Executed = false; }
        if (Executed === true) { print("Current hour is already done."); return; }
        bhour = false; for (let i = 0; i < BackupHours.length; i++) { if (BackupHours[i] === cHour) { bhour = true; } }
        print("URL to call: " + urlToCall);

        // Send HTTP GET to API
        Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, RunResponse);
    });
});

function RunResponse(result) {
    if (result !== null) {
        if (result.code === 400 && rclosed === true) { print("Relay already turned OFF by this script."); Executed = true; return; } // Allows possible other script to control relay while this is closed
        if (result.code === 400 && rclosed === false) { Shelly.call("Switch.Set", "{ id:0, on:false}", null, null); print("Relay OFF"); rclosed = true; Executed = true; return; }
        if (result.code === 200) { Shelly.call("Switch.Set", "{ id:0, on:true}", null, null); print("Relay ON"); rclosed = false; Executed = true; return; }
    }
    // Backup hour execution because request response was not an expected result. 
    if (bhour === true) { Shelly.call("Switch.Set", "{ id:0, on:true}", null, null); print("Relay ON (backup)"); rclosed = false; Executed = false; return; }
    Shelly.call("Switch.Set", "{ id:0, on:false}", null, null); print("Relay OFF (non-backup)"); rclosed = true; Executed = false; return;
}
