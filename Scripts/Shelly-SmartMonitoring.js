// Thank you for your support: https://www.buymeacoffee.com/spothintafi
// Supported Shelly firmwares: 1.0.3 - 1.4.4. Script version: 2024-12-29

// Common settings
const Region = "FI"; // Supported regions: DK1, DK2, EE, FI, LT, LV, NO1, NO2, NO3, NO4, NO5, SE1, SE2, SE3, SE4
const ShellyName = "My Shelly";  // Name of this Shelly
const DebugLogs = true; // Set this to true, if you want to see also positive messages (not only errors) in the Shelly log.

// Activate relay status change history. 
// Note! You get a valid key when you get this script through Shelly library (Library url: https://api.spot-hinta.fi/Shelly/scripts)
const UploadRelayChangesToCloud = true;  // Set this to false, if you don't want to save history of relay changes to spot-hinta.fi cloud
const PrivateKey = "<SHF-PrivateKey>";  // Your private monitoring URL is: https://api.spot-hinta.fi/SmartMonitoring?PrivateKey=<SHF-PrivateKey>
const RelayNames = ["Relay A", "Relay B", "Relay C", "Relay D"]; // Names of the relays. Sorry, automatic loading of relay names is not possible yet in script.

// Activate Internet connection monitoring if required.
const MonitorInternetConnection = true; // Set this to false, if you don't want to monitor Internet connection.
const RebootShellyInMinutes = 60; // If Internet connection is not working, reboot Shelly after this number of minutes

// Activate script monitoring if required
const MonitorScripts = true; // Set this to false, if you don't want to monitor script executions
const MonitoredScripts = [1]; // List here script ID's which you want to monitor. For example [1,2]. Script numbering starts from 1.


// Script starts here. Do not edit this until you really know what you are doing!
print("SmartMonitoring: Script is starting....");
let roundRobin = 0;
Timer.set(30000, true, function () {
    if (roundRobin == 0) { CollectRelayStatusChanges(); roundRobin = 1; return; }
    if (roundRobin == 1) { UploadRelayStatusChanges(); roundRobin = 2; return; }
    if (roundRobin == 2) { CheckScriptsExecution(); roundRobin = 3; return; }
    if (roundRobin == 3) { TestInternetConnection(); roundRobin = 0; return; }
});

// Collect relay status changes
let relayLastStatus = []; let relayStatusUpdates = []; let RelayNumbersToMonitor = [0, 1, 2, 3, 100];
function CollectRelayStatusChanges() {
    if (UploadRelayChangesToCloud === false) { return; }
    if (DebugLogs === true) { print("SmartMonitoring: Checking for changes in relay statuses...") };

    for (i in RelayNumbersToMonitor) {
        if (RelayNumbersToMonitor[i] === null) { continue; }
        let relayNumber = RelayNumbersToMonitor[i];
        let relayName = "Relay: " + i; if (RelayNames[i] !== null) { relayName = RelayNames[i]; };
        CheckRelayStatus(i, relayNumber, relayName);
    }
}

function CheckRelayStatus(i, relayNumber, relayName) {
    Shelly.call("Switch.GetStatus", { id: relayNumber }, function (res) {
        if (res === undefined) { delete RelayNumbersToMonitor[i]; }
        else {
            if (relayLastStatus[relayNumber] === res.output) { return; }
            relayLastStatus[relayNumber] = res.output; // Save current status of the relay
            relayStatusUpdates.push({ ShellyName: ShellyName, PrivateKey: PrivateKey, TimeStampUtc: Date().toISOString(), RelayNumber: relayNumber, RelayName: relayName, RelayIsActiveNow: res.output });
        }
    }, i, relayNumber, relayName);
}

function UploadRelayStatusChanges() {
    if (relayStatusUpdates.length == 0) { if (DebugLogs === true) { print("SmartMonitoring: No relay status changes to upload."); } return; }
    if (DebugLogs === true) { print("SmartMonitoring: Upload relay status changes."); }
    Shelly.call("HTTP.POST", { url: "https://api.spot-hinta.fi/SmartMonitoring?region=" + Region, body: relayStatusUpdates, timeout: 10, ssl_ca: "*" }, RunRelayStatusUpdateResponse);
}

function RunRelayStatusUpdateResponse(result, error_code) {

    if (error_code === 0 && result !== null) {
        if (result.code === 200) { relayStatusUpdates = []; if (DebugLogs === true) { print("SmartMonitoring: Relay updates were uploaded succesfully."); } return; }
        else if (result.code === 401) { print("SmartMonitoring: PrivateKey is not accepted. Download this script using Shelly library (library url: https://api.spot-hinta.fi/shelly/scripts)"); return; }
        else if (result.code === 400) { print("SmartMonitoring: Problem with uploading the data. Please update the script."); }
        else { print("SmartMonitoring: Error while uploading relay status changes to server. HTTP error code: " + result.code + " - Number of changes not uploaded: " + relayStatusUpdates.length); }
    }
    else { print("SmartMonitoring: Failed to upload status changes. Number of status changes to be uploaded: " + relayStatusUpdates.length); }
}

// Check script executions
let lastScriptCheck = new Date();
function CheckScriptsExecution() {
    if (MonitorScripts === false || new Date().getMinutes() === lastScriptCheck.getMinutes()) { return; }
    else {
        lastScriptCheck = new Date(); if (DebugLogs === true) { print("SmartMonitoring: Script monitoring started..."); }
        for (let i = 0; i < MonitoredScripts.length; i++) { VerifyScriptStatus(MonitoredScripts[i]); }
    }
}

function VerifyScriptStatus(script) {
    Shelly.call("Script.GetStatus", { id: script }, function (res) {
        if (res === undefined) { print("SmartMonitoring: Script number is invalid/script not found: " + script); return; }
        else if (res.running === true) {
            if (DebugLogs === true) { print("SmartMonitoring: Monitored script " + script + " is running. All good."); }
            return;
        }
        else {
            print("SmartMonitoring: Monitored script " + script + " is NOT running. Starting the script.");
            Shelly.call("Script.Start", { id: script }, null, null);
            Shelly.call("Script.SetConfig", { id: script, config: { enable: true } }, null, null);
        }
    }, script);
}

// Internet connection test
let lastInternetCheck = new Date();
function TestInternetConnection() {
    if (MonitorInternetConnection === false || new Date().getMinutes() === lastInternetCheck.getMinutes()) { return; }

    lastInternetCheck = new Date();
    if (DebugLogs === true) { print("SmartMonitoring: Testing Internet connection..."); }

    // This is hosted in Azure Functions (Ireland) with 99,95% SLA promise
    Shelly.call("HTTP.GET", { url: "https://api.spot-hinta.fi/ping", timeout: 10, ssl_ca: "*" }, function (result, error_code) {
        if (result === null || error_code !== 0) { TestInternetConnectionResult(false); return; }
        if (result !== null && result.code === 200) { TestInternetConnectionResult(true); return; }
        else { TestInternetConnectionResult(false); return; }
    });
}

let minutesFailed = 0;
function TestInternetConnectionResult(result) {
    if (result === true) { if (DebugLogs === true) { print("SmartMonitoring: Internet connection is OK"); } minutesFailed = 0; return; }

    minutesFailed = minutesFailed + 1;
    print("SmartMonitoring: Internet connection has failed now " + minutesFailed + " minutes. Reboot will happen after " + RebootShellyInMinutes + " minutes.");
    if (minutesFailed > RebootShellyInMinutes) { Shelly.call("Shelly.Reboot"); }
}