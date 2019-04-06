function recruit(type, num) {
  var num = 1; // AGAFAR-HO D'UN INPUT
  console.log(unitCosts)
  var unitCost = JSON.parse(unitCosts)[type];
  var tempStatus = JSON.parse(status);
  console.log(unitCost);
  console.log(tempStatus);
  if (unitCost['wood']*num <= tempStatus['wood'] && unitCost['iron']*num <= tempStatus['iron']) {
    tempStatus['wood'] -= unitCost['wood']*num;
    tempStatus['iron'] -= unitCost['iron']*num;
    tempStatus[type] += num;
    socket.emit('recruit', {type, num});
    status = JSON.stringify(tempStatus);
  } else {
    alert('no tens recursos suficients')
  }
}
