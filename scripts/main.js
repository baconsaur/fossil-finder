var dinoGet = $.get('https://paleobiodb.org/data1.2/occs/list.json?base_name=Dinosauria&min_ma=66&taxon_reso=lump_genus&taxon_status=accepted&show=img,coords,class,ecospace,methods');
var mapStyle = $.get('./mapstyles.json');
var input = $('#search')[0];
var heatMapData = [];
var dinoData;
var heatMap;
var markers = [];
var selectedDino = [];
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

var dinoStorage = JSON.parse(localStorage.getItem('selectedDino'));
if(dinoStorage)
  for (var i in dinoStorage)
    selectedDino.push(dinoStorage[i]);

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
  if (selectedDino)
    for (var j in selectedDino)
      setupDino(j);
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
      for (var i in markers)
        markers[i].setMap(null);
      for (var j in selectedDino)
        dinoSelect();
  } else {
    heatmap.setMap(null);
    checkBounds();
  }
}

function checkBounds() {
    var newbounds = map.getBounds();
    if(selectedDino.length === 0){
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
  $('.dino-result').on('mousedown', function() {
    if (selectedDino.length < 3){
      $(input).val('');
      selectedDino.push(this.innerText);
      localStorage.setItem('selectedDino', JSON.stringify(selectedDino));
      setupDino(selectedDino.length - 1);
    }
  });
}

function dinoSelect() {
  for (var i in dinoData) {
    if(selectedDino.length === 0)
      markers[i].setMap(map);
    else {
      markers[i].setMap(null);
      for (var j in selectedDino)
        if (dinoData[i].tna === selectedDino[j])
          markers[i].setMap(map);
    }
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

function indicateSelected(dinosaur) {
  $('.selected-box').append('<div class="dino-indicator"><span class="remove">x</span> <img src="https://paleobiodb.org/data1.2/taxa/thumb.png?id=' + dinosaur.img + '"> <span class="dino-name">' + dinosaur.tna + '</span></div>');
  $('.dino-indicator:last-child>.remove').on('mouseup', function(){
    removeDino($(this).parent()[0]);
  });
}

function setupDino(j) {
  for (var i in dinoData)
    if (selectedDino[j] === dinoData[i].tna){
      indicateSelected(dinoData[i]);
      break;
    }
  $('.selected-box').css('display', 'block');
  dinoSelect();
}

function removeDino(div){
  var removeThis = div.innerText.substring(3,div.innerText.length);
  $(div).remove();
  selectedDino.splice(selectedDino.indexOf(removeThis), 1);
  if (selectedDino.length === 0){
    $('.selected-box').css('display', 'none');
    localStorage.clear();
  } else
    localStorage.setItem('selectedDino', JSON.stringify(selectedDino));
  $(input).val('');
  updateMarkers();
}
