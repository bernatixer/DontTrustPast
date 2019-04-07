var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

// MAIN STACK
// { player: ID, action: 'RECRUIT || ATTACK', units: 15, when: Date.now() }
var actionsFirst = [];
var actionsSecond = [];

// EACH ROUND: initResources + round * multiplyPerRound
var initResources = 20;
var multiplyPerRound = 0;
var roundTime = 1; // IN SECONDS

// HOW MUCH RESOURCES EACH UNIT EAT PER ROUND
var feedAttackUnits = 1;
var feedDefenseUnits = 1;
var feedSpyUnits = 2;
var feedSum = feedAttackUnits + feedDefenseUnits + feedSpyUnits;

// UNIT COSTS
var unitCosts = {
  'attack': { wood: 10, iron: 5 },
  'defense': { wood: 5, iron: 10 },
  'spy': { wood: 10, iron: 10 }
}

// CASTLE LIFE
var firstCastleLife = 30;
var secondCastleLife = 30;

// EMPTY || WAITING || PLAYING
var round = 0;
var gameState = 'EMPTY';

var inWizard = false;

var firstPlayer = {
  wood: 100,
  iron: 100,
  food: 500,
  attack: 10,
  defense: 10,
  spy: 0,
  wizard: 0,
};
var secondPlayer = {
  wood: 100,
  iron: 100,
  food: 500,
  attack: 10,
  defense: 10,
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
  troopsInCastle += feedDefenseUnits*firstPlayer['defense'];
  troopsInCastle += feedSpyUnits*firstPlayer['spy'];
  firstPlayer['food'] -= troopsInCastle;
  if (firstPlayer['food'] < 0) {
    let A = firstPlayer['attack'] * feedAttackUnits/feedSum;
    let B = firstPlayer['defense'] * feedDefenseUnits/feedSum;
    let C = firstPlayer['spy'] * feedSpyUnits/feedSum;
    let X = (A+B+C)/(-firstPlayer['food']);
    firstPlayer['attack'] -= Math.floor((Math.random()*A) + Math.floor(A/2));
    firstPlayer['defense'] -= Math.floor((Math.random()*B) + Math.floor(B/2));
    firstPlayer['spy'] -= Math.floor((Math.random()*C) + Math.floor(C/2));
    firstPlayer['food'] = 0;
  }

  troopsInCastle = 0;
  troopsInCastle += feedAttackUnits*secondPlayer['attack'];
  troopsInCastle += feedDefenseUnits*secondPlayer['defense'];
  troopsInCastle += feedSpyUnits*secondPlayer['spy'];
  secondPlayer['food'] -= troopsInCastle;
  if (secondPlayer['food'] < 0) {
    let A = secondPlayer['attack'] * feedAttackUnits/feedSum;
    let B = secondPlayer['defense'] * feedDefenseUnits/feedSum;
    let C = secondPlayer['spy'] * feedSpyUnits/feedSum;
    let X = (A+B+C)/(-secondPlayer['food']);
    secondPlayer['attack'] -= Math.floor((Math.random()*A) + Math.floor(A/2));
    secondPlayer['defense'] -= Math.floor((Math.random()*B) + Math.floor(B/2));
    secondPlayer['spy'] -= Math.floor((Math.random()*C) + Math.floor(C/2));
    secondPlayer['food'] = 0;
  }
}

