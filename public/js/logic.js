function recruit(type) {
  var num = 1;
  var unitCost = JSON.parse(unitCosts)[type];
  var tempStatus = JSON.parse(status);
  if (unitCost['wood']*num <= tempStatus['wood'] && unitCost['iron']*num <= tempStatus['iron']) {
    tempStatus['wood'] -= unitCost['wood']*num;
    tempStatus['iron'] -= unitCost['iron']*num;
    tempStatus[type] += num;
    socket.emit('recruit', {type, num});
    status = JSON.stringify(tempStatus);
  } else {
    message('Not enough resources');
  }
}

function attack(type) {
  var num = 1;
  var tempStatus = JSON.parse(status);
  console.log(tempStatus, type);
  if (tempStatus[type] - 1 >= 0) {
    tempStatus[type] -= 1;
    socket.emit('attack', {type, num});
    status = JSON.stringify(tempStatus);
  }
}
