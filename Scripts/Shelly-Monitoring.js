// Spot-hinta.fi service is a privately funded service. If you want to support it, you can do it here:
// https://www.buymeacoffee.com/spothintafi  -- Thank you!
  
// This script is used to monitor other script's execution. Restarts the scripts if needed.
// Scripts containing HTTP requests can fail so this script will notice it and restart.
// Also Internet connection can be monitored and Shelly rebooted if connection is lost.

// *****************************
// SETTINGS
// *****************************

let SETTINGS = {
    MonitorScript_1: true,  // True/false, depending if you want to monitor script 1
    MonitoredScript_1: "1", // ID of the script to be monitored
    MonitorScript_2: false,  // True/false, depending if you want to monitor script 2
    MonitoredScript_2: "2", // ID of the other script to be monitored
    MonitorInternetConnection: false,  // True = reboot Shelly if internet connection is lost
    NumberOfFailedRoundsToRebootShelly: 5,  // How many timer rounds will be waited before reboot. 
};

// **************************************
// MAIN SCRIPT - NO NEED TO TOUCH (USUALLY)
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
