var ident= "sorube";
var secret= "3ba84e92-dc9f-11e5-be0d-27778885886f";
var domain= "www.silvia-battleship.com";
var application= "default";
var room= 'default';
var secure = 1;


var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(process.env.PORT || 8080);

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket){

  // convenience function to log server messages on the client
	function log(){
		var array = [">>> Message from server: "];
	  for (var i = 0; i < arguments.length; i++) {
	  	array.push(arguments[i]);
	  }
	    socket.emit('log', array);
	}

	socket.on('message', function (message) {
		log('Got message:', message);
    // for a real app, would be room only (not broadcast)
		socket.broadcast.to(message.channel).emit('message', message);
	});

	socket.on('create or join', function (room) {
		var numClients = io.sockets.clients(room).length;

		log('Room ' + room + ' has ' + numClients + ' client(s)');
		log('Request to create or join room ' + room);

		if (numClients === 0){
			socket.join(room);
			socket.emit('created', room);
		} else if (numClients === 1) {
			io.sockets.in(room).emit('join', room);
			socket.join(room);
			socket.emit('joined', room);
		} else { // max two clients
			socket.emit('full', room);
		}
		// socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
		// socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);
	});

	socket.on('getCred', function(){
		var cred = 'ident='+ident+'&secret='+secret+'&domain='+domain+'&application='+application+'&room='+room+'&secure='+secure;
		socket.emit('ICE Candidates', cred);
	});
});