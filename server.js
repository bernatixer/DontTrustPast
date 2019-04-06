var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

// MAIN STACK
// { player: ID, action: 'RECRUIT || ATTACK', units: 15, when: TIMESTAMP }
var actions = [];

// EACH ROUND: initResources + round * multiplyPerRound
var initResources = 20;
var multiplyPerRound = 0;
var roundTime = 1; // IN SECONDS

// HOW MUCH RESOURCES EACH UNIT EAT PER ROUND
var feedAttackUnits = 1;
var feedDeffenseUnits = 1;
var feedSpyUnits = 2;
var feedSum = feedAttackUnits + feedDeffenseUnits + feedSpyUnits;

// UNIT COSTS
var unitCosts = {
  'attack': { wood: 10, iron: 5 },
  'deffense': { wood: 5, iron: 10 },
  'spy': { wood: 10, iron: 10 }
}

// CASTLE LIFE
var firstCastleLife = 30;
var secondCastleLife = 30;

// EMPTY || WAITING || PLAYING
var round = 0;
var gameState = 'EMPTY';

var firstPlayer = {
  wood: 100,
  iron: 100,
  food: 500,
  attack: 10,
  deffense: 10,
  spy: 0,
  wizard: 0,
};
var secondPlayer = {
  wood: 100,
  iron: 100,
  food: 500,
  attack: 10,
  deffense: 10,
  spy: 0,
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
}

function feedUnits() {
  var troopsInCastle = 0;
  troopsInCastle += feedAttackUnits*firstPlayer['attack'];
  troopsInCastle += feedDeffenseUnits*firstPlayer['deffense'];
  troopsInCastle += feedSpyUnits*firstPlayer['spy'];
  firstPlayer['food'] -= troopsInCastle;
  if (firstPlayer['food'] < 0) {
    let A = firstPlayer['attack'] * feedAttackUnits/feedSum;
    let B = firstPlayer['deffense'] * feedDeffenseUnits/feedSum;
    let C = firstPlayer['spy'] * feedSpyUnits/feedSum;
    let X = (A+B+C)/(-firstPlayer['food']);
    firstPlayer['attack'] -= Math.floor((Math.random()*A) + Math.floor(A/2));
    firstPlayer['deffense'] -= Math.floor((Math.random()*B) + Math.floor(B/2));
    firstPlayer['spy'] -= Math.floor((Math.random()*C) + Math.floor(C/2));
    firstPlayer['food'] = 0;
  }

  troopsInCastle = 0;
  troopsInCastle += feedAttackUnits*secondPlayer['attack'];
  troopsInCastle += feedDeffenseUnits*secondPlayer['deffense'];
  troopsInCastle += feedSpyUnits*secondPlayer['spy'];
  secondPlayer['food'] -= troopsInCastle;
  if (secondPlayer['food'] < 0) {
    let A = secondPlayer['attack'] * feedAttackUnits/feedSum;
    let B = secondPlayer['deffense'] * feedDeffenseUnits/feedSum;
    let C = secondPlayer['spy'] * feedSpyUnits/feedSum;
    let X = (A+B+C)/(-secondPlayer['food']);
    secondPlayer['attack'] -= Math.floor((Math.random()*A) + Math.floor(A/2));
    secondPlayer['deffense'] -= Math.floor((Math.random()*B) + Math.floor(B/2));
    secondPlayer['spy'] -= Math.floor((Math.random()*C) + Math.floor(C/2));
    secondPlayer['food'] = 0;
  }
}

function executeRound() {
   incrementResources();
   feedUnits();
   io.to('first').emit('myStatus', firstPlayer);
   io.to('second').emit('myStatus', secondPlayer);
   round += 1;
}
setInterval(executeRound, roundTime*1000);

io.on('connection', function(socket) {
  var playerPos;
  if (gameState === 'EMPTY') {
    console.log('FIRST PLAYER JOINED');
    playerPos = 'first';
    socket.join('first');
    gameState = 'WAITING';
    io.to('first').emit('myStatus', firstPlayer);
    socket.emit('identification', 'first');
  } else if (gameState === 'WAITING') {
    console.log('SECOND PLAYER JOINED');
    playerPos = 'second';
    socket.join('second');
    gameState = 'PLAYING';
    socket.emit('identification', 'second');
    io.to('second').emit('myStatus', secondPlayer);
    io.emit('startGame');
    io.emit('unitCosts', unitCosts);
  } else {
    socket.emit('cantPlay');
  }

  socket.on('attack', data => {
    var unitCost = unitCosts[data.type];
    if (playerPos === 'first') {
      if (firstPlayer[data.type] - 1 >= 0) {
        firstPlayer[data.type] -= 1;
        io.emit('attack', {attacker: 'first', data});
        io.to('first').emit('myStatus', firstPlayer);
        // AFEGIR ACCIÓ
      }
    } else if (playerPos === 'second') {
      if (secondPlayer[data.type] - 1 >= 0) {
        secondPlayer[data.type] -= 1;
        io.emit('attack', {attacker: 'second', data});
        io.to('second').emit('myStatus', secondPlayer);
        // AFEGIR ACCIÓ
      }
    }
  });

  socket.on('attackCastle', type => {
    if (type === 'attack') {
      if (playerPos === 'first') {
        secondCastleLife -= 1;
        if (secondCastleLife <= 0) {
          io.emit('endGame', 'first');
        }
      } else if (playerPos === 'second') {
        firstCastleLife -= 1;
        if (firstCastleLife <= 0) {
          io.emit('endGame', 'second');
        }
      }
    } else if (type === 'spy') {
      if (playerPos === 'first') {
        if (secondPlayer['spy'] === 0) {
          firstPlayer['wizard'] = 1;
        } else {
          secondPlayer['spy'] -= 1;
        }
      } else if (playerPos === 'second') {
        if (firstPlayer['spy'] === 0) {
          secondPlayer['wizard'] = 1;
        } else {
          firstPlayer['spy'] -= 1;
        }
      }
    }
    io.to('first').emit('myStatus', firstPlayer);
    io.to('second').emit('myStatus', secondPlayer);
  });

  socket.on('recruit', data => {
    var unitCost = unitCosts[data.type];
    if (playerPos === 'first') {
      if (unitCost['wood']*data.num <= firstPlayer['wood'] && unitCost['iron']*data.num <= firstPlayer['iron']) {
        firstPlayer['wood'] -= unitCost['wood']*data.num;
        firstPlayer['iron'] -= unitCost['iron']*data.num;
        firstPlayer[data.type] += data.num;
        // AFEGIR ACCIÓ
      }
    } else if (playerPos === 'second') {
      if (unitCost['wood']*data.num <= secondPlayer['wood'] && unitCost['iron']*data.num <= secondPlayer['iron']) {
        secondPlayer['wood'] -= unitCost['wood']*data.num;
        secondPlayer['iron'] -= unitCost['iron']*data.num;
        secondPlayer[data.type] += data.num;
        // AFEGIR ACCIÓ
      }
    }
  });

});

http.listen(port, () => console.log('DontTrustPast on localhost:' + port));
