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
var initResources = 5;
var multiplyPerRound = 0.1;
var roundTime = 1; // IN SECONDS

// HOW MUCH RESOURCES EACH UNIT EAT PER ROUND
var feedAttackUnits = 1;
var feedDefenseUnits = 1;
var feedSpyUnits = 2;
var feedSum = feedAttackUnits + feedDefenseUnits + feedSpyUnits;

// UNIT COSTS
var unitCosts = {
  'attack': { wood: 20, iron: 10 },
  'defense': { wood: 10, iron: 20 },
  'spy': { wood: 20, iron: 20 }
}

// CASTLE LIFE
var firstCastleLife = 30;
var secondCastleLife = 30;

// EMPTY || WAITING || PLAYING
var round = 0;
var wizardRound = 0;
var gameState = 'EMPTY';

var inWizard = false;
var poisoned = '';

var firstPlayer = {
  wood: 10,
  iron: 10,
  food: 1500,
  attack: 10,
  defense: 10,
  spy: 0,
  wizard: 0,
};
var secondPlayer = {
  wood: 10,
  iron: 10,
  food: 1500,
  attack: 10,
  defense: 10,
  spy: 0,
  wizard: 0,
};

app.use(express.static('public'))
app.get('/', (req, res) => res.send('OK'));

function incrementResources() {
  var currRound = round;
  var wizardDamageFirst = 1;
  var wizardDamageSecond = 1;
  if (inWizard) {
    currRound = wizardRound;
    if (poisoned === 'first') wizardDamageFirst = 0;
    if (poisoned === 'second') wizardDamageSecond = 0;
  }
  firstPlayer['wood'] += (initResources + currRound*multiplyPerRound) * wizardDamageFirst;
  firstPlayer['iron'] += (initResources + currRound*multiplyPerRound) * wizardDamageFirst;
  firstPlayer['food'] += (initResources + currRound*multiplyPerRound);

  secondPlayer['wood'] += (initResources + currRound*multiplyPerRound) * wizardDamageSecond;
  secondPlayer['iron'] += (initResources + currRound*multiplyPerRound) * wizardDamageSecond;
  secondPlayer['food'] += (initResources + currRound*multiplyPerRound);
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
  incrementResources();
  feedUnits();
  io.to('first').emit('myStatus', firstPlayer);
  io.to('second').emit('myStatus', secondPlayer);
  round += 1;
  wizardRound += 1;
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
    console.log(actionsFirst, actionsSecond);
    inWizard = true;
    if (playerPos === 'first') {
      poisoned = 'second';
      var startTime;
      for (let i = actionsFirst.length-1; i >= 0; --i) {
        if (actionsFirst[i].action === 'spy') {
          startTime = actionsFirst[i].when;
          firstPlayer = JSON.parse(actionsFirst[i].first);
          secondPlayer = JSON.parse(actionsFirst[i].second);
          firstCastleLife = actionsFirst[i].firstCastleLife;
          secondCastleLife = actionsFirst[i].secondCastleLife;
          wizardRound = actionsFirst[i].round;
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
            setTimeout(function() {
              inWizard = false;
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
          if (actionsSecond[i].action === 'attack') io.to('second').emit('simulateAttack', {type: actionsSecond[i].type, num: 1}); // attackSocket({type: actionsSecond[i].type, num: 1});
          if (actionsSecond[i].action === 'recruit') io.to('second').emit('simulateRecruit', {type: actionsSecond[i].type, num: 1}); // recruitSocket({type: actionsSecond[i].type, num: 1});
          if (actionsSecond[i].when === maxWhen) {
            setTimeout(function() {
              inWizard = false;
              io.emit('leavePast');
              console.log('FINISHED STACK')
            }, 7000);
          }
        }, (actionsSecond[i].when-startTime));
      }
    } else if (playerPos === 'second') {
      poisoned = 'first';
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
        } else if (secondCastleLife <= 10){
          io.emit('changeTexture', {castle:2, level:'L'})
        } else if (secondCastleLife <= 20){
          io.emit('changeTexture', {castle:2, level:'M'})
        }
      } else if (playerPos === 'second') {
        firstCastleLife -= 1;
        if (firstCastleLife <= 0) {
          io.emit('endGame', 'second');
        } else if (firstCastleLife <= 10){
          io.emit('changeTexture', {castle:1, level:'L'})
        } else if (firstCastleLife <= 20){
          io.emit('changeTexture', {castle:1, level:'M'})
        }
      }
    } else if (type === 'spy') {
      if (playerPos === 'first') {
        if (secondPlayer['spy'] === 0) {
          firstPlayer['wizard'] = 1;
          // AFEGIR ACCIÓ
          actionsFirst.push({ action: 'spy', when: Date.now(), first: JSON.stringify(firstPlayer), second: JSON.stringify(secondPlayer), firstCastleLife, secondCastleLife, round });
        } else {
          secondPlayer['spy'] -= 1;
        }
      } else if (playerPos === 'second') {
        if (firstPlayer['spy'] === 0) {
          secondPlayer['wizard'] = 1;
          // AFEGIR ACCIÓ
          actionsSecond.push({ action: 'spy', when: Date.now(), first: JSON.stringify(firstPlayer), second: JSON.stringify(secondPlayer), firstCastleLife, secondCastleLife, round });
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
