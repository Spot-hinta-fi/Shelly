// Spot-hinta.fi service is a privately funded service. If you want to support it, you can do it here:
// https://www.buymeacoffee.com/spothintafi  -- Thank you!

// NOTE! Shelly firmware must be updated to version 1.0.0 (or later) before using this script!

// Settings
let Region = "FI"; // See supported regions in Swagger documentation: https://api.spot-hinta.fi/swagger/ui
let RanksAllowed = "1,2,3,4";  // List allowed 'ranks' in this rule. 'Rank' tells how cheap the hour is relatively to other hours. Cheapest hour is 1, the most expensive is 24. Use RanksAllowed: "0", if only price limit is wanted.
let PriceAlwaysAllowed = "0"; // Allowed price (in euro cents, without decimals). Use "average" for a daily average price. Use "-999" if not wanted.
let PriorityHours = "99"; // Comma separated list of priority hours. List hours you want to prioritize. Use "99" to disable this.
let PriorityHoursRank = "3";  // This limits how many hours are prioritized (for example 3 cheapest hours from the list of priority hours)
let BackupHours = [1, 2, 3, 20]; // Backup hours; if API is not answering or internet connection is down. Use [99], if you don't want any backup hours.
let BoosterHours = "99"; // Comma separated list of booster hours. Relay is always ON during booster hours. Use "99" to disable this.

// Script
// Create variables
let cHour = ""; let bhour = false; let Executed = false; let rclosed = false;

let urlToCall = "https://api.spot-hinta.fi/JustNowRanksAndPrice";
urlToCall += "?ranksAllowed=" + RanksAllowed;
urlToCall += "&priceAlwaysAllowed=" + PriceAlwaysAllowed;
urlToCall += "&boosterHours=" + BoosterHours;
urlToCall += "&priorityHours=" + PriorityHours;
urlToCall += "&priorityHoursRank=" + PriorityHoursRank;
urlToCall += "&region=" + Region;

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
