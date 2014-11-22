/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var debug_mode = true;

function loadScript(src, callback) {

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = src;
    if (callback) script.onload = callback;
    document.getElementsByTagName("head")[0].appendChild(script);
}

function getreadyicon( item ) {
    if ($(item).data('checked')) {
        return "✓";
    }
    else {
        return "";
    }
}

/*
 * i18n
 * @param {type} callbackFunction
 * @returns {undefined}
 */
function loadBundles(callbackFunction) {
    
    navigator.globalization.getPreferredLanguage(
        function (language) {
            if (debug_mode) {
                console.log("language is " + language.value);
            }
            localStorage.setItem("mytrip_lang", language.value);
            $.i18n.properties({
                name:'Messages', 
                path:'bundle/', 
                mode:'both',
                language: language.value,
                callback: callbackFunction
            });
        },
        function () {
            console.log('Error getting language\n');
            $.i18n.properties({
                name:'Messages', 
                path:'bundle/', 
                mode:'both',
                callback: callbackFunction
            });
        }
    );
}

function addPanel() {
    
    var htmlPanel = 
            "<ul data-role='listview'>" +
            "    <li><h3>JourneyNotes</h3></li>" +
            "    <li data-icon='false'><a href='index.html'><i class='lIcon fa fa-plane'></i>" + $.i18n.prop("trips_header") + "</a></li>" +
            "    <li data-icon='false'><a href='expenses.html'><i class='lIcon fa fa-credit-card'></i>" + $.i18n.prop("expenses_header") + "</a></li>" +
            "    <li data-icon='false'><a href='catalog.html'><i class='lIcon fa fa-suitcase'></i>" + $.i18n.prop("checklist_header") + "</a></li>" +
            "    <li data-icon='false'><a href='settings.html'><i class='lIcon fa fa-gear'></i>" + $.i18n.prop("settings_header") + "</a></li>" +
            "    <li data-icon='false'><a href='userguide.html'><i class='lIcon fa fa-book'></i>" + $.i18n.prop("about_header") + "</a></li>" +
            "    <li data-icon='false'><a href='about.html'><i class='lIcon fa fa-info'></i>" + $.i18n.prop("features_header") + "</a></li>" +
            "    <li data-icon='false'><a href='credits.html'><i class='lIcon fa fa-bookmark'></i>" + $.i18n.prop("credits_header") + "</a></li>" +
            "</ul>";
        
    $('[data-role=panel]').empty().append(htmlPanel).trigger("create");
}

/*
 * openexchangerates.org
 * @returns {undefined}
 */
function loadCurrencies(callback) {

    // Use jQuery.ajax to get the latest exchange rates, with JSONP:
    $.ajax({
        url: 'http://openexchangerates.org/api/latest.json?app_id=' 
                + $.i18n.prop("openexchangerates.id"),
        dataType: 'jsonp',
        beforeSend: function () {
            $.mobile.loading("show", {text: "loading", textVisible: true});
        },
        success: function(json) {
            // Rates are in `json.rates`
            // Base currency (USD) is `json.base`
            // UNIX Timestamp when rates were collected is in `json.timestamp`
            // If you're using money.js, do this:
            persistence.transaction(function(tx) {

                Currency.all().list(null, function (items) {

                    items.forEach(function(item) {
                        persistence.remove(item);
                    });

                    for (var key in json.rates) {
                        var descr = $.i18n.prop(key);
                        if (descr !== "[" + key + "]") {
                            var currency = new Currency({currency: key,
                                    description: descr,
                                    cDate: json.timestamp,
                                    rate: json.rates[key]});
                            persistence.add(currency);
                        }
                    }
                });

                persistence.flush(tx, function(tx) {
                    //...
                    if (callback) {
                        callback();
                    }
                });
            });
        },
        complete: function () {
            $.mobile.loading("hide");
        }
    });
}
                                
// Extend the default Number object with a formatMoney() method:
// usage: someVar.formatMoney(decimalPlaces, symbol, thousandsSeparator, decimalSeparator)
// defaults: (2, "$", ",", ".")
Number.prototype.formatMoney = function(places, symbol, thousand, decimal) {
    places = !isNaN(places = Math.abs(places)) ? places : 2;
    symbol = symbol !== undefined ? symbol : "$";
    thousand = thousand || ",";
    decimal = decimal || ".";
    var number = this, 
        negative = number < 0 ? "-" : "",
        i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
};

/*
 * 
 * @param {type} dString
 * @returns {Date.prototype}
 */
Date.prototype.setISO8601 = function(dString) {
 
    var regexp = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)(:)?(\d\d)(\.\d+)?(Z|([+-])(\d\d)(:)?(\d\d))/;

    if (dString.toString().match(new RegExp(regexp))) {
        var d = dString.match(new RegExp(regexp));
        var offset = 0;

        this.setUTCDate(1);
        this.setUTCFullYear(parseInt(d[1],10));
        this.setUTCMonth(parseInt(d[3],10) - 1);
        this.setUTCDate(parseInt(d[5],10));
        this.setUTCHours(parseInt(d[7],10));
        this.setUTCMinutes(parseInt(d[9],10));
        this.setUTCSeconds(parseInt(d[11],10));
        if (d[12])
            this.setUTCMilliseconds(parseFloat(d[12]) * 1000);
        else
            this.setUTCMilliseconds(0);
        if (d[13] !== 'Z') {
            offset = (d[15] * 60) + parseInt(d[17],10);
            offset *= ((d[14] === '-') ? -1 : 1);
            this.setTime(this.getTime() - offset * 60 * 1000);
        }
    }
    else {
        this.setTime(Date.parse(dString));
    }
    return this;
};

// popup examples
// The window width and height are decreased by 30 to take the tolerance of 15 pixels at each side into account
function scale( width, height, padding, border ) {
    var scrWidth = $( window ).width() - 30,
        scrHeight = $( window ).height() - 30,
        ifrPadding = 2 * padding,
        ifrBorder = 2 * border,
        ifrWidth = width + ifrPadding + ifrBorder,
        ifrHeight = height + ifrPadding + ifrBorder,
        h, w;
    if ( ifrWidth < scrWidth && ifrHeight < scrHeight ) {
        w = ifrWidth;
        h = ifrHeight;
    } else if ( ( ifrWidth / scrWidth ) > ( ifrHeight / scrHeight ) ) {
        w = scrWidth;
        h = ( scrWidth / ifrWidth ) * ifrHeight;
    } else {
        h = scrHeight;
        w = ( scrHeight / ifrHeight ) * ifrWidth;
    }
    return {
        'width': w - ( ifrPadding + ifrBorder ),
        'height': h - ( ifrPadding + ifrBorder )
    };
};

function showWebsite(url) {
    if( navigator.app ) {// Android
        navigator.app.loadUrl( url, {openExternal:true} );
    }
    else {// iOS and others
        window.open( url, "_system" ); // opens in the app, not in safari
    }
};

function goToPage(page, qstring, options) {
    if (options) {
        $.mobile.changePage(page + "?" + qstring, options);    
    }
    else {
        $.mobile.changePage(page + "?" + qstring);    
    }
}

function getDateFromField(dt) {
    if (typeof dt === 'string') {
        return new Date(dt);
    }
    else {
        return dt;
    }
}
