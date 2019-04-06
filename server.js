var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

// EMPTY || WAITING || PLAYING
var round = 0;
var gameState = 'EMPTY';

// EACH ROUND: initResources + round * multiplyPerRound
var initResources = 10;
var multiplyPerRound = 1;

// HOW MUCH RESOURCES EACH UNIT EAT PER ROUND
var feedAttackUnits = 1;
var feedDefenseUnits = 1;
var feedSpyUnits = 2;
var feedSum = feedAttackUnits + feedDefenseUnits + feedSpyUnits;

// STARTING CONSTANTS
var startState = {
  id: '',
  wood: 200,
  iron: 200,
  food: 100,
  attack: 10,
  defense: 10,
  spies: 100,
  wizard: 0,
};

var firstPlayer = startState;
var secondPlayer = startState;

app.use(express.static('public'))
app.get('/', (req, res) => res.send('OK'));

function incrementResources() {
  firstPlayer['wood'] += initResources + round*multiplyPerRound;
  firstPlayer['iron'] += initResources + round*multiplyPerRound;
  firstPlayer['food'] += initResources + round*multiplyPerRound;

  secondPlayer['wood'] += initResources + round*multiplyPerRound;
  secondPlayer['iron'] += initResources + round*multiplyPerRound;
  secondPlayer['food'] += initResources + round*multiplyPerRound;

  feedUnits();
}

function feedUnits() {
  var troopsInCastle = 0;
  troopsInCastle += feedAttackUnits*firstPlayer['attack'];
  troopsInCastle += feedDefenseUnits*firstPlayer['defense'];
  troopsInCastle += feedSpyUnits*firstPlayer['spies'];
  firstPlayer['food'] -= troopsInCastle;
  if (firstPlayer['food'] < 0) {
    let A = firstPlayer['attack'] * feedAttackUnits/feedSum;
    let B = firstPlayer['defense'] * feedDefenseUnits/feedSum;
    let C = firstPlayer['spies'] * feedSpyUnits/feedSum;
    let X = (A+B+C)/(-firstPlayer['food']);
    firstPlayer['attack'] -= Math.floor((Math.random()*A) + Math.floor(A/2));
    firstPlayer['defense'] -= Math.floor((Math.random()*B) + Math.floor(B/2));
    firstPlayer['spies'] -= Math.floor((Math.random()*C) + Math.floor(C/2));
    firstPlayer['food'] = 0;
  }
}

function executeRound() {
   incrementResources();
   io.to('first').emit('myStatus', firstPlayer);
   io.to('second').emit('myStatus', secondPlayer);
   round += 1;
}
setInterval(executeRound, 5*1000);

io.on('connection', function(socket) {
  if (gameState === 'EMPTY') {
    socket.join('first');
    firstPlayer['id'] = socket.id;
    gameState = 'WAITING';
    io.emit('myStatus', firstPlayer);
    socket.emit('identification', socket.id);
  } else if (gameState === 'WAITING') {
    socket.join('second');
    secondPlayer['id'] = socket.id;
    gameState = 'PLAYING';
    socket.emit('identification', socket.id);
    io.emit('myStatus', secondPlayer);
    io.emit('startGame', '');
  }
});

http.listen(port, () => console.log('DontTrustPast on localhost:' + port));
