// You can support spot-hinta.fi service here: https://www.buymeacoffee.com/spothintafi
// Supported Shelly firmwares: 1.0.3, 1.0.7

// Change these settings as you like
let Region = "FI"; // Supported regions: DK1, DK2, EE, FI, LT, LV, NO1, NO2, NO3, NO4, NO5, SE1, SE2, SE3, SE4
let Relays = [0]; // Relays to control with this script. List relays as comma separated. For example: [0,1,2]
let CheapestHours = "4";  // How many cheapest hours relay will be turned on? To ONLY use a price limit, put CheapestHours to "0".
let OnlyNightHours = false; // false == cheapest hours can be any during day. true == cheapest hours are only searched from the night hours (22:00 - 07:00)
let PriceAlwaysAllowed = "0"; // Below what hour price the relay can be always on (or off, if inverted)? Value is in full euro cents. Use "-999" to disable.
let BackupHours = [3, 4, 5, 6]; // If Internet connection is down, turn relay ON during these hours (0...23). Use [99], if you don't want any backup hours.
let Inverted = false; // If "true", relay logic is inverted (= relay is turned ON when price is too exepensive and OFF when cheap)

// Don't touch below!
print("Minimal-Heating: Script has started succesfully. The first relay action happens in 30 seconds.");
let cHour = ""; let Executed = false; let urlToCall = ""; let previousAction = ""; let invertedOn = "true"; let invertedOff = "false;"
if (Inverted === true) { invertedOn = "false"; invertedOff = "true"; }
if (OnlyNightHours == false) { urlToCall = "https://api.spot-hinta.fi/JustNowRank/" + CheapestHours + "/" + PriceAlwaysAllowed + "?region=" + Region; print("Minimal-Heating: Url to be used: " + urlToCall); }
else { urlToCall = "https://api.spot-hinta.fi/JustNowRankNight?rank=" + CheapestHours + "&priceAlwaysAllowed=" + PriceAlwaysAllowed + "&region=" + Region; print("Minimal-Heating: Url to be used: " + urlToCall); }

Timer.set(30000, true, function () {
    let hour = new Date().getHours();
    if (cHour !== hour) { cHour = hour; Executed = false; print("Minimal-Heating: The hour has now changed and a new relay action is going to be performed.") }
    if (cHour == hour && Executed == true) { print("Minimal-Heating: This hour has already been executed. Waiting for an hour change."); return; }
    Shelly.call("HTTP.GET", { url: urlToCall, timeout: 15, ssl_ca: "*" }, RunResponse);
});

function RunResponse(result, error_code) {
    if (error_code === 0 && result !== null) {
        if ((result.code === 400 || result.code === 200) && previousAction === result.code) { print("Minimal-Heating: No action is done. The relay status remains the same as during previous hour."); Executed = true; return; }

        if (result.code === 400 || result.code == 200) {
            for (let i = 0; i < Relays.length; i++) {
                if (result.code === 400) { Shelly.call("Switch.Set", "{ id:" + Relays[i] + ", on:" + invertedOff + "}", null, null); previousAction = result.code; print("Minimal-Heating: Turning relay " + Relays[i] + " OFF (ON - if inverted). Hour is too expensive."); Executed = true; }
                if (result.code === 200) { Shelly.call("Switch.Set", "{ id:" + Relays[i] + ", on:" + invertedOn + "}", null, null); previousAction = result.code; print("Minimal-Heating: Turning relay " + Relays[i] + " ON (OFF - if inverted). Hour is cheap enough."); Executed = true; }
            }
            return;
        }
    }

    previousAction = "";
    if (BackupHours.indexOf(cHour) > -1) {
        for (let i = 0; i < Relays.length; i++) {
            Shelly.call("Switch.Set", "{ id:" + Relays[i] + ", on:" + invertedOn + "}", null, null); print("Minimal-Heating: Error while fetching control information. Relay " + Relays[i] + " is turned ON (OFF - if inverted), because it is a backup hour."); Executed = false;
        }
        return;
    }
    else {
        for (let i = 0; i < Relays.length; i++) {
            Shelly.call("Switch.Set", "{ id:" + Relays[i] + ", on:" + invertedOff + "}", null, null); print("Minimal-Heating: Error while fetching control information. Relay " + Relays[i] + " is turned OFF (ON - if inverted), because it is not a backup hour."); Executed = false;
        }
    }
}