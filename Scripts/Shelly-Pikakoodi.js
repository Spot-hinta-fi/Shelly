// Kiitos tuestasi: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly ohjelmistot: 1.0.3 - 1.2.0. Skriptin versio: 2024-02-17

// OHJE: Anna "pikakoodi" kullekin ohjattavalle releelle. Koodilla 999 voit ohittaa releen.
// Esimerkki 1: Ohjaa releitä 2 ja 3. Aseta pikakoodit näin: [999, 103, 125]
// Esimerkki 2: Ohjaa vain yhtä relettä. Aseta pikakoodi näin: [103]
// Hae sopivat pikakoodit täältä: https://spot-hinta.fi/pikakoodit

// PIKAKOODIT: Aseta tähän parametriin haluamasi pikakoodit
let Pikakoodit = [103]; 

// SKRIPTI. Älä muokkaa alla olevaa koodia
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