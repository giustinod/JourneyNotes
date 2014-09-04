/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var today = "2014-02-01";

var ChecklistCategory = persistence.define('ChecklistCategory', {
  name: "TEXT"
});

ChecklistCategory.index(['name'],{unique:true});

var ChecklistCategoryItem = persistence.define('ChecklistCategoryItem', {
  categoryname: "TEXT",
  description: "TEXT",
  quantity: "INT",
  notes: "TEXT"
});

ChecklistCategoryItem.index(['categoryname', 'description'],{unique:true});

// This defines a many-to-one relationship:
//ChecklistCategoryItem.hasOne('category', ChecklistCategory);

var Trip = persistence.define('Trip', {
    name: "TEXT",
    startDate: "DATE",
    endDate: "DATE",
    exportUrl: "TEXT",
    notes: "TEXT"
});

Trip.index(['name'],{unique:true});

var TripPlace = persistence.define('TripPlace', {
    tripname: "TEXT",
    description: "TEXT",
    locationx: "INT",
    locationy: "INT",
    startDate: "DATE",
    endDate: "DATE",
    toNextPlace: "TEXT",
    eventId: "TEXT",
    updated: "DATE",
    notes: "TEXT"
});

TripPlace.index(['tripname', 'startDate'],{unique:true});

// This defines a one-to-many relationship:
//Trip.hasMany('places', TripPlace, 'tripname');

var PlacePicture = persistence.define('PlacePicture', {
    tripname: "TEXT",
    startDate: "DATE",
    description: "TEXT",
    picture: "TEXT",
    exportUrl: "TEXT",
    selectedImg: "TEXT",
    pictureUri: "TEXT"
});

PlacePicture.index(['tripname', 'startDate', 'picture'],{unique:true});

// This defines a one-to-many relationship:
//TripPlace.hasMany('pictures', PlacePicture, 'startDate');

var TripCategoryItem = persistence.define('TripCategoryItem', {
  tripname: "TEXT",
  categoryname: "TEXT",
  description: "TEXT",
  quantity: "INT",
  checked: "BOOL",
  notes: "TEXT"
});

TripCategoryItem.index(['tripname', 'categoryname', 'description'],{unique:true});

// This defines a one-to-many relationship:
//Trip.hasMany('categoryItems', TripCategoryItem, 'tripname');

var PaymentMethod = persistence.define('PaymentMethod', {
    expcategory: "TEXT"
});

PaymentMethod.index(['expcategory'],{unique:true});

var Currency = persistence.define('Currency', {
    currency: "TEXT",
    description: "TEXT",
    cDate: "DATE",
    rate: "REAL"
});

Currency.index(['currency'],{unique:true});

var TripExpense = persistence.define('TripExpense', {
    tripname: "TEXT",
    place: "TEXT",
    expcategory: "TEXT",
    description: "TEXT",
    eDate: "DATE",
    amount: "REAL",
    notes: "TEXT"
});

TripExpense.index(['tripname', 'expcategory', 'description', 'eDate'],{unique:true});

// This defines a one-to-many relationship:
//Trip.hasMany('expenses', TripExpense, 'tripname');

