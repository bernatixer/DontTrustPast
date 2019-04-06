var socket = io();
var id;
var unitCosts = {};
var canPlay = false;
var status = {};
socket.on('cantPlay', () => message('Two players already playing'));
socket.on('identification', identity => id = identity);
socket.on('startGame', () => canPlay = true);
socket.on('unitCosts', function(costs) {
  unitCosts = JSON.stringify(costs);
});
socket.on('myStatus', function(stat) {
  status = JSON.stringify(stat);
  document.getElementById('wood').innerHTML = stat.wood;
  document.getElementById('iron').innerHTML = stat.iron;
  document.getElementById('food').innerHTML = stat.food;
  document.getElementById('attack').innerHTML = stat.attack;
  document.getElementById('deffense').innerHTML = stat.deffense;
  document.getElementById('spies').innerHTML = stat.spy;
});
socket.on('attack', function(data) {
  console.log(data);
});
