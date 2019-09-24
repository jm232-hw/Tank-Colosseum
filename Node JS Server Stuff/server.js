//https://socket.io/docs/
var express = require("express");
var app = express();
var serv = require("http").Server(app);
var io = require('socket.io').listen(serv);
//The Modules I'm importing. 

let connections = []; //Array to hold all the sockets

app.get('/', function(req, res){
    res.sendFile(__dirname + '/Client/index.html');
}); // For any get requests (where the url contains no pathways), our server will only send back the index page in the client folder.
//Doesnt have access to the server file. 
app.use('/Client', express.static(__dirname + '/Client')); //Serves up all static files within the client folder. 

serv.listen(3000, ()=> console.log('Listening on Port 3000 (Local Host): ')); //Listening on port 3000 local Machine e.g http://localhost:3000/


io.sockets.on('connection', function(socket){ // If anyone connects to localhost:3000, this call back function will fire. 
    connections.push(socket);
    console.log('Connection Established, currently %d Sockets', connections.length);

    socket.on('client_message', (data)=>{ //If the client sends back a message of "client_message" to the server, this call back function will fire. 
        console.log("Message sent over from Client to Server: %s", data.msg);
    });

    socket.on('disconnect', () =>{ //disconnect is a pre-defined function, if anyone closes the web page, this call back function will fire.
        connections.splice(connections.indexOf(socket), 1);
        console.log("A socket disconnected, currently sockets left: %d", connections.length); 
    });

    socket.emit('server_message', {msg: "Hello From Server"}); //Sending a message from the server to the clients. Client Page needs to handle this. 
});