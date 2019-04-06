function recruit(type) {
  var num = 1; // AGAFAR-HO D'UN INPUT
  // LOGICA DE COMPROVAR
  socket.emit('recruit', {type, num});
}
