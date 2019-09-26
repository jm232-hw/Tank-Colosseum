
var express = require("express");
var app = express();
var serv = require("http").Server(app);
var io = require('socket.io').listen(serv);


let connections = []; 
var playerArray = []; 

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/Client/index.html');
});
app.use('/Client', express.static(__dirname + '/Client'));  

serv.listen(3000, () => console.log('Listening on Port 3000 (Local Host): ')); 


io.sockets.on('connection', function (socket) { 
    var player = createPlayer(250, 250, "p", socket.id); 
    connections.push(socket);
    console.log('Connection Established: A Socket with socket ID: %s has been created, Currently %d Sockets', socket.id, connections.length);

    socket.on('disconnect', () => { 
        connections.splice(connections.indexOf(socket), 1);
        console.log("A socket disconnected of socket ID: %s, current sockets left: %d", socket.id, connections.length);
        for (let player of playerArray) {
            if (player.socketID === socket.id) {
                playerArray.splice(playerArray.indexOf(player), 1);
            }
        }
    });

    socket.on('userMovement', (data) => {
        switch (data.key) {
            case 'a':
                player.pressingLeft = data.keyState;
                break;
            case 'd':
                player.pressingRight = data.keyState;
                break;
            case 'w':
                player.pressingUp = data.keyState;
                break;
            case 's':
                player.pressingDown = data.keyState;
                break;
        }
    });

});


let createPlayer = function (x, y, name, socketID) {
    var player = {
        x: x,
        y: y,
        name: name,
        socketID: socketID,
        pressingDown: false,
        pressingUp: false,
        pressingLeft: false,
        pressingRight: false,
        speed: 10,
    };

    player.positionUpdate = function () {
        if (player.pressingUp) {
            player.y -= player.speed;
        }
        if (player.pressingDown) {
            player.y += player.speed;;
        }
        if (player.pressingLeft) {
            player.x -= player.speed;;
        }
        if (player.pressingRight) {
            player.x += player.speed;;
        }

    }
    playerArray.push(player);

    return player;
}

setInterval(() => {
    for (let player of playerArray) {
        player.positionUpdate();

    }
    for (let socket of connections) {
        socket.emit('newPositions', playerArray);
    }

}, 1000 / 40); // 40 frames per second. 