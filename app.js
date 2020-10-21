var express = require('express');
var app = express();
var fs = require('fs');
var open = require('open');
var serverPort = (process.env.PORT);
var http = require('http');
var server = http.createServer(app);;

var io = require('socket.io')(server);

var ringSocketId = {};

var roomList = {};

app.get('/', function(req, res){
  console.log('get /');
  res.sendFile(__dirname + '/index.html');
});

app.get('/mobile', function(req, res){
  console.log('get /mobile');
  res.sendFile(__dirname + '/indexMobile.html');
});

server.listen(serverPort, function(){
  console.log('server up and running at %s port', serverPort);
});

function socketIdsInRoom(name) {
  var socketIds = io.nsps['/'].adapter.rooms[name];
  if (socketIds) {
    var collection = [];
    for (var key in socketIds) {
      collection.push(key);
    }
    return collection;
  } else {
    return [];
  }
}

io.on('connection', function(socket){
  console.log('connection');
  socket.on('disconnect', function(){
    console.log('disconnect', socket.id);
    if (socket.room) {
      var room = socket.room;
      io.to(room).emit('leave', socket.id);
      socket.leave(room);
    }
  });

  socket.on('join', function(name, callback){
    console.log('join', name, socket.id);
    var socketIds = socketIdsInRoom(name);
    callback(socketIds);
    socket.join(name);
    socket.room = name;
  });

  socket.on('setavailable', function(name, callback){
    console.log('available', name, socket.id);
    var res = {[name]: socket.id};
    ringSocketId[name] = socket.id;
    callback(res);
  });

  socket.on('getip', function(name, callback) {
	var res = ringSocketId[name];
        callback(res)
  })

  socket.on('ring', function(data, callback){
    console.log('ring', socket.id);
    var to = io.sockets.connected[data.sId];
    to.emit('ring', data);
    callback(data.room)
  });


  socket.on('exchange', function(data){
    console.log('exchange', data, socket.id);
    data.from = socket.id;
    var to = io.sockets.connected[data.to];
    to.emit('exchange', data);
  });
});
