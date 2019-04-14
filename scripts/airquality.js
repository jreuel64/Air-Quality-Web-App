var app;

var map1;
var map2;

function Init()
{
    app = new Vue({
        el: "#app",
        data: {
            map1_name: "Saint Paul",
            map2_name: "Saint Paul",
            map1_lat: 44.9537,
            map1_long: -93.09, 
            map2_lat: 44.9537,
            map2_long: -93.09,                
        }
    });

    map1 = L.map("map1").setView([app.map1_lat, app.map1_long], 13); //([lat, long], zoom level)
    map2 = L.map("map2").setView([app.map2_lat, app.map2_long], 13);



    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 16,
    minZoom: 8,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoianJldWVsNjQiLCJhIjoiY2p1ZXMzN3A3MDYyYzQ1bW84Ymcyb2kwMyJ9.PDaEm5xuepXw-U8dtvEAvw'
    }).addTo(map1);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 16,
    minZoom: 8,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoianJldWVsNjQiLCJhIjoiY2p1ZXMzN3A3MDYyYzQ1bW84Ymcyb2kwMyJ9.PDaEm5xuepXw-U8dtvEAvw'
    }).addTo(map2);


    map1.on("move", function() {
        //console.log("map1 moved");
        lat=map1.getCenter().lat;
        long=map1.getCenter().lng;
        //console.log("lat: " + lat + " long: " + long);
        app.map1_lat=lat.toFixed(5);
        app.map1_long=long.toFixed(5);

    });

    map2.on("move", function() {
        //console.log("map1 moved");
        lat=map2.getCenter().lat;
        long=map2.getCenter().lng;
        //console.log("lat: " + lat + " long: " + long);
        app.map2_lat=lat.toFixed(5);
        app.map2_long=long.toFixed(5);

    });

    loadAirData(1);

}

function mapSubmitLongLat(mapNum)
{
    console.log("Entered MapSubmitLongLat(mapNum)");
    var lat;
    var long;

    if(mapNum == 1)
    {
        lat = $("#loc1Lat").val();
        long = $("#loc1Long").val();

        console.log("mapnum is 1");
        console.log("lat: " + lat + " long: " + long);

        if(latLongIsValid(lat, long))
        {

            app.map1_lat=lat;
            app.map1_long=long;

            reloadMapView(1);
        }
        else
        {
            alert("ERROR: Latitude or Longitude is out of range.");
            //$("#loc1Lat").val("");
            //$("#loc1Long").val("");
        }
    }
    else
    {
        lat = $("#loc2Lat").val();
        long = $("#loc2Long").val();

        console.log("mapnum is 2");
        console.log("lat: " + lat + " long: " + long);

        if(latLongIsValid(lat, long))
        {
            app.map2_lat = lat;
            app.map2_long = long;

            reloadMapView(2);
        }
        else
        {
            alert("ERROR: Latitude or Longitude is out of range.");
            //$("#loc2Lat").val("");
            //$("#loc2Long").val("");
        }
    }
}

function loadAirData(mapNum)
{
    console.log("entered loadAirData");

    var center;
    var bounds;
    var corner1;
    var corner2;
    var radius;
    var url;

    if(mapNum == 1)
    {
        center = map1.getCenter();
        bounds = map1.getBounds();
    }
    else
    {
        center = map2.getCenter();
        bounds = map2.getBounds();
    }

    corner1 = bounds.getNorthWest();
    corner2 = bounds.getSouthEast();

    //console.log("c1 lat: " + corner1.lat + " c1 long: " + corner1.lng);
    //console.log("c2 lat: " + corner2.lat + " c2 long: " + corner2.lng);

    radius = getRadius(corner1, corner2);

    console.log("radius: " + radius);

    url = "https://api.openaq.org/v1/latest?coordinates=" + center.lat + "," + center.lng + "&radius=" + radius;

    console.log(url);

    $.getJSON(url, function(json) {
        console.log(json);
    });

}

function getRadius(corner1, corner2)
{
    var lat1 = corner1.lat;
    var long1 = corner1.lng;
    var lat2 = corner2.lat;
    var long2 = corner2.lng;

    lat1 = lat1 * Math.PI / 180;
    long1 = long1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;
    long2 = long2 * Math.PI / 180;

    //console.log("lat1: " + lat1 + " long1: " + long1 + " lat2: " + lat2 + " long2: " + long2); 

    var a = Math.pow(Math.sin((lat2 - lat1) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((long2 - long1) / 2), 2);
    var c = 2 * Math.asin(Math.sqrt(a));

    var radius = (6371000 * c) / 2;

    return radius;
}


function latLongIsValid(lat, long)
{
    if(lat > 90 || lat < -90)
    {
        return false;
    }
    if(long > 180 || long < -180)
    {
        return false;
    }

    else{return true;}
}

function reloadMapView(mapNum)
{
    if(mapNum == 1)
    {
        map1.setView([app.map1_lat, app.map1_long]);
    }
    else
    {
        map2.setView([app.map2_lat, app.map2_long]);
    }
}