/** The General Idea is the clients will modify a player object and send them back to the server, which'll get added to player array on server, the 
 * server will send back that player array to client, where the clients will iterate through that array and print stuff like the x and y positions of each player
 * on the cavas. This process repeats every 40 frame per second. 
 * sockets.on = Server is listening for a message to be sent from client, that server has gotta handle that in some way. The second parameter is that call back function that does just that. 
 * socket.emit = Server is sending back a message to the client. 
 */
var express = require("express");
var app = express();
var serv = require("http").Server(app);
var io = require('socket.io').listen(serv); //Node Modules to Import


let connections = []; //Array that holds the sockets
var playerArray = []; //Array that holds the player objects that'll be sent back to the clients.

app.get('/', function (req, res) { //If anyone makes a get request to our URL where there is no pathway specified, the server will send back the index web page held on client. e.g http://localhost:3000/
    res.sendFile(__dirname + '/Client/index.html');
});
app.use('/Client', express.static(__dirname + '/Client'));  //Express module that'll serve up every static file for us inside the client folder. 

serv.listen(3000, () => console.log('Listening on Port 3000 (Local Host): ')); //Server is listening on local host 3000. http://localhost:3000


/** "connection": 
 * connection is the type of message, it is default one. It get's called everyone time someone connects to our server. So far, when they do so
 * a newly created player object is made, and get's added to the player array (inside the create player method). The socket get's added to the 
 * connections array. Will conesole.log a message, saying what socket has connected in addition to how many sockets are in that array. 
 *  
 * "disconnect"
 * diconnect message is also a default one which get's called everytime someone leaves the webpage. We'll need to modify this, when we go on to databases so we can save the player's states. 
 * But for the time being, if someone disconnects, it'll just create a new player object in connect. There's a for loop which just iterates the player array, compares their socket id's, and 
 * deletes the player which has the same socket ID as the socket ID that has left. 
 * 
 * "serMovement"
 * You should really look at the client's bit to understand how this works. But basically, 
 * The client is gonna forward information everytime they press the keyboard is pressed/released. IT seconds an object back containing 2 variables, key and keystate, key is basically what key was pressed,
 * and keystate is true/false. 
 * the switch checks for the key for what key was pressed pressed and the keystate is gonna update the player's pressing variables, the player has to 4 boolean values, which dictate whether or not which direction they should move to. E.g pressingLeft means to go left. The way I've done it is, 
 * the server will update their position, the client is simply sending boolean values. WHich'll modify those 4 values. The positionUpdate method is the one which actually updates the x y and value
 * based on their boolean values. The positionUpdate function is getting called every 25 milliseconds which is 40 frames per second. On the client there is 2 funcitons, press and release. When pressing 
 * the keyboard, say they press w, the client sends back an object, key = w, key state = true. positionUpdate is gonna be called, which'll substract the player speed from the player's y value. The canvas 
 * top left is y = 0, x = 0. x increases as you go right, y increases as you go down. THe server, will modify the x and y, and then send he player array back to the client, where the client will print it, 
 * on their screen. 
 * 
 */


io.sockets.on('connection', function (socket) { 
    var player = createPlayer(0, 0, "p", socket.id); 
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
//Modifies the player's pressing state variables, based on what the client sends back. 
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

//Function that creates the player object. 
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
//The actual function that updates the x and y of the player which get's called every 25 milliseconds by set. Note, this method is apart of the player object.
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
//Is calling this every 25 milliseconds, which is calling updatePosition function, and it also is iterating through each socket and sending back the player array back to the client to draw them on their 
//screen. 
setInterval(() => {
    for (let player of playerArray) {
        player.positionUpdate();

    }
    for (let socket of connections) {
        socket.emit('newPositions', playerArray);
    }

}, 1000 / 40); // 40 frames per second. 