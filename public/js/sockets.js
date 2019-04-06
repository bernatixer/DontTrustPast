var socket = io();
var id;
var canPlay = false;
var status = {}
socket.on('cantPlay', () => alert('TWO PLAYERS ALREADY PLAYING'));
socket.on('identification', identity => id = identity);
socket.on('startGame', () => canPlay = true);
socket.on('myStatus', (stat) => {
  status = stat;
  document.getElementById('wood').innerHTML = stat.wood;
  document.getElementById('iron').innerHTML = stat.iron;
  document.getElementById('food').innerHTML = stat.food;
  document.getElementById('attack').innerHTML = stat.attack;
  document.getElementById('deffense').innerHTML = stat.deffense;
  document.getElementById('spy').innerHTML = stat.spy;
});
