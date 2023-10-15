
// Asetukset
let Pikakoodi = 103;  // Hae sopiva pikakoodi: https://spot-hinta.fi/pikakoodit
let Rele = 0; // Releen numero. Arvoa ei tarvitse vaihtaa koskaan jos Shelly on yksireleinen.

// Alla olevaa koodia ei tarvitse muokata. Se suorittaa kyselyn rajapintaan ja ohjaa releen toimintaa.
// Ohjaus tapahtuu tunnoin vaihduttua noin puolen minuutin aikana. Virheen tapahtuessa rele suljetaan, eli ohjaus sallitaan.
let cHour = -1; let Executed = false; let pAction = ""; let url = "https://api.spot-hinta.fi/QuickCode/" + Pikakoodi;
print("Skripti suoritetaan...");
Timer.set(30000, true, function () {
    let hour = new Date().getHours();
    if (cHour !== hour) { cHour = hour; Executed = false; print("Ensiohjaus tai tunti vaihtui. Suoritetaan ohjaus.") }
    if (cHour == hour && Executed == true) { print("Kuluva tunti on jo suoritettu onnistuneesti."); return; }
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (result, error_code) {
        if (error_code === 0 && result !== null) {
            if (result.code === 400 || result.code === 200) { print("Onnistunut vastaus palvelimelta: " + result.body); }
            if ((result.code === 400 || result.code === 200) && pAction === result.code) { print("Releen tila pysyy samana kuin aiemmalla tunnilla. Releen tila ei muutu."); Executed = true; return; }
            if (result.code === 400) { Shelly.call("Switch.Set", "{ id:" + Rele + ", on:false}", null, null); pAction = result.code; print("Tunti on liian kallis. Rele avataan."); Executed = true; return; }
            if (result.code === 200) { Shelly.call("Switch.Set", "{ id:" + Rele + ", on:true}", null, null); pAction = result.code; print("Tunti on tarpeeksi halpa. Rele suljetaan."); Executed = true; return; }
        }
        print("Virheellinen vastaus palvelimelta. Koodi: " + result.code + " - Vastaus: " + result.body);
        Shelly.call("Switch.Set", "{ id:" + Rele + ", on:true}", null, null); print("Virhe ohjauksessa, rele suljetaan."); pAction = ""; Executed = false;
    })
});