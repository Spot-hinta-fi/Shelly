// Kiitos tuestasi: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly ohjelmistot: 1.0.3 - 1.4.4. Skriptin versio: 2024-12-29

// OHJE: Anna "pikakoodi" kullekin ohjattavalle releelle. Koodilla 999 voit ohittaa releen.
// Esimerkki 1: Ohjaa releitä 2 ja 3. Aseta pikakoodit näin: [999, 103, 125]
// Esimerkki 2: Ohjaa vain yhtä relettä. Aseta pikakoodi näin: [103]
// Hae sopivat pikakoodit täältä: https://spot-hinta.fi/pikakoodit

// PIKAKOODIT: Aseta tähän parametriin haluamasi pikakoodit
let Pikakoodit = [103];

// SKRIPTI. Älä muokkaa alla olevaa koodia
let rr = 0; let tunti = -1; let vtila = false; let tilat = [null, null, null, null]; print("Pikakoodi: Skripti käynnistyy.");
Timer.set(30000, true, function () {
    if (tunti == new Date().getHours()) { print("Pikakoodi: Odotetaan tunnin vaihtumista."); return; }
    if (rr < Pikakoodit.length) { ExecuteRelay(); return; }
    if (vtila == false) { rr = 0; tunti = new Date().getHours(); return; } else { rr = 0; vtila = false; tunti = -1; return; }
});

function ExecuteRelay() {
    if (Pikakoodit[rr] === 999 || Pikakoodit[rr] === undefined) { rr++; return; }
    Shelly.call("HTTP.GET", { url: "https://api.spot-hinta.fi/QuickCode/" + Pikakoodit[rr], timeout: 10, ssl_ca: "*" }, RunResponse);
}

function RunResponse(res, err) {
    let virhe = (err != 0 || res == null) ? true : false; let tila = (virhe) ? true : false;
    if (!virhe) { tila = (res.code == 400) ? false : true; virhe = (res.code != 200 && res.code != 400) ? true : false; }
    if (virhe) { vtila = true; }
    if (virhe || tila != tilat[rr]) {
        Shelly.call("Switch.Set", "{ id:" + rr + ", on:" + tila + "}", null, null);
        print("Pikakoodi: Rele " + rr + " on kytketty " + (tila ? "päälle" : "pois päältä") + (!virhe ? "." : " (virhetilanne)."));
        if (virhe) { tilat[rr] = null; } else { tilat[rr] = tila; } // Aseta releen tila muistiin
    } else { print("Pikakoodi: Rele " + rr + " tilaa ei muutettu, koska tila on sama kuin edellisellä ohjauksella."); }
    rr++;
}
