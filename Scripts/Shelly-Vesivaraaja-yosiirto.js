// Kiitos tuestasi: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly ohjelmistot: 1.0.3 - 1.4.2. Skriptin versio: 2024-10-22

// ASETUKSET
let Rankit = [1, 2, 3];      // Listaa 'rankit' (eli tunnin järjestysnumero hinnan mukaan), jolloin releet kytketään
let Releet = [0];            // Ohjattavien releiden numerot. Esimerkiksi [0,1,2] ohjataksesi kolmea relettä
let Yotunnit = [22, 23, 0, 1, 2, 3, 4, 5, 6]; // Yösiirron tunnit. Näihin ei tarvitse normaalisti koskea (edes kellonsiirron aikaan).
let Hintaero = -1.43;        // Paljonko sähkön siirtohinta on halvempi yösiirron aikaan?
let SallittuHinta = 0;       // Hinta kokonaisina sentteinä, jonka alapuolella lämmitys aina sallitaan (kokonaisina sentteinä)
let Varatunnit = [3, 4, 5];  // Tunnit jolloin rele kytketään, mikäli ohjaustietoja ei saada haettua.

// KOODI
let url = "https://api.spot-hinta.fi/PlanAhead?priorityHours=" + Yotunnit.join() + "&priceModifier=" + Hintaero + "&ranksAllowed=" + Rankit.join() + "&priceAlwaysAllowed=" + SallittuHinta;
let hour = -1; let minute = new Date().getMinutes(); let previousAction = ""; print("WaterBoiler: Ohjaus käynnistyy 15 sekunnissa.");
let instructions = null; let loadInstructions = true; let instructionsTimeOut = new Date(); let previousStatus = "";

Timer.set(15000, true, function () {
    if (loadInstructions == true || instructionsTimeOut < new Date()) { LoadInstructionsFromServer(); }
    else { ChangeRelayStatusIfNeeded(); }

    if (minute !== new Date().getMinutes()) {
        minute = new Date().getMinutes();
        print("WaterBoiler: Ohjaus on toiminnassa. Releiden tila: " + previousStatus);
    }
});

function ChangeRelayStatusIfNeeded() {
    let relayStatus = GetCurrentlyExpectedRelayStatus();
    if (loadInstructions == true) { print("WaterBoiler: uudet ohjaustiedot täytyy ladata."); return; }
    if (previousStatus !== relayStatus.result) { SetRelayStatus(relayStatus); return; }
}

function SetRelayStatus(newStatus) {
    previousStatus = newStatus.result;
    for (let i = 0; i < Releet.length; i++) { Shelly.call("Switch.Set", "{ id:" + Releet[i] + ", on:" + newStatus.result + "}", null, null); }
    print("WaterBoiler: Releiden tila vaihdettiin. Uusi tila: " + newStatus.result);
}

function LoadInstructionsFromServer() {
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (res, err) {
        if (err != 0 || res == null || res.code !== 200 || res.body == null) {
            print("WaterBoiler: Virhe ohjaustietoja haettaessa. Yritetään uudelleen.");
        } else {
            instructions = JSON.parse(res.body); loadInstructions = false;
            instructionsTimeOut = new Date(instructions[0].epochMs - 10800 * 1000);
            print("WaterBoiler: Ohjaustiedot haettiin onnistuneesti. Uudet ohjaustiedot haetaan viimeistään: " + instructionsTimeOut.toString());
        }
    });
}

function GetCurrentlyExpectedRelayStatus() {
    if (instructions == null || instructions.length == 0) { ActivateBackupHours(); return; }
    const epochMs = Date.now(); if (instructions[0].epochMs < epochMs) { ActivateBackupHours(); return; }

    for (let i = 0; i < instructions.length; i++) {
        if (instructions.length > i && instructions[i + 1].epochMs > epochMs) { continue; }
        if (instructions.length > i && instructions[i + 1].epochMs <= epochMs) { return instructions[i + 1]; }
        if (instructions[i].epochMs <= epochMs) { return instructions[i]; }
    }

    print("WaterBoiler: Virhetilanne... Ei löytynyt sopivaa ohjaustietoa listalta."); ActivateBackupHours();
}

function ActivateBackupHours() {
    loadInstructions = true; print("WaterBoiler: Siirrytään varatuntien käyttöön.");
    if (Varatunnit.indexOf(new Date().getHours()) > -1) { SetRelayStatus(true); return; }
    else { SetRelayStatus(false); return; }
}