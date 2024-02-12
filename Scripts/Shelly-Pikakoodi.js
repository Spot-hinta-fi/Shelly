// Kiitos tuestasi: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly ohjelmistot: 1.0.3 - 1.1.0. Skriptin versio: 2024-02-11

// ASETUKSET. Anna pikakoodi niille releille, joita haluat ohjata. Koodi 999 ohittaa releen.
let Pikakoodit = [103, 999, 999]; // Hae sopivat pikakoodit täältä: https://spot-hinta.fi/pikakoodit

// SKRIPTI. Älä muokkaa alla olevaa
let rr = -1; let tunti = -1; let vtila = false; print("Pikakoodi: Skripti käynnistyy.");
Timer.set(15000, true, function () {
    if (tunti == new Date().getHours()) { return; } else {
        rr--; rr = (rr < 0) ? Pikakoodit.length - 1 : rr; if (Pikakoodit[rr] == 999) { return; }
        Shelly.call("HTTP.GET", { url: "https://api.spot-hinta.fi/QuickCode/" + Pikakoodit[rr], timeout: 5, ssl_ca: "*" }, function (res, err) {
            let tila = (err == 0 && res != null && res.code == 400) ? false : true;
            let virhe = (err == 0 && res != null && res.code == 200 || res.code == 400) ? false : true; if (virhe) { vtila = true; }
            Shelly.call("Switch.Set", "{ id:" + rr + ", on:" + tila + "}", null, null);
            print("Pikakoodi: Rele " + rr + " on kytketty " + (tila ? "päälle" : "pois päältä") + (!virhe ? "." : " (virhetilanne)."));
            if (virhe && res != null && res.body != null) { print("Pikakoodi: Rele " + rr + " virheviesti: " + res.body) }
            if (rr == 0) { tunti = (vtila) ? -1 : new Date().getHours(); print("Pikakoodi: Tunti suoritettu?  " + !vtila); vtila = (tunti > -1) ? false : true; }
        });
    }
});