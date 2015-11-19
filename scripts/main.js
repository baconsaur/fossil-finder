var dinoGet = $.get('https://paleobiodb.org/data1.2/occs/list.json?base_name=Dinosauria&min_ma=66&taxon_reso=lump_genus&taxon_status=accepted&show=img,coords,class,ecospace,methods');
var mapStyle = $.get('./mapstyles.json');
var input = $('#search')[0];
var heatMapData = [];
var dinoData;
var heatMap;
var markers = [];
var infoWindows = [];
var selectedDino;
var map = new google.maps.Map($('#map')[0], {
  center: {lat: 0, lng: 0},
  zoom: 2,
  mapTypeControl: false,
  streetViewControl: false,
  rotateControl: false,
  minZoom: 2,
  maxZoom: 8
});

var searchBox = new google.maps.places.SearchBox(input, {types: ['(regions)']});
map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

mapStyle.done(function(style){
  map.setOptions({styles: style});
});

$(input).on('focus', function(){
  $(this).val('');
  selectedDino = 0;
  updateMarkers();
});

$(input).on('keyup', function(){
  $('.dino-result').remove();
  var inputText = $(this).val();
  if (inputText.length>0)
    dinoMatch(inputText);
});

dinoGet.done(function(data) {
  console.log(data);
  dinoData = data.records;
  formatHeatMap(dinoData);
  heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatMapData,
    radius: 3,
    maxIntensity: 25,
    dissipating: false
  });
  for (var i in dinoData){
    addMarker(dinoData, i);
  }
  updateMarkers();
});

map.addListener('bounds_changed', function() {
  updateMarkers();
});

searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      bounds.extend(place.geometry.location);
      map.fitBounds(bounds);
    });
});

function formatHeatMap(data) {
  for (var i in data)
    heatMapData.push(new google.maps.LatLng(data[i].lat, data[i].lng));
}

function addMarker(dinoData, i) {
  var icon = 'https://paleobiodb.org/data1.2/taxa/icon.png?id=' + dinoData[i].img;
  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(dinoData[i].lat, dinoData[i].lng), icon: icon });

    google.maps.event.addListener(marker, 'click', function() {
      for (var j in infoWindows)
        infoWindows[j].close();
      infoWindows[i].open(map, marker);
    });

  markers.push(marker);
  var info = new google.maps.InfoWindow({
    content: writeInfo(dinoData[i]) });
  infoWindows.push(info);
}

function updateMarkers() {
  if (!checkZoom()) {
      heatmap.setMap(map);
      if(!selectedDino)
        for (var i in markers)
          markers[i].setMap(null);
  } else {
    heatmap.setMap(null);
    checkBounds();
  }
}

function checkBounds() {
    var newbounds = map.getBounds();
    if(!selectedDino){
      for (var i in markers)
        if (newbounds.contains(markers[i].position))
          markers[i].setMap(map);
        else
          markers[i].setMap(null);
    }
}

function dinoMatch(inputText) {
  var dinoResults = [];
  for (var i in dinoData){
    if (dinoData[i].tna.toLowerCase().slice(0, inputText.length).match(inputText)){
      var newHtml = '<img src="https://paleobiodb.org/data1.2/taxa/icon.png?id=' + dinoData[i].img + '"><span class="pac-item-query">' + dinoData[i].tna + '</span>';
      if (dinoResults.indexOf(newHtml) === -1)
        dinoResults.push(newHtml);
    }
  }
  for (var j=0;j<2;j++){
    if(dinoResults[j])
      $('.pac-container').append('<div class="pac-item dino-result">' + dinoResults[j] + '</div>');
  }
  $('.dino-result').on('mousedown', function(event) {
    selectedDino = this.innerText;
    console.log(selectedDino);
    $(input).val(selectedDino);
    dinoSelect();
  });
}

function dinoSelect() {
  var visibleMarker = false;
  var bounds = map.getBounds();
  for (var i in dinoData) {
    if(!selectedDino || dinoData[i].tna === selectedDino){
      markers[i].setMap(map);
      if (bounds.contains(markers[i].position))
        visibleMarker = true;
    } else
      markers[i].setMap(null);
  }
  if(!visibleMarker){
    map.setZoom(2);
    map.setCenter(new google.maps.LatLng(0,0));
  }
}

function checkZoom() {
  if(map.getZoom() < 4)
    return false;
  else {
    return true;
  }
}

function writeInfo(dinosaur) {
  var age = dinosaur.oei.split(' ');
  var museumText = '';
  if (dinosaur.ccu)
    museumText = "</li><li>Museum: " + dinosaur.ccu;
  if (dinosaur.fml)
    familyText = "</li><li>Family: " + dinosaur.fml;
  if (age.length > 1)
    age = age[1];
  else
    age = age[0];
  var infoString = '<div class="info-text"><h1>' +
dinosaur.tna + '</h1> <img src="https://paleobiodb.org/data1.2/taxa/thumb.png?id=' + dinosaur.img + '">' +
'<ul><li>Class: ' + dinosaur.cll +
familyText +
'</li></li>Age: <a href="https://en.wikipedia.org/wiki/' + age + '" target="_blank">' + dinosaur.oei + '</a>' +
'</li><li>Diet: ' + dinosaur.jdt +
museumText +
'</li></ul></div>';

  return infoString;
}
