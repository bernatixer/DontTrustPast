function recruitAttack() {
  var num = 1; // AGAFAR-HO D'UN INPUT
  socket.emit('recruitAttack', num);
}

function recruitDeffense() {
  var num = 1; // AGAFAR-HO D'UN INPUT
  socket.emit('recruitDeffense', num);
}

function recruitSpies() {
  var num = 1; // AGAFAR-HO D'UN INPUT
  socket.emit('recruitSpies', num);
}