function initDb() {
    
    if (window.openDatabase) {

        localStorage.setItem("mytrip_max_no_img_per_place", 5);
        
        persistence.store.websql.config(persistence, "mytrip", 'database', 5 * 1024 * 1024);
        
        var b1 = new PaymentMethod({expcategory: $.i18n.prop("pm_cash")});
        var b2 = new PaymentMethod({expcategory: $.i18n.prop("pm_transfer")});
        var b3 = new PaymentMethod({expcategory: "Mastercard"});
        var b4 = new PaymentMethod({expcategory: "VISA"});
        var b5 = new PaymentMethod({expcategory: $.i18n.prop("pm_withdrawal")});

        //Clothes
        var c1 = new ChecklistCategory({name: $.i18n.prop("chk_clothes")});
        var clothes = [];
        clothes.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_clothes"), description: $.i18n.prop("chk_dresses"), quantity: 1}));
        clothes.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_clothes"), description: $.i18n.prop("chk_trousers"), quantity: 1}));
        clothes.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_clothes"), description: $.i18n.prop("chk_shirts"), quantity: 1}));
        clothes.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_clothes"), description: $.i18n.prop("chk_sweaters"), quantity: 1}));
        clothes.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_clothes"), description: $.i18n.prop("chk_jackets"), quantity: 1}));
        clothes.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_clothes"), description: $.i18n.prop("chk_raincoat"), quantity: 1}));
        clothes.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_clothes"), description: $.i18n.prop("chk_pyjamas"), quantity: 1}));
        clothes.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_clothes"), description: $.i18n.prop("chk_socks"), quantity: 1}));
        clothes.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_clothes"), description: $.i18n.prop("chk_slips"), quantity: 1}));
        clothes.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_clothes"), description: $.i18n.prop("chk_shoes"), quantity: 1}));
        clothes.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_clothes"), description: $.i18n.prop("chk_slippers"), quantity: 1}));
        //Hygiene
        var c2 = new ChecklistCategory({name: $.i18n.prop("chk_hygiene")});
        var hygiene = [];
        hygiene.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_hygiene"), description: $.i18n.prop("chk_toothbrush"), quantity: 1}));
        hygiene.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_hygiene"), description: $.i18n.prop("chk_toothpaste"), quantity: 1}));
        hygiene.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_hygiene"), description: $.i18n.prop("chk_shampoo"), quantity: 1}));
        hygiene.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_hygiene"), description: $.i18n.prop("chk_bubblebath"), quantity: 1}));
        hygiene.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_hygiene"), description: $.i18n.prop("chk_shavingfoam"), quantity: 1}));
        hygiene.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_hygiene"), description: $.i18n.prop("chk_razor"), quantity: 1}));
        hygiene.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_hygiene"), description: $.i18n.prop("chk_deodorant"), quantity: 1}));
        //Miscellanea
        var c3 = new ChecklistCategory({name: $.i18n.prop("chk_miscellanea")});
        var misc = [];
        misc.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_miscellanea"), description: $.i18n.prop("chk_electric_adapter"), quantity: 1}));
        misc.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_miscellanea"), description: $.i18n.prop("chk_notepad"), quantity: 1}));
        //Drugs
        var c4 = new ChecklistCategory({name: $.i18n.prop("chk_drugs")});
        var drugs = [];
        drugs.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_drugs"), description: $.i18n.prop("chk_antihistamine"), quantity: 1}));
        drugs.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_drugs"), description: $.i18n.prop("chk_analgesic"), quantity: 1}));
        drugs.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_drugs"), description: $.i18n.prop("chk_antierythema"), quantity: 1}));
        drugs.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_drugs"), description: $.i18n.prop("chk_usual_med"), quantity: 1}));
        //Luggage
        var c5 = new ChecklistCategory({name: $.i18n.prop("chk_luggage")});
        var luggage = [];
        luggage.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_luggage"), description: $.i18n.prop("chk_luggages"), quantity: 1}));
        luggage.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_luggage"), description: $.i18n.prop("chk_padlock"), quantity: 1}));
        luggage.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_luggage"), description: $.i18n.prop("chk_sunglasses"), quantity: 1}));
        luggage.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_luggage"), description: $.i18n.prop("chk_photo"), quantity: 1}));
        luggage.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_luggage"), description: $.i18n.prop("chk_battery_charger"), quantity: 1}));
        luggage.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_luggage"), description: $.i18n.prop("chk_documents"), quantity: 1}));
        luggage.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_luggage"), description: $.i18n.prop("chk_books"), quantity: 1}));
        luggage.push(new ChecklistCategoryItem({categoryname: $.i18n.prop("chk_luggage"), description: $.i18n.prop("chk_bookings"), quantity: 1}));
        
        persistence.schemaSync(function () {

            Currency.all().count(null, function(num_items) {
                if (num_items === 0) {                        
                    loadCurrencies();
                }
            });

            PaymentMethod.all().count(null, function(num_items) {
                if (num_items === 0) {

                    persistence.add(b1);
                    persistence.add(b2);
                    persistence.add(b3);
                    persistence.add(b4);
                    persistence.add(b5);

                    persistence.add(c1);
                    persistence.add(c2);
                    persistence.add(c3);
                    persistence.add(c4);
                    persistence.add(c5);

                    var c;
                    for (c in clothes) {
                        persistence.add(clothes[c]);
                    }
                    for (c in hygiene) {
                        persistence.add(hygiene[c]);
                    }
                    for (c in misc) {
                        persistence.add(misc[c]);
                    }
                    for (c in drugs) {
                        persistence.add(drugs[c]);
                    }
                    for (c in luggage) {
                        persistence.add(luggage[c]);
                    }
                    persistence.flush(null, function(tx) { 
                        if (tx === undefined || tx.toString() === "") {
                            if (debug_mode) {
                                console.log("Database initialized");
                            }
                            $('#trips_header_content').empty().append($.i18n.prop("trips_header"));                    
                            buildTriplist();
                            addPanel();
                            navigator.splashscreen.hide();
                        }
                        else {
                            navigator.notification.alert(
                                'An error occurred initializing local database!',
                                null, 'JourneyNotes', 'Ok');
                        }
                    });

                }
                else {
                    if (debug_mode) {
                        console.log("database already contains data!");
                    }
                    $('#trips_header_content').empty().append($.i18n.prop("trips_header"));                    
                    buildTriplist();
                    addPanel();
                    navigator.splashscreen.hide();
                }
            });
        });
    }
    else
    {
        navigator.notification.alert('WebSQL not supported!', null, 'JourneyNotes', 'Ok');
    }
}
