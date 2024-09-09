// Kiitos tuestasi: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly ohjelmistot: 1.0.3 - 1.4.2. Skriptin versio: 2024-09-09

// ASETUKSET
let Tunnit_yo = 3;          // Yötuntien lukumäärä 22:00 - 07:00
let Tunnit_ip = 0;          // Iltapäivätuntien lukumäärä 12:00 - 20:00
let Rele = 0;               // Ohjattavan releen numero
let Varatunnit = [3, 4, 5]; // Tunnit jolloin rele kytketään, mikäli Internet yhteys ei toimi tai palvelu on alhaalla

// KOODI
let url = "https://api.spot-hinta.fi/WaterBoiler/" + Tunnit_yo + "/" + Tunnit_ip;
let hour = -1; print("WaterBoiler: Ohjaus käynnistyy 30 sekunnissa.");
Timer.set(30000, true, function () {
    if (hour == new Date().getHours()) { print("WaterBoiler: Odotetaan tunnin vaihtumista."); return; }
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (res, err) {
        hour = (err != 0 || res == null || (res.code !== 200 && res.code !== 400)) ? -1 : new Date().getHours();
        let on = false;
        if (hour === -1) {
            if (Varatunnit.indexOf(new Date().getHours()) > -1) {
                on = true; hour = new Date().getHours();
                print("WaterBoiler: Virhetilanne. Kuluva tunti on varatunti: rele kytketään päälle tämän tunnin ajaksi.");
            } else {
                print("WaterBoiler: Virhetilanne. Kuluva tunti ei ole varatunti: relettä ei kytketä. Yhteyttä yritetään uudestaan.");
            }
        } else { if (res.code === 200) { on = true; } }
        Shelly.call("Switch.Set", "{ id:" + Rele + ", on:" + on + "}", null, null);
        print("WaterBoiler: Kytketty " + (on ? "päälle" : "pois päältä"));
    });
});