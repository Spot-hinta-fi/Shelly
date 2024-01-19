// Voit halutessasi tukea palvelun ylläpitoa täällä: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly laiteohjelmistoversiot: 1.0.3 - 1.1.0. Skriptin versio: 2024-01-19

// Asetukset lämminvesivaraajan ohjaukseen
let Lammitystunnit_yo = 3; // Kuinka monta halvinta tuntia lämmitetään 22:00 - 07:00?
let Lammitystunnit_iltapaiva = 0;  // Kuinka monta halvinta tuntia lämmitetään 12:00 - 19:00?
let Rele = 0; // Mitä relettä ohjataan? (0 on ensimmmäinen rele Shellyssä. "Switch Add-on" moduulin rele on 100)

// Koodi - älä koske
let hour = -1; let executed = false; let url = "https://spot-hinta-testi.azurewebsites.net/WaterBoiler/" + Lammitystunnit_yo + "/" + Lammitystunnit_iltapaiva;
print("WaterBoiler: Ohjaus käynnistyy. Ensimmäinen ohjaus tapahtuu 30 sekunnin kuluttua.");
Timer.set(30000, true, function () {
    if (hour != new Date().getHours()) { executed = false; hour = new Date().getHours(); }
    if (executed == true) { print("WaterBoiler: Odotetaan tunnin vaihtumista"); return; }
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (result, error_code) {
        if (error_code !== 0 || result == null) { ShellyCall(true); executed = false; print("WaterBoiler: Kytketty päälle (virhetilanne)"); return; }
        if (result.code == 200) { ShellyCall(true); executed = true; print("WaterBoiler: Kytketty päälle."); return; }
        if (result.code == 400) { ShellyCall(false); executed = true; print("WaterBoiler: Kytketty pois päältä."); return; }
        if (result.code !== 400 && result.code !== 200) { ShellyCall(true); executed = false; print("WaterBoiler: Kytketty päälle (virhetilanne)"); return; }
    });
});
function ShellyCall(status) { Shelly.call("Switch.Set", "{ id:" + Rele + ", on:"+ status +"}", null, null); }