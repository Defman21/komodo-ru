var Cc = Components.classes;
var Ci = Components.interfaces;

var mainWindow = parent.opener.ko.windowManager.getMainWindow();
var prefOld = mainWindow.ko.prefs.getString('preferredLanguage', 'en-US');

var onPrefChanged = { observe: (subject, topic, data) => {
    mainWindow.ko.prefs.prefObserverService.removeObserver(onPrefChanged, "preferredLanguage");

    var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
    var curLocale = "en-US";
    try
    {
        curLocale = prefs.getCharPref("general.useragent.locale");
    }
    catch (e) { }

    var locale = mainWindow.ko.prefs.getString(topic, 'en-US');
    if (locale == curLocale) return;

    prefs.setCharPref("general.useragent.locale", locale);
    var bundle = Cc["@mozilla.org/intl/stringbundle;1"]
                    .getService(Ci.nsIStringBundleService)
                    .createBundle("chrome://ru-locale/locale/language.properties");

    var nb = mainWindow.document.getElementById("komodo-notificationbox");
    var nf = nb.appendNotification(bundle.GetStringFromName("restartRequired"),
                          "locale-restart", null, nb.PRIORITY_INFO_HIGH,
    [
        {
            accessKey: bundle.GetStringFromName("restartKomodo.accessKey"),
            callback: function()
            {
                var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].
                                 createInstance(Ci.nsISupportsPRBool);
                Services.obs.notifyObservers(cancelQuit, "quit-application-requested",
                                             "restart");
                if (cancelQuit.data) return; // somebody canceled our quit request

                var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].
                                 getService(Ci.nsIAppStartup);
                appStartup.quit(Ci.nsIAppStartup.eAttemptQuit |  Ci.nsIAppStartup.eRestart);
            },
            label: bundle.GetStringFromName("restartKomodo")
        },
        {
            accessKey: bundle.GetStringFromName("restartLater.accessKey"),
            callback: nb.removeNotification.bind(nb, nf),
            label: bundle.GetStringFromName("restartLater")
        },
    ]);
}};

mainWindow.ko.prefs.prefObserverService.addObserver(onPrefChanged, "preferredLanguage", false);
