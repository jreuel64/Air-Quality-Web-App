var app;

var map1;
var map2;

var map1markerLayer;
var map2markerLayer;

var interactionTimer;

var particles;

/* TODO:
    Filters

        select data time range within last 90 days

    Search by location name with nominatim
        update search box name based on map scroll

    Style background color of particle values to match epa air quality index
        legend for colors

    Heatmap visualization when one particle selected

    Allow either map along with input location box to go full screen

*/

/*
    LEFT OFF:
        finished validating dates
        now update loadair data to from the date range 
            if they are null use the defauls 30 days

*/
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
            particleType: [true, true, true, true, true, true, true],
            particleMinValues: [0, 0, 0, 0, 0, 0, 0],
            minDate: null,
            maxDate: null             
        }
    });

    particles = ["pm25", "pm10", "s02", "n02", "o3", "co", "bc"];

    map1 = L.map("map1").setView([app.map1_lat, app.map1_long], 13); //([lat, long], zoom level)
    map2 = L.map("map2").setView([app.map2_lat, app.map2_long], 13);

    map1markerLayer = L.layerGroup().addTo(map1);
    map2markerLayer = L.layerGroup().addTo(map2);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 16,
    minZoom: 10,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoianJldWVsNjQiLCJhIjoiY2p1ZXMzN3A3MDYyYzQ1bW84Ymcyb2kwMyJ9.PDaEm5xuepXw-U8dtvEAvw'
    }).addTo(map1);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 16,
    minZoom: 10,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoianJldWVsNjQiLCJhIjoiY2p1ZXMzN3A3MDYyYzQ1bW84Ymcyb2kwMyJ9.PDaEm5xuepXw-U8dtvEAvw'
    }).addTo(map2);


    map1.on("move", function() {
        //console.log("map1 moved");
        clearTimeout(interactionTimer);
        lat=map1.getCenter().lat;
        long=map1.getCenter().lng;
        //console.log("lat: " + lat + " long: " + long);
        app.map1_lat=lat.toFixed(5);
        app.map1_long=long.toFixed(5);
    });

    map2.on("move", function() {
        //console.log("map1 moved");
        clearTimeout(interactionTimer);
        lat=map2.getCenter().lat;
        long=map2.getCenter().lng;
        //console.log("lat: " + lat + " long: " + long);
        app.map2_lat=lat.toFixed(5);
        app.map2_long=long.toFixed(5);
    });

    map1.on("zoom", function(){
        clearTimeout(interactionTimer);});
    map2.on("zoom", function(){
        clearTimeout(interactionTimer);});

    map1.on("moveend", function(){
        interactionTimer = setTimeout(()=>{loadAirData(1)}, 500);});
    map2.on("moveend", function(){
        interactionTimer = setTimeout(()=>{loadAirData(2)}, 500);});

    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();

    if(dd<10)
    {
        dd='0'+dd
    } 
    if(mm<10)
    {
        mm='0'+mm
    } 

    today = yyyy + '-' + mm + '-' + dd;

    var prevdate = new Date()
    prevdate.setDate(prevdate.getDate() - 90);

    dd = prevdate.getDate();
    mm = prevdate.getMonth() + 1;
    yyyy = prevdate.getFullYear();

    if(dd<10)
    {
        dd='0'+dd
    } 
    if(mm<10)
    {
        mm='0'+mm
    }

    prevdate = yyyy + '-' + mm + '-' + dd;

    $('#mindate').attr('min', prevdate);
    $('#mindate').attr('max', today);
    $('#maxdate').attr('min', prevdate);
    $('#maxdate').attr('max', today);


    loadAirData(1);
    loadAirData(2);
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

    loadAirData(mapNum);
}

