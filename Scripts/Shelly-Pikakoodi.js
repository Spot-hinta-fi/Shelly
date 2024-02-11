// Kiitos tuestasi: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly ohjelmistot: 1.0.3 - 1.1.0. Skriptin versio: 2024-02-11

// ASETUKSET: Taulukon ensimmäinen arvo on Shellyn rele 0. Anna pikakoodiksi 999, jos relettä ei käytetä.
let Pikakoodit = [103, 130]; // Hae sopivat pikakoodit täältä: https://spot-hinta.fi/pikakoodit 

// SKRIPTI. Älä muokkaa.
let rr = -1; let hour = -1; let vtila = false; print("Pikakoodi: Skripti käynnistyy...");
Timer.set(15000, true, function () {
    if (hour == new Date().GetHours) { return; }
    else { rr--; rr = (rr < 0) ? Pikakoodit.length - 1 : rr; Ohjaus(rr); }
});

function Ohjaus(rr) {
    if (Pikakoodit[rr] == 999) { return; }
    Shelly.call("HTTP.GET", { url: "https://api.spot-hinta.fi/QuickCode/" + Pikakoodit[rr], timeout: 5, ssl_ca: "*" }, function (res, err) {
        let tila = (err == 0 && res != null && res.code == 400) ? false : true;
        let virhe = (err == 0 && res != null && res.code == 200 || res.code == 400) ? false : true; if (virhe) { vtila = true; }
        Shelly.call("Switch.Set", "{ id:" + rr + ", on:" + tila + "}", null, null);
        print("Pikakoodi: Rele " + rr + " on kytketty " + (tila ? "päälle" : "pois päältä") + (!virhe ? "." : " (virhetilanne)."));
        if (virhe && res != null && res.body != null) { print("Pikakoodi: Rele " + rr + " virheviesti: " + res.body) }
        if (rr == 0) { hour = (vtila) ? -1 : new Date().GetHours; print("Pikakoodi: Tunnin suoritus onnistunut?  " + !vtila); vtila = (hour > -1) ? false : true; }
    });
}