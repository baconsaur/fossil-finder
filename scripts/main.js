var dinoGet = $.get('https://paleobiodb.org/data1.2/occs/list.json?base_name=Dinosauria&show=img,coords');
var mapStyle = $.get('./mapstyles.json');
var heatMapData = [];
var dinoData;
var heatMap;
var markers = [];
var map = new google.maps.Map(document.getElementById('map'), {
  center: {lat: 0, lng: 0},
  zoom: 2,
  mapTypeControl: false,
  streetViewControl: false,
  rotateControl: false,
  minZoom: 2,
  maxZoom: 10
});

mapStyle.done(function(style){
  map.setOptions({styles: style});
});

dinoGet.done(function(data) {
  dinoData = data.records;
  formatHeatMap(dinoData);
  heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatMapData
  });
  for (var i in dinoData){
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(dinoData[i].lat, dinoData[i].lng)});
      markers.push(marker);
  }
  updateMarkers();
});

map.addListener('bounds_changed', function() {
  updateMarkers(map.getZoom());
});

function formatHeatMap(data) {
  for (var i in data)
    heatMapData.push(new google.maps.LatLng(data[i].lat, data[i].lng));
}

function updateMarkers(zoom) {
  if (!zoom || zoom < 5) {
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
