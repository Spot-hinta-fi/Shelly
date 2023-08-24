// Spot-hinta.fi service is a privately funded service. If you want to support it, you can do it here:
// https://www.buymeacoffee.com/spothintafi  -- Thank you!

// This script and API searches for cheapest hours during the night. Day change does not affect rank calculation.
// Hours are fixed between 22:00 - 06:59. Time is in region local time.

// NOTE! Shelly firmware must be updated to version 1.0.0 (or later) before using this script!

// Settings
let Region = "FI"; // See supported regions in Swagger documentation: https://api.spot-hinta.fi/swagger/ui
let Rank = "4"; // How many hours relay is on (cheapest hours) 
let BackupHours = [3, 4, 5, 6, 21]; // Backup hours; if API is not answering or internet connection is down. Use [99], if you don't want any backup hours.

// Script
// Technical variables
let cHour = ""; let bhour = false; let Executed = false; let rclosed = false;
let urlToCall = "https://api.spot-hinta.fi/JustNowRankNight?Rank=" + Rank + "&region=" + Region;

// Create timer
Timer.set(60000, true, function () {

    let date = new Date();
    let hour = date.getHours();

    if (cHour !== hour) { cHour = hour; Executed = false; }
    if (Executed === true) { print("Current hour is already done."); return; }
    
    bhour = false; for (let i = 0; i < BackupHours.length; i++) { if (BackupHours[i] === cHour) { bhour = true; } }
    print("URL to call: " + urlToCall);
    
    // Send HTTP GET to API
    Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, RunResponse);
});

function RunResponse(result, error_code, error_msg) {

    if (error_code === 0 && result !== null) {
        if (result.code === 400 && rclosed === true) { print("Relay already turned OFF by this script."); Executed = true; return; } // Allows possible other script to control relay while this is closed
        if (result.code === 400 && rclosed === false) { Shelly.call("Switch.Set", "{ id:0, on:false}", null, null); print("Relay OFF"); rclosed = true; Executed = true; return; }
        if (result.code === 200) { Shelly.call("Switch.Set", "{ id:0, on:true}", null, null); print("Relay ON"); rclosed = false; Executed = true; return; }
    }
    
    print("Error occurred while making a request. Running backup rule. Error message was: " + error_msg);

    // Backup hour execution because request response was not an expected result. 
    if (bhour === true) { Shelly.call("Switch.Set", "{ id:0, on:true}", null, null); print("Relay ON (backup)"); rclosed = false; Executed = false; return; }
    Shelly.call("Switch.Set", "{ id:0, on:false}", null, null); print("Relay OFF (non-backup)"); rclosed = true; Executed = false; return;
}
