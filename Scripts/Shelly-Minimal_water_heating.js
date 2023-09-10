// You can support spot-hinta.fi service here: https://www.buymeacoffee.com/spothintafi

// Change these settings as you like
let Region = "FI"; // See supported regions in Swagger documentation: https://api.spot-hinta.fi/swagger/ui
let Relay = "0"; // Number of the relay within Shelly. The first relay is always "0", next "1", etc.
let CheapestHours = "4";  // How many cheapest hours relay will be turned on?
let OnlyNightHours = false; // false == cheapest hours can be any during day. true == cheapest hours are only searched from the night hours (22:00 - 07:00)
let PriceAlwaysAllowed = "0"; // At what price the relay can ALWAYS be on? Use "-999" if you don't want to use this.
let BackupHours = [3, 4, 5, 6]; // If Internet connection is down, turn relay ON during these hours.

// Don't touch below!
print("Script has started succesfully. The first relay action happens in 30 seconds.");
let cHour = ""; let Executed = false; let urlToCall = ""; let previousAction = "";
if (OnlyNightHours == false) { urlToCall = "https://api.spot-hinta.fi/JustNowRank/" + CheapestHours + "/" + PriceAlwaysAllowed + "?region=" + Region; print("Url to be used: " + urlToCall); }
else { urlToCall = "https://api.spot-hinta.fi/JustNowRankNight?rank=" + CheapestHours + "&priceAlwaysAllowed=" + PriceAlwaysAllowed + "&region=" + Region; print("Url to be used: " + urlToCall); }

Timer.set(30000, true, function () {
    let hour = new Date().getHours();
    if (cHour !== hour) { cHour = hour; Executed = false; print("The hour has now changed and a new relay action is going to be performed.") }
    if (cHour == hour && Executed == true) { print("This hour has already been executed. Waiting for an hour change."); return; }
    Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, RunResponse);
});

function RunResponse(result, error_code) {
    if (error_code === 0 && result !== null) {
        if ((result.code === 400 || result.code === 200) && previousAction === result.code) { print("No action is done. The relay status remains the same as during previous hour."); return; }
        if (result.code === 400) { Shelly.call("Switch.Set", "{ id:" + Relay + ", on:false}", null, null); previousAction = result.code; print("Turning relay OFF. Hour is too expensive."); Executed = true; return; }
        if (result.code === 200) { Shelly.call("Switch.Set", "{ id:" + Relay + ", on:true}", null, null); previousAction = result.code; print("Turning relay ON. Hour is cheap enough."); Executed = true; return; }
    }
    previousAction = "";
    if (BackupHours.indexOf(cHour) > -1) { Shelly.call("Switch.Set", "{ id:" + Relay + ", on:true}", null, null); print("Error while fetching control information. Relay is turned ON, because it is a backup hour."); Executed = false; return; }
    Shelly.call("Switch.Set", "{ id:" + Relay + ", on:false}", null, null); print("Error while fetching control information. Relay is turned OFF, because it is not a backup hour."); Executed = false;
}