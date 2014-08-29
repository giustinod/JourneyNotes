/*
 * Google services
 */               
var folderId;
var calendarId;

/**
 * Called when the client library is loaded.
 */
function handleClientLoad() {
    
    folderId = localStorage.getItem("mytrip_gdrive_folderid");
    if (folderId === null) {
        getMyTripFolder();
    }
    if (debug_mode) {
        console.log("fid: " + folderId);
    }
}

/*
 * 
 * @param {type} callback
 * @returns {undefined}
 */
function getToken(callback) {
    
    var currtime = new Date().getTime();
    var refreshToken = localStorage.getItem("mytrip_google_refresh_token");

    if (currtime < localStorage.getItem("mytrip_google_expires_at")) {
        //The token is still valid, so immediately return it from the cache
        if (debug_mode) {
            console.log("Token still valid: " + localStorage.getItem("mytrip_google_access_token"));
        }
        callback();
    } 
    else if (refreshToken !== null) {
        if (debug_mode) {
            console.log("Token no more valid: " + localStorage.getItem("mytrip_google_access_token"));
        }
        //The token is expired, but we can get a new one with a refresh token
        $.post('https://accounts.google.com/o/oauth2/token', {
            client_id: $.i18n.prop("google.client_id"), // required
            client_secret: $.i18n.prop("google.client_secret"), // required if response_type = 'code'
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        }, function(data) {
            if (debug_mode) {
                console.log("Refresh token response: " + JSON.stringify(data));
            }
            localStorage.setItem("mytrip_google_access_token", data.access_token);
            //Calculate exactly when the token will expire, then subtract
            //one minute to give ourselves a small buffer.
            var now = new Date().getTime();
            var expiresAt = now + parseInt(data.expires_in, 10) * 1000 - 60000;
            localStorage.setItem("mytrip_google_expires_at", expiresAt);
            callback();
        });
    }
}

/*
 * 
 * @returns {undefined}
 */
function revokeAuth() {
    
    if (localStorage.getItem("mytrip_google_access_token") !== null) {

        if (debug_mode) {
            console.log("Revoking access_token: " + localStorage.getItem("mytrip_google_access_token"));
        }
        $.post('https://accounts.google.com/o/oauth2/revoke', {
            token: localStorage.getItem("mytrip_google_access_token")
        }, function(data) {
            if (debug_mode) {
                console.log("Revoke ok response: " + JSON.stringify(data));
            }
            localStorage.removeItem("mytrip_google_access_token");
            localStorage.removeItem("mytrip_google_expires_at");
            localStorage.removeItem("mytrip_google_refresh_token");
        });
    }
}

/**
 * Called when authorization server replies.
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
    
    if (authResult) {
        // Access token has been successfully retrieved, requests can be sent to the API
        try {
            if (buildCalendarList) {
                if (debug_mode) {
                    console.log("Building calendar list");
                }
                buildCalendarList();
                folderId = localStorage.getItem("mytrip_gdrive_folderid");
                if (folderId === null) {
                    if (debug_mode) {
                        console.log("Getting folder");
                    }
                    getMyTripFolder();
                }
            }
        }
        catch (e) {
            if (debug_mode) {
                console.log(e);
            }
        }
        
    } else {
        // No access token could be retrieved, force the authorization flow.
        if (debug_mode) {
            console.log("No access token could be retrieved, force the authorization flow");
        }
    }
}

/*
 * Cordova plugin Google OAuth2 
 * https://software.intel.com/en-us/html5/articles/oauth2-with-intelxdk-cordova-html5
 * @returns {undefined}
 */
function oauth2_login(callback) {

    $.oauth2({
        auth_url: 'https://accounts.google.com/o/oauth2/auth', // required
        response_type: 'code', // required - "code"/"token"
        token_url: 'https://accounts.google.com/o/oauth2/token', // required if response_type = 'code'
        logout_url: 'https://accounts.google.com/logout', // recommended if available
        client_id: jQuery.i18n.prop("google.client_id"), // required
        client_secret: jQuery.i18n.prop("google.client_secret"), // required if response_type = 'code'
        redirect_uri: 'http://localhost:8383/oauth2callback', // required - some dummy url
        other_params: {
            'scope': 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/plus.me',
            'access_type': 'offline'
            //'request_visible_actions': 'http://schemas.google.com/AddActivity'
        }        // optional params object for scope, state, display...
    }, function(token, response){
        // do something with token or response
        localStorage.setItem("mytrip_google_access_token", response.access_token);
        localStorage.setItem("mytrip_google_refresh_token", response.refresh_token);
        //Calculate exactly when the token will expire, then subtract
        //one minute to give ourselves a small buffer.
        var now = new Date().getTime();
        var expiresAt = now + parseInt(response.expires_in, 10) * 1000 - 60000;
        localStorage.setItem("mytrip_google_expires_at", expiresAt);
        if (debug_mode) {
            console.log("Response: " + JSON.stringify(response));
        }
        callback(true);
        
    }, function(error, response){
        // do something with error object
        navigator.notification.alert(
            jQuery.i18n.prop("msg_error", JSON.stringify(error)),
            null, 'JourneyNotes', 'Ok');
        if (debug_mode) {
            console.log("Response: " + JSON.stringify(response));
        }
    }); 
}

