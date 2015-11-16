var map = new google.maps.Map(document.getElementById('map'), {
  center: {lat: 0, lng: 0},
  zoom: 2
});
var heatMapData = [];

$.get('https://paleobiodb.org/data1.2/occs/list.json?base_name=Dinosauria&show=img,coords', function(data) {

  formatHeatMap(data.records);

  var heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatMapData
  });
  heatmap.setMap(map);
});

function formatHeatMap(data) {
  for (var i in data)
    heatMapData.push(new google.maps.LatLng(data[i].lat, data[i].lng));
}
