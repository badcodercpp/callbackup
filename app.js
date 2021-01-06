var express = require('express');
var app = express();
var fs = require('fs');
var serverPort = process.env.PORT || 5000;
var http = require('http');
var _noop = require('lodash/noop');
var _isEmpty = require('lodash/isEmpty');
var _keys = require('lodash/keys');
var _head = require('lodash/head');
var _map = require('lodash/map');
var _filter = require('lodash/filter');
var _reduce = require('lodash/reduce');
var server;
server = http.createServer(app);
var io = require('socket.io')(server);
var roomList = [];
var tempRooms = {
	1000: []
}

var all_calls_common_platform = {}

app.get('/yesbuddypromise', function(req, res){
  console.log('get /');
  res.sendFile(__dirname + '/ybTestWithPromise.html');
});

app.get('/', function(req, res){
  console.log('get /');
  res.sendFile(__dirname + '/index.html');
});

app.get('/yesbuddy', function(req, res){
  console.log('get /');
  res.sendFile(__dirname + '/yesbuddyWebRTC.html');
});
server.listen(serverPort, function(){
  console.log('server up and running at %s port', serverPort);
  // if (process.env.LOCAL) {
  //   open('https://localhost:' + serverPort)
  // }
});

function socketIdsInRoom(name, ss) {

var socketIds = io.nsps['/'].adapter.rooms[name];

  if (socketIds) {
	//console.log('ssss', ss.rooms)
    var collection = [];
    for (var key in socketIds) {
      collection.push(key);
    }
//console.log("target collections", collection)
    return collection;
  } else {
    return [];
}

}


const users = {

}

io.on('connection', function(socket){



console.log("connected")
socket.on('create_room_on_fly', function(room, callback) {
if(!all_calls_common_platform[room]){
all_calls_common_platform[room] = [];
}
	
	callback(all_calls_common_platform);
})
  socket.on('preserveSocketId', (data, callback = _noop) => {
    console.log("dada", data)
    const j = JSON.parse(data);
    const {kind} = j;
    users[kind] = socket.id;
    callback(socket.id);
  })
  // console.log('connection');
  socket.on('disconnect', function(){
    const kind = socket.id;
    const target = users[kind];
    if (!_isEmpty(target)) {
      delete users[kind];
    }
	var curr_room;
	var updatedSockets;
	for(var m in all_calls_common_platform) {
		var tempCurr = all_calls_common_platform[m]
		if(tempCurr){
			for(x in tempCurr) {
				if(tempCurr[x] === kind) {
					curr_room = m;
					break;
				}
			}
		}
	}
	var removedSockets = all_calls_common_platform[curr_room];
	if(removedSockets){
		updatedSockets = _filter(_map(removedSockets, function(iid){
			if(iid === kind) {
				return undefined;
			}
			return iid;
		}), function(elem) {
			if(elem) {
				return true;
			}
			return false;
		});
	}
	all_calls_common_platform[curr_room] = updatedSockets; 
	
  });

  socket.on('join', function(name, callback = _noop){
      console.log('join', name);
      var socketIds = socketIdsInRoom(name, socket);

	callback(all_calls_common_platform[name])
all_calls_common_platform[name].push(socket.id)
      //callback(socketIds);
      socket.join(name);
      socket.room = name;
//console.log(socket.rooms)
	//tempRooms[1000].push(socket.id)
console.log(all_calls_common_platform)
	//console.log(io.sockets.clients(name))
  });

  socket.on('ringUser', (data = {}) => {
    console.log("ringUser", data, users, "hi")
    const {to, room} = data;
    const target = users[to];
    if (!_isEmpty(target)) {
      io.to(target).emit('ringBack', {room})
    }
});




  socket.on('exchange', function(data){
    //   console.log('exchange', data);
      data.from = socket.id;
      var to = io.sockets.connected[data.to];
if(!_isEmpty(to) && to.emit){
to.emit('exchange', data);
}
      
});
});