/*
 * 
 * @param {type} filename
 * @param {type} content
 * @param {type} fileType
 * @returns {undefined}
 */
function uploadFileGDrive(tripname, filename, content, fileType, cb) {

    var blob = new Blob([content], { type: fileType });
    blob.name = filename;
    if (blob.size > 0) {
        if (fileType.indexOf("image") > -1) {
            if (debug_mode) {
                console.log("calling insertBase64Data");
            }
            insertBase64Data(tripname, filename, content, fileType, cb);
        }
        else {
            if (debug_mode) {
                console.log("calling insertFile");
            }
            insertFile(tripname, blob, cb);
        }
    }
    else {
        navigator.notification.alert(
            jQuery.i18n.prop("msg_nothing_to_export"),
            null, 'JourneyNotes', 'Ok');
    }
}

/*
 * 
 * @param {type} fileData
 * @param {type} callback
 * @returns {undefined}
 */
function insertFile(tripname, fileData, cb) {
    
    boundary = '-------314159265358979323846';
    delimiter = "\r\n--" + boundary + "\r\n";
    close_delim = "\r\n--" + boundary + "--";

    $.mobile.loading("show", {text: "uploading", textVisible: true});
    getToken(function () {                    
        var reader = new FileReader();
        reader.onload = function(e) {
            var contentType = fileData.type || 'application/octet-stream';
            var metadata = {
                'title': fileData.name,
                'mimeType': contentType,
                'parents': [{
                  'kind': 'drive#fileLink',
                  'id': folderId
                }]
            };
            var base64Data = btoa(reader.result);
            var multipartRequestBody =
                delimiter + 'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                base64Data +
                close_delim;
            var request = gapi.client.request({
                'path': '/upload/drive/v2/files?access_token=' + 
                        localStorage.getItem("mytrip_google_access_token"),
                'method': 'POST',
                'params': {'uploadType': 'multipart'},
                'headers': {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody});
            var callback = function(resp) {
                $.mobile.loading("hide");
                if (!resp.error) {
                    if (debug_mode) {
                        console.log("File inserted: " + resp.id + ", size: " + resp.mimeType);
                    }
                    setTimeout(function () {
                        if (fileData.name === "mytrip-localdb.dump" && resp.id !== undefined) {
                            navigator.notification.alert(
                                jQuery.i18n.prop("msg_backup_completed"),
                                null, 'JourneyNotes', 'Ok');
                        }
                        else {
                            if (resp.mimeType === "application/vnd.google-earth.kml+xml" ||
                                    resp.mimeType === "application/vnd.google-earth.kmz") {
                                insertPermission(resp.id, "me", "anyone", "reader");
                                //update Trip, set as exported
                                var url = resp.embedLink;
                                if (typeof resp.embedLink === 'undefined') {
                                    url = resp.alternateLink;
                                }
                                persistence.transaction(function(t) {
                                    Trip.all().filter("name", "=", tripname)
                                        .forEach(function(item) {
                                            if (debug_mode) {
                                                console.log("Exported file at url: " + url);
                                            }
                                            $(item).data('exportUrl', url);
                                    });
                                    persistence.flush(t, function(tx) {
                                        if (typeof tx !== 'undefined' && tx.toString() !== "") {
                                            navigator.notification.alert(
                                                jQuery.i18n.prop("msg_error_generic"),
                                                null, 'JourneyNotes', 'Ok');
                                        }
                                        else {
                                            navigator.notification.alert(
                                                jQuery.i18n.prop("msg_file_exported", fileData.name),
                                                null, 'JourneyNotes', 'Ok');
                                        }
                                    });
                                });
                            }
                            else {
                                navigator.notification.alert(
                                    jQuery.i18n.prop("msg_file_exported", fileData.name),
                                    null, 'JourneyNotes', 'Ok');
                            }
                        }
                    }, 1000);
                } 
                else {
                    navigator.notification.alert(
                        jQuery.i18n.prop("msg_error", resp.error.message),
                        null, 'JourneyNotes', 'Ok');
                }
            };
            request.execute(callback);
        };
        reader.readAsBinaryString(fileData);
    });
}

/*
 * 
 * @param {type} filename
 * @param {type} content
 * @param {type} fileType
 * @param {type} callback
 * @returns {undefined}
 */
function insertBase64Data(tripname, filename, base64Data, fileType, cb) {
    
    boundary = '-------314159265358979323846';
    delimiter = "\r\n--" + boundary + "\r\n";
    close_delim = "\r\n--" + boundary + "--";

    $.mobile.loading("show", {text: "uploading", textVisible: true});
    getToken(function () {                    
        var contentType = fileType || 'application/octet-stream';
        var metadata = {
            'title': filename,
            'mimeType': contentType,
            'parents': [{
              'kind': 'drive#fileLink',
              'id': folderId
            }]
        };
        var multipartRequestBody =
            delimiter + 'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;
        var request = gapi.client.request({
            'path': '/upload/drive/v2/files?access_token=' + 
                    localStorage.getItem("mytrip_google_access_token"),
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody});
        var callback = function(resp) {
            $.mobile.loading("hide");
            if (!resp.error) {
                if (debug_mode) {
                    console.log("File inserted: " + resp.id + ", size: " + resp.mimeType);
                }
                setTimeout(function () {
                    insertPermission(resp.id, "me", "anyone", "reader");
                    //update Trip, set as exported
                    var url = resp.embedLink;
                    if (typeof resp.embedLink === 'undefined') {
                        url = resp.alternateLink;
                    }
                    persistence.transaction(function(t) {
                        PlacePicture.all()
                            .filter("tripname", "=", tripname)
                            .forEach(function(item) {        
                                var pName = $(item).data('pictureUri');
                                if (debug_mode) {
                                    console.log("Saving tripname: " + tripname + ", filename: " + filename + ", pName: " + pName);
                                }
                                if (pName.indexOf(filename.substr(0, filename.lastIndexOf('.'))) > -1) {
                                    if (debug_mode) {
                                        console.log("Exported file " + filename + " at url: " + url);
                                    }
                                    $(item).data('exportUrl', url);
                                }
                        });
                        persistence.flush(t, function(tx) {
                            if (typeof tx !== 'undefined' && tx.toString() !== "") {
                                navigator.notification.alert(
                                    jQuery.i18n.prop("msg_error_generic"),
                                    null, 'JourneyNotes', 'Ok');
                            }
                            else {
                                if (cb) {
                                    cb(url);
                                }
                            }
                        });
                    });
                }, 1000);
            } 
            else {
                navigator.notification.alert(
                    jQuery.i18n.prop("msg_error", resp.error.message),
                    null, 'JourneyNotes', 'Ok');
            }
        };
        request.execute(callback);
    });
}

/**
 * Insert a new permission.
 *
 * @param {String} fileId ID of the file to insert permission for.
 * @param {String} value User or group e-mail address, domain name or
 *                       {@code null} "default" type.
 * @param {String} type The value "user", "group", "domain" or "default".
 * @param {String} role The value "owner", "writer" or "reader".
 */
function insertPermission(fileId, value, type, role) {
    
    var request = gapi.client.request({
        'path': '/drive/v2/files/' + fileId + '/permissions?access_token=' + 
                localStorage.getItem("mytrip_google_access_token"),
        'method': 'POST',
        'body': {'id': value,
            'type': type,
            'role': role }
    }); 
    
    request.execute(function(resp) {
        if (debug_mode) {
            console.log("permission link: " + resp.selfLink);
        }
    });
}

/*
 * 
 * @param {type} fileId
 * @returns {undefined}
 */
function downloadFile(downloadUrl, callback) {

    getToken(function () {                    
        var xhr = new XMLHttpRequest();
        xhr.open('GET', downloadUrl);
        xhr.setRequestHeader('Authorization', 'Bearer ' + 
                localStorage.getItem("mytrip_google_access_token"));
        xhr.onload = function() {
            callback(xhr.responseText);
        };
        xhr.onerror = function() {
            navigator.notification.alert(
                jQuery.i18n.prop("msg_error_generic"),
                null, 'JourneyNotes', 'Ok');
        };
        xhr.send();
    });
}

/*
 * 
 * @param {type} title
 * @param {type} content
 * @param {type} contentType
 * @returns {undefined}
 */
function createSpreadsheetFromContent(title, content, contentType) {  

    boundary = '-------314159265358979323846';
    delimiter = "\r\n--" + boundary + "\r\n";
    close_delim = "\r\n--" + boundary + "--";

    $.mobile.loading("show", {text: "uploading", textVisible: true});
    getToken(function () {                    
        var metadata = {
            'title': title,
            'parents': [{
              'kind': 'drive#fileLink',
              'id': folderId
            }]            
        };
        var multipartRequestBody =
            delimiter + 'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            '\r\n' +
            content +
            close_delim;
        var request = gapi.client.request({
            'path': '/upload/drive/v2/files?access_token=' + 
                    localStorage.getItem("mytrip_google_access_token"),
            'method': 'POST',
            'params': {'uploadType': 'multipart',
                        'convert': 'true'
            },
            'headers': {
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody});
            var callback = function(resp) {
                $.mobile.loading("hide");
                if (!resp.error) {
                    navigator.notification.alert(
                        jQuery.i18n.prop("msg_file_exported", title),
                        null, 'JourneyNotes', 'Ok');
                    if (debug_mode) {
                        console.log(resp);
                    }
                } 
                else {
                    navigator.notification.alert(
                        jQuery.i18n.prop("msg_error", resp.error.message),
                        null, 'JourneyNotes', 'Ok');
                }
        };
        request.execute(callback);
    });
}  
/*
 * 
 * @param {type} pattern
 * @param {type} callback
 * @returns {undefined}
 */
function retrieveFiles(pattern, cb) {

    $.mobile.loading("show", {text: "loading", textVisible: true});
    getToken(function () {                    
        var request = gapi.client.request({
            'path': '/drive/v2/files?access_token=' + localStorage.getItem("mytrip_google_access_token"),
            'method': 'GET',
            'params': {'maxResults': 20,
                       'q': pattern
            }
        });
        var callback = function(resp) {
            $.mobile.loading("hide");
            if (!resp.error) {
                if (debug_mode) {
                    console.log("retrieveFiles ok");                    
                }
                for (var idx in resp.items) {
                    if (debug_mode) {
                        console.log("file: " + resp.items[idx].title);                    
                    }
                };
                if (cb) {
                    cb(resp);
                };
            }
            else {
                navigator.notification.alert(
                    jQuery.i18n.prop("msg_error", resp.error.message),
                    null, 'JourneyNotes', 'Ok');
            }
        };
        request.execute(callback);
    });
}

function getMyTripFolder () {
    
    getToken(function () {                    
        var request = gapi.client.request({
            'path': '/drive/v2/files?access_token=' + 
                    localStorage.getItem("mytrip_google_access_token"),
            'method': 'GET',
            'params': {'maxResults': 1,
                       'q': "title contains 'journeynotes-files' and mimeType = 'application/vnd.google-apps.folder'"
            }
        });
        var callback = function(resp) {

            if (!resp.error) {
                for (var idx in resp.items) {
                    if (resp.items[idx].title !== undefined) {
                        if (debug_mode) {
                            console.log("Folder " + resp.items[idx].title + " found, id: " + resp.items[idx].id); 
                        }
                        folderId = resp.items[idx].id;
                        localStorage.setItem("mytrip_gdrive_folderid", resp.items[idx].id);
                    }
                };
                if (typeof folderId === 'undefined' || folderId === null) {
                    var requestFolder = gapi.client.request({
                        'path': '/drive/v2/files?access_token=' + 
                                localStorage.getItem("mytrip_google_access_token"),
                        'method': 'POST',
                        'contentType': 'application/json',
                        'body': {   "title": "journeynotes-files",
                                    "mimeType": "application/vnd.google-apps.folder"
                        }
                    }); 
                    requestFolder.execute(function(resp) {
                        if (debug_mode) {
                            console.log("New folder id: " + resp.id);
                        }
                        folderId = resp.id;
                        localStorage.setItem("mytrip_gdrive_folderid", resp.id);
                    });
                };
            } 
            else {
                navigator.notification.alert(
                    jQuery.i18n.prop("msg_error", resp.error.message),
                    null, 'JourneyNotes', 'Ok');
            }
        };
        request.execute(callback);
    });
}

/*
 * 
 * @param {type} eventId
 * @returns {undefined}
 */
function deleteEventOnCalendar(eventId) {

    var dfd = $.Deferred();
    getToken(function () {                    
        if (debug_mode) {
            console.log("Delete old event " + eventId);
        }
        var request = gapi.client.request({
            'path': '/calendar/v3/calendars/' + calendarId + '/events/' 
                    + eventId + '?access_token=' + 
                    localStorage.getItem("mytrip_google_access_token"),
            'method': 'DELETE'
        }); 
        var callback = function(resp) {
            if (!resp.error || resp.error.code === 410) {
                if (debug_mode) {
                    console.log("Delete event response: " + resp);
                }
                dfd.resolve();
            }
            else {
                dfd.reject();
                navigator.notification.alert(
                    jQuery.i18n.prop("msg_error", resp.error.message),
                    null, 'JourneyNotes', 'Ok');
            }
        };
        request.execute(callback);
    });
    return dfd.promise();
}

/*
 * 
 * @param {type} place
 * @returns {undefined}
 */
function insertEventOnCalendar(place) {
    
    var dfd = $.Deferred();
    if (debug_mode) {
        console.log("Insert new event " + $(place).data('startDate') + ", " + $(place).data('startDate'));
    }
    var startDate = $(place).data('startDate');
    if (typeof startDate === 'string') {
        startDate = new Date(startDate);
    }
    var endDate = $(place).data('endDate');
    if (typeof endDate === 'string') {
        endDate = new Date(endDate);
    }
    getToken(function () {                    
        var request = gapi.client.request({
            'path': '/calendar/v3/calendars/' + calendarId + '/events?access_token=' + 
                    localStorage.getItem("mytrip_google_access_token"),
            'method': 'POST',
            'body': {'summary': $(place).data('description'),
                    'location': $(place).data('description'),
                    'description': $(place).data('notes'),
                    'start': {
                        'dateTime': startDate.toISOString()
                    },
                    'end': {
                        'dateTime': endDate.toISOString()
                    }
                }
        }); 
        var callback = function(resp) {
            if (!resp.error) {
                persistence.transaction(function(tx) {
                    if (debug_mode) {
                        console.log("event: " + resp.summary + ", id = " + resp.id
                            + ", start: " + resp.start.dateTime + ", end = " + resp.end.dateTime);
                    }
                    $(place).data('eventId', resp.id);
                    persistence.flush(tx, function(tx1) {
                        if (tx1 === undefined || tx1.toString() === "") {
                            //ok
                            dfd.resolve();
                        }
                        else {
                            //ko
                            dfd.reject();
                            if (debug_mode) {
                                console.log(jQuery.i18n.prop("msg_error", tx1.toString()));
                            }
                        }
                    });
                });
            }
            else {
                dfd.reject();
                navigator.notification.alert(
                    jQuery.i18n.prop("msg_error", resp.error.message),
                    null, 'JourneyNotes', 'Ok');
            }
        };
        request.execute(callback);
    });
    return dfd.promise();
}

/*
 * 
 * @param {type} tripname
 * @returns {undefined}
 */
function syncCalendarEvents(tripname) {

    var promises = [];
    calendarId = localStorage.getItem("mytrip_calendar_id");
    if (debug_mode) {
        console.log("Calendar: " + calendarId);
    }
    if (calendarId === null || typeof calendarId === 'undefined') {
        navigator.notification.alert(
            jQuery.i18n.prop("msg_no_calendar_selected"),
            null, 'JourneyNotes', 'Ok');
    }
    else {

        Trip.findBy("name", tripname, function(trip) {

            if ($(trip).data('startDate') === null || $(trip).data('endDate') === null) {
                navigator.notification.alert(
                    jQuery.i18n.prop("msg_missing_desc_or_date"),
                    null, 'JourneyNotes', 'Ok');
            }
            else {
                $.mobile.loading("show", {text: "loading", textVisible: true});
                getToken(function () {                    
                    var request = gapi.client.request({
                        'path': '/calendar/v3/calendars/' + calendarId + '/events?access_token=' + 
                                localStorage.getItem("mytrip_google_access_token"),
                        'method': 'GET',
                        'params': {'timeMin': $(trip).data('startDate').toISOString(),
                                   'timeMax': $(trip).data('endDate').toISOString()
                        }
                    }); 
                    var callback = function(resp) {
                        if (!resp.error) {
                            for (var e in resp.items) {
                                if (typeof resp.items[e].location !== 'undefined') {
                                    var event = resp.items[e];
                                    if (debug_mode) {
                                        console.log("event: " + JSON.stringify(event));
                                    }
                                    promises.push(addEventToPlaces(tripname, event));
                                }
                            }
                            /*
                            console.log("promises: " + promises.length);
                            $.when.apply($, promises).then(addPlacesToCalendar(tripname)); 
                            */
                            TripPlace.all().filter("tripname", "=", tripname).order('startDate', false)
                                .list(null, function (items) {
                                    items.forEach(function(place) {

                                    if (debug_mode) {
                                        console.log("place: " + $(place).data('description') + ", id: " + $(place).data('eventId'));
                                    }
                                    if ($(place).data('eventId') !== null && $(place).data('eventId') !== "") {
                                        var eventId = $(place).data('eventId');
                                        $.when(deleteEventOnCalendar(eventId)).then(
                                            promises.push(insertEventOnCalendar(place))
                                        ); 
                                    }
                                    else {
                                        promises.push(insertEventOnCalendar(place));
                                    }
                                });
                                checkPromisesState(promises, function () {
                                    $.mobile.loading("hide");
                                    setTimeout(function () {
                                        navigator.notification.alert(
                                            jQuery.i18n.prop("msg_places_and_calendar_sync"),
                                            function () {
                                                $.mobile.changePage("itinerary.html?tripname=" + tripname);
                                            }, 
                                            'JourneyNotes', 'Ok');
                                    }, 1000);
                                });
                            });
                        }
                        else {
                            navigator.notification.alert(
                                jQuery.i18n.prop("msg_error", resp.error.message),
                                null, 'JourneyNotes', 'Ok');
                        }
                    };
                    request.execute(callback);
                });
            }
        });
    }
}

/*
 * 
 * @param {type} promises
 * @returns {undefined}
 */
function checkPromisesState(promises, callback) {
    
    if (debug_mode) {
        console.log("promises: " + promises.length);
    }
    for (var i = 0; i < promises.length; i++) {
        var promise = promises[i];
        if (debug_mode) {
            console.log("promise[" + i + "]: " + typeof promise + ", state: " + promise.state());
        }
    }
    var combinedPromise = $.when.apply($, promises); 
    if (debug_mode) {
        console.log("combinedPromise: " + typeof combinedPromise + ", state: " + combinedPromise.state());
    }
    combinedPromise.done(callback()); 
}

/*
 * 
 * @param {type} tripname
 * @param {type} event
 * @returns {undefined}
 */
function addEventToPlaces(tripname, event) {
    
    var dfd = $.Deferred();    
    TripPlace.all().filter("eventId", "=", event.id)
        .filter("updated", ">", Date.parse(event.updated))
        .count(null, function (numOfPlaces) {

            if (debug_mode) {
                console.log("event location: " + event.location + ", id: " + event.id
                    + ", updated: " + event.updated + ", # in db: " + numOfPlaces);
            }
            if (numOfPlaces === 0) {
                
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({'address': event.location}, function(results, status) {

                    if (status === google.maps.GeocoderStatus.OK) {
                        //saving...
                        persistence.transaction(function(tx) {

                            var obj = new TripPlace({tripname: tripname, 
                                description: event.summary,
                                locationx: results[0].geometry.location.lat(),
                                locationy: results[0].geometry.location.lng(),
                                startDate: new Date(event.start.dateTime),
                                endDate: new Date(event.end.dateTime),
                                eventId: event.id,
                                updated: new Date(event.updated),
                                notes: event.description}); 
                            
                            if (debug_mode) {
                                console.log("Adding from calendar: " + JSON.stringify(obj));
                            }
                            persistence.add(obj);

                            persistence.flush(tx, function(tx1) {
                                if (tx1 === undefined || tx1.toString() === "") {
                                    //ok
                                    dfd.resolve();
                                }
                                else {
                                    //ko
                                    if (debug_mode) {
                                        console.log(jQuery.i18n.prop("msg_error", tx1.toString()));
                                    }
                                    dfd.reject();
                                }
                            });
                        });
                    }
                    else {
                        navigator.notification.alert(
                            jQuery.i18n.prop("msg_geocode_error", status),
                            null, 'JourneyNotes', 'Ok');
                        dfd.reject();
                    }
                });
            } 
            else {
                dfd.resolve();
            }
    });
    return dfd.promise();
}

