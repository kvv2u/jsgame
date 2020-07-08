var express =require('express');
const { Socket } = require('dgram');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname+'/client'));

serv.listen(2000);
console.log("Server started.");

var SOCKET_LIST = {};
var PLAYER_LIST = {};

var Player = function(id) {
    var self = {
        x:250,
        y:250,
        id:id,
        number:"" + Math.floor(10*Math.random())
    }
    return  self;
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    var player = Player(socket.id);
    PLAYER_LIST[socket.id] = player;

    socket.on('disconnect', function() {
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
    });
});

setInterval(function() {
    var pack = [];                  // ゲーム内のプレイヤーに関する情報
    for(var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.x++;
        socket.y++;
        pack.push({
            x:socket.x,
            y:socket.y,
            number:socket.number
        });
    }
    for (var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions',pack); 
    }
},1000/25);