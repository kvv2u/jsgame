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

var Entity = function() {
    var self = {
        x:250,
        y:250,
        spdX:0,
        spdY:0,
        id:"",
    }
    self.update = function() {
        self.updatePosition();
    }
    self.updatePosition = function() {
        self.x += self.spdX;
        self.y += self.spdY;
    }
    return self;
}

var Player = function(id) {
    var self = Entity();
    self.id = id;
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingLeft = false;
    self.pressingRight = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.maxSpd = 10;

    self.updateSpd = function() {
        if(self.pressingRight) {
            self.spdX = self.maxSpd;
        } else if(self.pressingLeft) {
            self.spdX = -self.maxSpd;
        } else {
            self.spdX = 0;
        }
    }
    return  self;
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket) {
    socket.id = Math.random();              // ランダム id を生成
    SOCKET_LIST[socket.id] = socket;

    var player = Player(socket.id);
    PLAYER_LIST[socket.id] = player;

    socket.on('disconnect', function() {    // 接続が切れたら削除
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
    });
    socket.on('keyPress', function(data) {
        if(data.inputId === 'left') {
            player.pressingLeft = data.state;
        } else if(data.inputId === 'right') {
            player.pressingRight = data.state;
        } else if(data.inputId === 'up') {
            player.pressingUp = data.state;
        } else if(data.inputId === 'down') {
            player.pressingDown = data.state;
        }
    });
});

setInterval(function() {
    var pack = [];
    for(var i in PLAYER_LIST) {
        var player = PLAYER_LIST[i];
        player.updatePosition();
        pack.push({
            x:player.x,
            y:player.y,
            number:player.number
        });
    }
    for (var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions',pack); 
    }
},1000/25);