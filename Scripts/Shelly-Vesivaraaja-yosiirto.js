// Kiitos tuestasi: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly ohjelmistot: 1.0.3 - 1.4.2. Skriptin versio: 2024-09-07

// ASETUKSET
let Rankit = "1,2,3"; // Listaa 'rankit' (eli tunnin järjestysnumero hinnan mukaan), jolloin rele kytketään?
let Hintaero = -1.43; // Paljonko siirtohinta on halvempi yösiirron aikaan?
let Rele = 0;         // Ohjattavan releen numero?

// KOODI
let url = "https://api.spot-hinta.fi/JustNowRanksAndPrice?priorityHours=22,23,0,1,2,3,4,5,6&priceModifier=" + Hintaero + "&ranksAllowed=" + Rankit;
let hour = -1; print("WaterBoiler: Ohjaus käynnistyy 30 sekunnissa.");
Timer.set(30000, true, function () {
    if (hour == new Date().getHours()) { print("WaterBoiler: Odotetaan tunnin vaihtumista."); return; }
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (res, err) {
        hour = (err != 0 || res == null || (res.code !== 200 && res.code !== 400)) ? -1 : new Date().getHours();
        let on = (hour > -1) ? res.code != 400 : true;
        Shelly.call("Switch.Set", "{ id:" + Rele + ", on:" + on + "}", null, null);
        print("WaterBoiler: Kytketty " + (on ? "päälle" : "pois päältä") + ((hour > -1) ? "." : " (virhetilanne)."));
    });
});