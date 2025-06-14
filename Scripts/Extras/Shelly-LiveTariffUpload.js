/* Jos haluat tukea spot-hinta.fi palvelua: www.buymeacoffee.com/spothintafi
   Tuetut Shelly ohjelmistot: 1.4.4 - 1.6.2. Skriptin versio: 2025-06-02 */

// Asetukset
const ApiUrl = ""; // Shelly Control sivustolta haettu Live Tariff osoite (https://shelly...)
const PriceNight = 0.0112; // Siirtohinta y�aikaan euroina, sis�lt�en ALV:n (oletus: Caruna Espoo y�siirto)
const PriceDay = 0.0255;   // Siirtohinta p�iv�aikaan euroina, sis�lt�en ALV:n (oletus: Caruna Espoo p�iv�siirto)
const Margin = 0.00456;    // P�rssis�hk�n myyj�n ottama toimitusmaksu/marginaali, sis�lt�en ALV:n (oletus: PKS Priima) 
const Tax = 0.02827515;    // S�hk�vero, sis�lt�en ALV:n. Muuta vain jos laki muuttuu (oletus: vero Suomessa)
const Area = "FI";         // Alue jolle hinta haetaan FI, SEx, NOx, DKx, EE, LV, LT. Hinta on aina euroina.

// Scripti
let minNow = 0; let minDone = -1; let tra = 0; let started = true; const uMins = [0, 15, 30, 45]; const fName = "LiveTariffUpload";
const nHours = [22, 23, 0, 1, 2, 3, 4, 5, 6]; const pUrl = "https://api.spot-hinta.fi/JustNowPrice?region=" + Area;
print(fName + ": Skripti k�ynnistyi. Ensimm�inen hintojen l�hetys tehd��n 15 sekunnin kuluttua.");
Timer.set(15000, true, function () {
    minNow = new Date().getMinutes(); tra = (nHours.indexOf(new Date().getHours()) > -1) ? PriceNight : PriceDay;
    if (minNow === minDone) { return; } else { minDone = minNow; }
    if (uMins.indexOf(minNow) > -1 || started) {
        started = false;
        Shelly.call("HTTP.GET", { url: pUrl, timeout: 5, ssl_ca: "*" }, function (res, err) {
            if (err != 0 || res == null || res.code !== 200) { print(fName + ": Hinnan haku ep�onnistui."); return; }
            let bodyText = JSON.stringify({ price: (res.body * 1) + (tra + Tax + Margin) });
            Shelly.call("HTTP.POST", { url: ApiUrl, body: bodyText, timeout: 5, ssl_ca: "*" }, function (res, err, errMsg) {
                if (err !== 0) { print(fName + ": Virhe l�hetyksess�:", errMsg); }
                else { print(fName + ": Hinta l�hetetty: " + res.body); }
            });
        });
    } else { print(fName + ": Odotetaan seuraavaa hintatietojen l�hetysaikaa."); }
});