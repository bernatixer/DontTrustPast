var socket = io();
var id;
var canPlay = false;
socket.on('identification', identity => id = identity);
socket.on('startGame', () => canPlay = true);
socket.on('myStatus', (status) => {
  console.log('UNITS: ', status.attack, status.defense, status.spies);
)};
