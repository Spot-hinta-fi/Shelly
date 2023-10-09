
// Asetukset
let Pikakoodi = 103;  // Hae sopiva pikakoodi täältä: https://spot-hinta.fi/pikakoodit
let Rele = 0; // Releen numero. Älä vaihda jos Shellyssäsi on vain yksi rele

// Älä muuta allaolevaa koodia. Se suorittaa kyselyn rajapintaan ja ohjaa releen toimintaa.
// Ohjaus tapahtuu kerran tunnissa ensimmäisen puolen minuutin aikana. Virheen tapahtuessa
// rele kytketään päälle.
let cHour = -1; let Executed = false; let pAction = ""; let url = "https://api.spot-hinta.fi/QuickCode/" + Pikakoodi;
print("Skripti käynnistyy...");
Timer.set(30000, true, function () {
    let hour = new Date().getHours();
    if (cHour !== hour) { cHour = hour; Executed = false; print("Skripti käynnistyi tai tunti vaihtui. Suoritetaan ohjaus.") }
    if (cHour == hour && Executed == true) { print("Tämä tunti on jo suoritettu."); return; }
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (result, error_code) {
        if (error_code === 0 && result !== null) {
            if (result.code === 400 || result.code === 200) { print("Onnistunut vastaus palvelimelta: " + result.body); }
            if ((result.code === 400 || result.code === 200) && pAction === result.code) { print("Releen tila säilyy samana kuin edellisellä tunnilla"); Executed = true; return; }
            if (result.code === 400) { Shelly.call("Switch.Set", "{ id:" + Rele + ", on:false}", null, null); pAction = result.code; print("Tunti on liian kallis. Rele otetaan pois päältä."); Executed = true; return; }
            if (result.code === 200) { Shelly.call("Switch.Set", "{ id:" + Rele + ", on:true}", null, null); pAction = result.code; print("Tunti on tarpeeksi halpa. Rele laitetaan päälle."); Executed = true; return; }
        }
        print("Virheellinen vastaus palvelimelta. Koodi: " + result.code + " - Sisältö: " + result.body);
        Shelly.call("Switch.Set", "{ id:" + Rele + ", on:true}", null, null); print("Virhe ohjauksessa, rele kytketään päälle"); pAction = ""; Executed = false;
    })
});