function executeRound() {
  if (inWizard) return;
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

  socket.on('wizard', () => {
    inWizard = true;
    console.log('FIRST', actionsFirst);
    console.log('SECOND', actionsSecond);
    if (playerPos === 'first') {
      var startTime;
      for (let i = actionsFirst.length-1; i >= 0; --i) {
        if (actionsFirst[i].action === 'spy') {
          startTime = actionsFirst[i].when;
          firstPlayer = JSON.parse(actionsFirst[i].first);
          secondPlayer = JSON.parse(actionsFirst[i].second);
          firstCastleLife = actionsFirst[i].firstCastleLife;
          secondCastleLife = actionsFirst[i].secondCastleLife;
          actionsFirst = actionsFirst.slice(i+1, actionsFirst.length);
          break;
        }
      }
      let lastTime = actionsFirst[0].when;
      for (let i = actionsSecond.length-1; i >= 0; --i) {
        if (actionsSecond[i].when <= lastTime) {
          actionsSecond = actionsSecond.slice(i, actionsSecond.length);
          break;
        }
      }
      // STACK DESPRÉS DE L'ESPIA
      console.log('------------------------');
      var maxWhen;
      if (actionsFirst.length === 0 && actionsSecond.length != 0) {
        maxWhen = actionsSecond[actionsSecond.length-1].when;
      } else if (actionsSecond.length === 0 && actionsFirst.length != 0) {
        maxWhen = actionsFirst[actionsFirst.length-1].when;
      } else if (actionsFirst[actionsFirst.length-1].when > actionsSecond[actionsSecond.length-1].when) {
        maxWhen = actionsFirst[actionsFirst.length-1].when;
      } else {
        maxWhen = actionsSecond[actionsSecond.length-1].when;
      }

      var actionsCount = actionsFirst.length;
      for (let i = 0; i < actionsCount; ++i) {
        setTimeout(function() {
          console.log(actionsFirst[i]);
          if (actionsFirst[i].action === 'attack') attackSocket({type: actionsFirst[i].type, num: 1});
          if (actionsFirst[i].action === 'recruit') recruitSocket({type: actionsFirst[i].type, num: 1});
          if (actionsFirst[i].when === maxWhen) {
            inWizard = false;
            setTimeout(function() {
              io.emit('leavePast');
              console.log('FINISHED STACK')
            }, 7000);
          }
        }, (actionsFirst[i].when-startTime));
      }
      actionsCount = actionsSecond.length;
      for (let i = 0; i < actionsCount; ++i) {
        setTimeout(function() {
          console.log(actionsSecond[i]);
          if (actionsSecond[i].action === 'attack') attackSocket({type: actionsSecond[i].type, num: 1});
          if (actionsSecond[i].action === 'recruit') recruitSocket({type: actionsSecond[i].type, num: 1});
          if (actionsSecond[i].when === maxWhen) {
            inWizard = false;
            setTimeout(function() {
              io.emit('leavePast');
              console.log('FINISHED STACK')
            }, 7000);
          }
        }, (actionsSecond[i].when-startTime));
      }
    } else if (playerPos === 'second') {
      // TODO: SEGON LLENÇA WIZARD
    }
  });

  function attackSocket(data) {
    if (data.type === 'wizard') {
      io.emit('attack', {attacker: playerPos, data});
      return;
    }
    var unitCost = unitCosts[data.type];
    if (playerPos === 'first') {
      if (firstPlayer[data.type] - 1 >= 0) {
        firstPlayer[data.type] -= 1;
        io.emit('attack', {attacker: 'first', data});
        io.to('first').emit('myStatus', firstPlayer);
        // AFEGIR ACCIÓ
        actionsFirst.push({ action: 'attack', type: data.type, when: Date.now() });
      }
    } else if (playerPos === 'second') {
      if (secondPlayer[data.type] - 1 >= 0) {
        secondPlayer[data.type] -= 1;
        io.emit('attack', {attacker: 'second', data});
        io.to('second').emit('myStatus', secondPlayer);
        // AFEGIR ACCIÓ
        actionsSecond.push({ action: 'attack', type: data.type, when: Date.now() });
      }
    }
  }
  socket.on('attack', attackSocket);

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
          // AFEGIR ACCIÓ
          actionsFirst.push({ action: 'spy', when: Date.now(), first: JSON.stringify(firstPlayer), second: JSON.stringify(secondPlayer), firstCastleLife, secondCastleLife });
        } else {
          secondPlayer['spy'] -= 1;
        }
      } else if (playerPos === 'second') {
        if (firstPlayer['spy'] === 0) {
          secondPlayer['wizard'] = 1;
          // AFEGIR ACCIÓ
          actionsSecond.push({ action: 'spy', when: Date.now(), first: JSON.stringify(firstPlayer), second: JSON.stringify(secondPlayer), firstCastleLife, secondCastleLife });
        } else {
          firstPlayer['spy'] -= 1;
        }
      }
    }
    io.to('first').emit('myStatus', firstPlayer);
    io.to('second').emit('myStatus', secondPlayer);
  });

  function recruitSocket(data) {
    var unitCost = unitCosts[data.type];
    if (playerPos === 'first') {
      if (unitCost['wood']*data.num <= firstPlayer['wood'] && unitCost['iron']*data.num <= firstPlayer['iron']) {
        firstPlayer['wood'] -= unitCost['wood']*data.num;
        firstPlayer['iron'] -= unitCost['iron']*data.num;
        firstPlayer[data.type] += data.num;
        // AFEGIR ACCIÓ
        actionsFirst.push({ action: 'recruit', type: data.type, when: Date.now() });
      }
    } else if (playerPos === 'second') {
      if (unitCost['wood']*data.num <= secondPlayer['wood'] && unitCost['iron']*data.num <= secondPlayer['iron']) {
        secondPlayer['wood'] -= unitCost['wood']*data.num;
        secondPlayer['iron'] -= unitCost['iron']*data.num;
        secondPlayer[data.type] += data.num;
        // AFEGIR ACCIÓ
        actionsSecond.push({ action: 'recruit', type: data.type, when: Date.now() });
      }
    }
  }
  socket.on('recruit', recruitSocket);

});

http.listen(port, () => console.log('DontTrustPast on localhost:' + port));
