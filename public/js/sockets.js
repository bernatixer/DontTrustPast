var socket = io();
var id;
var canPlay = false;
var status = {}
socket.on('identification', identity => id = identity);
socket.on('startGame', () => canPlay = true);
socket.on('myStatus', (stat) => status = stat);
