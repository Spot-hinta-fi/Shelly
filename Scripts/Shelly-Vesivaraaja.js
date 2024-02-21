// Kiitos tuestasi: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly ohjelmistot: 1.0.3 - 1.2.0. Skriptin versio: 2024-02-18

// ASETUKSET
let TUNNIT_YO = 3; // Halvimpien yötuntien lukumäärä (22:00 - 06:59)?
let TUNNIT_IP = 0; // Halvimpien iltapäivätuntien lukumäärä (12:00 - 19:59)?
let RELE = 0;      // Mitä relettä ohjataan? 
let PAIVAT = [1, 2, 3, 4, 5, 6, 7]; // Minä päivinä sääntö ajetaan? (1=ma, 7=su). Ohjauspäivä vaihtuu klo 22:00.

// KOODI
let url = "https://api.spot-hinta.fi/WaterBoiler/" + TUNNIT_YO + "/" + TUNNIT_IP; let hour = -1;
print("WaterBoiler: Ohjaus käynnistyy 30 sekunnissa.");
Timer.set(30000, true, function () {
    let dayNow = (new Date().getDay() == 0) ? 7 : new Date().getDay();
    if (new Date().getHours() >= 22) { dayNow = (dayNow == 7) ? 1 : dayNow + 1; }
    if (PAIVAT.indexOf(dayNow) === -1) { print("WaterBoiler: ohjausta ei suoriteta tänään."); return; }
    if (hour == new Date().getHours()) { print("WaterBoiler: Odotetaan tunnin vaihtumista."); return; }
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (res, err) {
        hour = (err != 0 || res == null || (res.code !== 200 && res.code !== 400)) ? -1 : new Date().getHours();
        let on = (hour > -1) ? res.code != 400 : true;
        Shelly.call("Switch.Set", "{ id:" + RELE + ", on:" + on + "}", null, null);
        print("WaterBoiler: Kytketty " + (on ? "päälle" : "pois päältä") + ((hour > -1) ? "." : " (virhetilanne)."));
    });
});