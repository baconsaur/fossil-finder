var dinoGet = $.get('https://paleobiodb.org/data1.2/occs/list.json?base_name=Dinosauria&min_ma=66&taxon_reso=lump_genus&taxon_status=accepted&show=img,coords');
var mapStyle = $.get('./mapstyles.json');
var input = $('#search')[0];
var heatMapData = [];
var dinoData;
var heatMap;
var markers = [];
var infoWindows = [];
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
  updateMarkers(map.getZoom());
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
    content: dinoData[i].tna });
  infoWindows.push(info);
}

function updateMarkers(zoom) {
  if (!zoom || zoom < 4) {
      heatmap.setMap(map);
      for (var i in markers)
        markers[i].setMap(null);
  } else {
    heatmap.setMap(null);
    checkBounds();
  }
}

function checkBounds() {
    var newbounds = map.getBounds();
    for (var i in markers)
      if (newbounds.contains(markers[i].position))
          markers[i].setMap(map);
      else
        markers[i].setMap(null);
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
    var dinoText = event.target.innerText;
    $(input).val(dinoText);
    dinoSelect(dinoText);
  });
}

function dinoSelect(dino) {
  console.log(dino);
}
