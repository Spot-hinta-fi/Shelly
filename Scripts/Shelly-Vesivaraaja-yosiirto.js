// Kiitos tuestasi: www.buymeacoffee.com/spothintafi
// Tuetut Shelly ohjelmistot: 1.4.4 - 1.7.1. Skriptin versio: 2025-09-30
// Huomio: skripti toimii varttihinnoilla, eli hintajaksot voivat alkaa ja päättyä vartin tarkkuudella.

// ASETUKSET
let ValitutHintajaksot = ["1-4"]; // Valitut hintajaksot hinnan mukaan (huom! lainausmerkit vain jaksoväleille). Voit myös määrittää yksitellen: [1,2,3,4].
let HintajaksonPituus = 60; // Yhden hintajakson ("rank") kesto minuutteina (15, 30, 45, 60, 75, 90 tai 120). Kokonaiskytkentäaika = ValitutHintajaksot lkm. × HintajaksonPituus.
let Releet = [0]; // Ohjattavien releiden numerot. Esimerkiksi [0,1,2] ohjaa kolmea relettä.
let Yotunnit = [22, 23, 0, 1, 2, 3, 4, 5, 6]; // Yösiirron tunnit. Näitä ei yleensä tarvitse muuttaa (myöskään kellonsiirron aikaan).
let Hintaero = -1.43; // Yö- ja päivähinnan ero. Negatiivinen arvo = yösiirto on näin paljon halvempi. Siirtoyhtiöstä saatava tieto.
let SallittuHinta = 0; // Päivähinta joka aina sallitaan. Yötunneilta sallitaan Hintaeron verran kalliimmatkin hinnat.
let Varatunnit = [3, 4, 5]; // Tunnit, jolloin rele kytketään, jos ohjaustietoja ei saada haettua.

// KOODI
let url = "https://api.spot-hinta.fi/PlanAhead?priorityHours=" + Yotunnit.join() + "&priceModifier=" + Hintaero + "&ranksAllowed=" + ValitutHintajaksot.join() + "&rankDuration=" + HintajaksonPituus + "&priceAlwaysAllowed=" + SallittuHinta;
let hour = -1; let nextMessage = new Date(new Date().getTime() + 2 * 60 * 1000); let previousAction = ""; print("WaterBoiler: Ohjaus käynnistyy 15 sekunnissa.");
let instructions = null; let loadInstructions = true; let instructionsTimeOut = new Date(); let previousStatus = ""; let nextStatusChange = new Date();

Timer.set(15000, true, function () {
    if (loadInstructions == true || instructionsTimeOut < new Date()) { LoadInstructionsFromServer(); }
    else { ChangeRelayStatusIfNeeded(); }

    if (new Date() > nextMessage) {
        nextMessage = new Date(new Date().getTime() + 2 * 60 * 1000);
        print("WaterBoiler: Ohjaus on toiminnassa. Releiden tila: " + previousStatus + " - Seuraava tilamuutos: " + nextStatusChange.toString());
    }
});

function ChangeRelayStatusIfNeeded() {
    let relayStatus = GetCurrentlyExpectedRelayStatus();
    if (loadInstructions == true) { print("WaterBoiler: uudet ohjaustiedot täytyy ladata."); return; }
    if (previousStatus !== relayStatus.result) { SetRelayStatus(relayStatus.result); return; }
}

function SetRelayStatus(newStatus) {
    previousStatus = newStatus;
    for (let i = 0; i < Releet.length; i++) { Shelly.call("Switch.Set", "{ id:" + Releet[i] + ", on:" + newStatus + "}", null, null); }
    print("WaterBoiler: Releiden tila vaihdettiin. Uusi tila: " + newStatus);
}

function LoadInstructionsFromServer() {
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (res, err) {
        if (err != 0 || res == null || res.code !== 200 || res.body == null) {
            print("WaterBoiler: Virhe ohjaustietoja haettaessa. Yritetään uudelleen."); ActivateBackupHours();
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
        if (instructions.length > i && instructions[i + 1].epochMs <= epochMs) { nextStatusChange = new Date(instructions[i].epochMs); return instructions[i + 1]; }
        if (instructions[i].epochMs <= epochMs) { return instructions[i]; }
    }

    print("WaterBoiler: Virhetilanne... Ei löytynyt sopivaa ohjaustietoa listalta."); ActivateBackupHours();
}

function ActivateBackupHours() {
    loadInstructions = true;
    if (Varatunnit.indexOf(new Date().getHours()) > -1) { print("WaterBoiler: Tunti on varatunti."); SetRelayStatus(true); return; }
    else { print("WaterBoiler: Tunti ei ole varatunti."); SetRelayStatus(false); return; }
}
