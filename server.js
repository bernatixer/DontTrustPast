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
var multiplyPerRound = 2;

// HOW MUCH RESOURCES EACH UNIT EAT PER ROUND
var feedAttackUnits = 1;
var feedDefenseUnits = 1;
var feedSpyUnits = 2;

var firstPlayer = {
  id: '',
  wood: 200,
  iron: 200,
  food: 500,
  attack: 0,
  defense: 0,
  spies: 0,
  wizard: 0,
};
var secondPlayer = {
  id: '',
  wood: 200,
  iron: 200,
  food: 500,
  attack: 0,
  defense: 0,
  spies: 0,
  wizard: 0,
};

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
    //
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
    firstPlayer = socket.id;
    gameState = 'WAITING';
    io.emit('myStatus', firstPlayer);
    socket.emit('identification', socket.id);
  } else if (gameState === 'WAITING') {
    socket.join('second');
    secondPlayer = socket.id;
    gameState = 'PLAYING';
    socket.emit('identification', socket.id);
    io.emit('myStatus', secondPlayer);
    io.emit('startGame', '');
  }
});

http.listen(port, () => console.log('DontTrustPast on localhost:' + port));
