// Voit halutessasi tukea palvelun ylläpitoa täällä: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly laiteohjelmistoversiot: 1.0.3 - 1.1.0. Skriptin versio: 2024-01-19

// Asetukset lämminvesivaraajan ohjaukseen
let Lammitystunnit_yo = 3; // Kuinka monta halvinta tuntia lämmitetään 22:00 - 06:59?
let Lammitystunnit_iltapaiva = 0;  // Kuinka monta halvinta tuntia lämmitetään 12:00 - 19:59?
let Rele = 0; // Mitä relettä ohjataan? (0 on ensimmmäinen rele Shellyssä. "Switch Add-on" rele on 100)

// Koodi - älä koske
let url = "https://api.spot-hinta.fi/WaterBoiler/" + Lammitystunnit_yo + "/" + Lammitystunnit_iltapaiva; let hour = null;
print("WaterBoiler: Ohjaus käynnistyy. Ensimmäinen ohjaus tapahtuu 30 sekunnin kuluttua.");
Timer.set(30000, true, function () {
    if (hour == new Date().getHours()) { print("WaterBoiler: Odotetaan tunnin vaihtumista"); return; }
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (res, err) {
        hour = (err != 0 || res == null || (res.code !== 200 && res.code !== 400)) ? null : new Date().getHours();
        let on = hour ? res.code != 400 : true;
        Shelly.call("Switch.Set", "{ id:" + Rele + ", on:" + on + "}", null, null);
        print("WaterBoiler: Kytketty " + (on ? "päälle" : "pois päältä") + (hour ? "." : " (virhetilanne)."));
    });
});