function loadAirData(mapNum)
{
    console.log("entered loadAirData");

    updateFilters();

    var center;
    var bounds;
    var corner1;
    var corner2;
    var radius;
    var url;
    var date;

    date = new Date();
    date.setDate(date.getDate() - 30);
    //console.log(date);

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

    //console.log("radius: " + radius);
    //console.log(date);

    url = "https://api.openaq.org/v1/measurements?coordinates=" + center.lat + "," + center.lng + "&radius=" + radius + "&date_from=" + date + "&order_by[]=location&order_by[]=date&sort[]=asc&sort[]=desc&limit=10000";

    console.log(url);

    $.getJSON(url, function(json) {
        populateMarkers(mapNum, json);
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

function populateMarkers(mapNum, json)
{
    console.log("populating Markers");
    console.log(json);
    var table;

    var values = [0, 0, 0, 0, 0, 0, 0];
    var count = [0, 0, 0, 0, 0, 0, 0];

    var particles = ["pm25", "pm10", "s02", "n02", "o3", "co", "bc"];

    if(mapNum == 1)
    {
        table = $("#map1table");
        map1markerLayer.clearLayers();

        //map1markerLayer = L.layerGroup().addTo(map1);
    }
    else
    {
        table = $("#map2table");
        map2markerLayer.clearLayers();

        //map2markerLayer = L.layerGroup().addTo(map2);
    }
    table.empty();

    var row = $("<tr>");
    var h1 = $("<th>").text("Location");
    var h2 = $("<th>").text("Date");
    var h3 = $("<th>").text("Particle");
    var h4 = $("<th>").text("Value");

    row.append(h1);
    row.append(h2);
    row.append(h3);
    row.append(h4);

    table.append(row);

    //for all results
    for(var i = 0; i < json.results.length - 1; ++i)
    {
        var location = json.results[i].location;
        var point = json.results[i].coordinates;

        values = [0, 0, 0, 0, 0, 0, 0];
        count = [0, 0, 0, 0, 0, 0, 0];

        //while at same location
        while(i < json.results.length - 1 && location == json.results[i].location)
        {
            row = $("<tr>");
            var c1 = $("<td>").text(location);

            var measurementDate = new Date(json.results[i].date.local);
            var c2 = $("<td>").text((measurementDate.getMonth()+1) + "-" + measurementDate.getDate() + "-" + measurementDate.getFullYear());
       
            var c3 = $("<td>").text(json.results[i].parameter);

            var c4 = $("<td>").text(json.results[i].value);


            row.append(c1);
            row.append(c2);
            row.append(c3);
            row.append(c4);

            table.append(row);

            for(var j = 0; j < 7; ++j)
            {
                if(json.results[i].parameter == particles[j])
                {   
                    values[j] += json.results[i].value;
                    ++count[j];
                }
            }

            ++i;
        }

        //calculate averages
        for(var j = 0; j < 7; ++j)
        {
            if(count[j] == 0)
            {
                values[j] = "NA";
            }
            else
            {
                values[j] = (values[j] / count[j]).toFixed(2);
            }
        }

        //generate html tooltip string
        var tooltipStr = "";
        for(var j = 0; j < 7; ++j)
        {   

            if(app.particleType[j] && values[j] != "NA" && values[j] >= app.particleMinValues[j])
            {   
                //console.log(values[j] >= app.particleMinValues[j]);
               // console.log(values[j] + " > " + app.particleMinValues[j]);

                tooltipStr = tooltipStr + "</br>" + particles[j] + ": <b>" + values[j] + "</b> &mu; / m^3";
            }
        }

        if(mapNum == 1 && tooltipStr != "")
        {
            marker = L.marker([point.latitude, point.longitude]);
            marker.bindTooltip(location + tooltipStr).openTooltip();
                
            //if meet parameters
            marker.addTo(map1markerLayer);
        }
        else if(tooltipStr != "")
        {
            marker = L.marker([point.latitude, point.longitude]);
            marker.bindTooltip(location + tooltipStr).openTooltip();
              
            //if meet parameters
            marker.addTo(map2markerLayer);
        }
    }
    console.log("Done");
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

function submitFilters()
{
    if(updateFilters())
    {
        loadAirData(1);
        loadAirData(2);
    }
    else
    {
        alert("ERROR: invalid date range");
    }
}

//returns true if all updated and valid else false
function updateFilters()
{
    app.particleMinValues[0] = Number($("#pm25").val());
    app.particleMinValues[1] = Number($("#pm10").val());
    app.particleMinValues[2] = Number($("#so2").val());
    app.particleMinValues[3] = Number($("#no2").val());
    app.particleMinValues[4] = Number($("#o3").val());
    app.particleMinValues[5] = Number($("#co").val());
    app.particleMinValues[6] = Number($("#bc").val());

    //console.log($("#pm25").val());
    //console.log(app.particleMinValues[1]);
    app.minDate = $("#mindate").val();
    app.maxDate = $("#maxdate").val();

    if(validDates() == false)
    {
        return false;
    }

    type = $("#particleType").val();
    if( type != "none")
    {
        for(var i = 0; i < 7; ++i)
        {
            if( type == particles[i])
            {
                app.particleType[i] = true;
            }
            else
            {
                app.particleType[i] = false;
            }
        }
    }
    else
    {
        for(var i = 0; i < 7; ++i)
        {
            app.particleType[i] = true;
        }
    }

    return true;
}

function validDates()
{
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();

    if(dd<10)
    {
        dd='0'+dd
    } 
    if(mm<10)
    {
        mm='0'+mm
    } 

    today = yyyy + '-' + mm + '-' + dd;

    //if both null -> fine
    if(app.minDate == "" && app.maxDate == "")
    {
        console.log("both dates null");
        return true;
    }
    //if one null but the other is not
    else if(app.minDate == "" || app.maxDate == "")
    {
        app.minDate == "";
        app.maxDate == "";
        var nullDate = new Date();
        console.log(nullDate);

        return false;
    }

    //min date large than max date
    if( app.minDate > app.maxDate )
    {
        return false;
    }

    //more than 90 days in the past
    if( (today - app.minDate) > 90 )
    {
        return false;
    }

    //if maxDate is in the future
    console.log("today: " + today + "  max: " + app.maxDate);
    console.log(today < app.maxDate);

    if( today < app.maxDate )
    {
        return false;
    }

    return true;
}