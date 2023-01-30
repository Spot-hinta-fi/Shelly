/* More information about the API's (in Finnish): https://spot-hinta.fi/
 * Support API development and maintenance: https://www.buymeacoffee.com/spothintafi
 * 
 * This script ise used to monitor other script execution and when needed restarts the scripts.
 * Scripts that do HTTP requests can sometimes fail, but this script will notice it and restart.
 * Also Internet connection can be monitored and Shelly rebooted if connection is lost. */

// *****************************
// SETTINGS - Change when needed
// *****************************

let SETTINGS = {
    MonitorScript_1: true,  // Change value to true/false, depending if you want to monitor script 1
    MonitoredScript_1: "1", // Define here the ID of the script to be monitored
    MonitorScript_2: false,  // Change value to true/false, depending if you want to monitor script 2
    MonitoredScript_2: "2", // Define here the ID of the script to be monitored
    MonitorInternetConnection: false,  // Set this true, if you want to reboot shelly when Internet connection is lost
    NumberOfFailedRoundsToRebootShelly: 5,  // How many timer rounds are waited before reboot happens.
};

// **************************************
// MAIN SCRIPT - NO NEED TO TOUCH USUALLY
// **************************************

// Default timer round is 60 seconds
Timer.set(60000, true, function (ud) {
    MonitorScriptExecution();
    MonitorInternetConnection();
}, null); 


function MonitorScriptExecution()
{
    // Monitoring script 1
    if (SETTINGS.MonitorScript_1 === true)
    {
        print("Monitoring script 1 execution, script ID to monitor: " + SETTINGS.MonitoredScript_1);

        Shelly.call("Script.GetStatus", { id: SETTINGS.MonitoredScript_1 }, function (res)
        {
            if (res.running === true)
            {
                print("Monitored script 1 is running. All good.");
            }
            else
            {
                print("Script 1 is not running. Starting the script.");
                Shelly.call("Script.Start", { id: SETTINGS.MonitoredScript_1 }, null, null);
                Shelly.call("Script.SetConfig", { id: SETTINGS.MonitoredScript_1, config: {enable:true}}, null, null);
            }
        }, null);
    }

    // Monitoring script 2
    if (SETTINGS.MonitorScript_2 === true)
    {
        print("Monitoring script 2 execution, script ID to monitor: " + SETTINGS.MonitoredScript_2);

        Shelly.call("Script.GetStatus", { id: SETTINGS.MonitoredScript_2 }, function (res)
        {
            if (res.running === true)
            {
                print("Monitored script 2 is running. All good.");
            }
            else
            {
                print("Script 2 is not running. Starting the script.");
                Shelly.call("Script.Start", { id: SETTINGS.MonitoredScript_2 }, null, null);
                Shelly.call("Script.SetConfig", { id: SETTINGS.MonitoredScript_2, config: {enable:true}}, null, null);
            }
        }, null);
    }
}

// Monitor Internet Connection
let failedRounds = 0;
function MonitorInternetConnection()
{
    if (SETTINGS.MonitorInternetConnection === false) {
        return;
    }

    Shelly.call("Shelly.GetStatus", "", function (res)
    {

        // TODO: are there better ways to check the Internet connection?
        if (res.wifi.status === "got ip" && res.cloud.connected === true)
        {
            failedRounds = 0;
            print("Internet connection is working and connected to the Shelly cloud");
            return;
        }

        failedRounds += 1;
        print("Internet connection is NOT working. Failed rounds now:");
        print(failedRounds);

        if (failedRounds >= SETTINGS.NumberOfFailedRoundsToRebootShelly)
        {
            failedRounds = 0;
            print("Rebooting Shelly because Internet connection does not work!");
            Shelly.call("Shelly.Reboot");
        }
    }, null);
}
