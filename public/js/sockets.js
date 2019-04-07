var socket = io();
var id;
var unitCosts = {};
var canPlay = false;
var status = {};
socket.on('cantPlay', () => message('Two players already playing'));
socket.on('identification', identity => {
  id = identity
  message(identity);
});
socket.on('startGame', () => canPlay = true);
socket.on('endGame', who => location.href = who + '.html');
socket.on('unitCosts', function(costs) {
  unitCosts = JSON.stringify(costs);
});
socket.on('myStatus', function(stat) {
  status = JSON.stringify(stat);
  document.getElementById('wood').innerHTML = Math.floor(stat.wood);
  document.getElementById('iron').innerHTML = Math.floor(stat.iron);
  document.getElementById('food').innerHTML = Math.floor(stat.food);
  document.getElementById('attack').innerHTML = Math.floor(stat.attack);
  document.getElementById('defense').innerHTML = Math.floor(stat.defense);
  document.getElementById('spy').innerHTML = Math.floor(stat.spy);
  if (stat.wizard === 1) {
    message('You can now train a Wizard');
  }
});
socket.on('leavePast', function() {
  console.log('leaving past')
  playState.leavePast();
});
socket.on('attack', function(data) {
  let unit;
  if (data.data.type === 'attack') unit = UNITS.CHARIOT;
  if (data.data.type === 'defense') unit = UNITS.WARRIOR;
  if (data.data.type === 'spy') unit = UNITS.SPY;
  if (data.data.type === 'wizard') unit = UNITS.WIZARD;
  if (data.attacker === 'first') {
    playState.spawnUnit(1, unit);
  } else if (data.attacker === 'second') {
    playState.spawnUnit(2, unit);
  }
});

socket.on('changeTexture', function(data) {
  playState.changeCastleTexture(data.castle, data.level);
});


socket.on('simulateAttack', data => socket.emit('attack', data));
socket.on('simulateRecruit', data => socket.emit('recruit', data));
