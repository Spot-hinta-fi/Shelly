// Kiitos tuestasi: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly ohjelmistot: 1.0.3 - 1.1.0. Skriptin versio: 2024-01-19

// ASETUKSET
let TUNNIT_YO = 3; // Yötuntien lukumäärä 22:00 - 06:59?
let TUNNIT_IP = 0; // Iltapäivätuntien lukumäärä 12:00 - 19:59?
let RELE = 0;      // Mitä relettä ohjataan? 

// KOODI
let url = "https://api.spot-hinta.fi/WaterBoiler/" + TUNNIT_YO + "/" + TUNNIT_IP; let hour = null;
print("WaterBoiler: Ohjaus käynnistyy 30 sekunnissa.");
Timer.set(30000, true, function () {
    if (hour == new Date().getHours()) { print("WaterBoiler: Odotetaan tunnin vaihtumista."); return; }
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (res, err) {
        hour = (err != 0 || res == null || (res.code !== 200 && res.code !== 400)) ? null : new Date().getHours();
        let on = hour ? res.code != 400 : true;
        Shelly.call("Switch.Set", "{ id:" + RELE + ", on:" + on + "}", null, null);
        print("WaterBoiler: Kytketty " + (on ? "päälle" : "pois päältä") + (hour ? "." : " (virhetilanne)."));
    });
});