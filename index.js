/**
 * A very simple node web server that will respond to requests
 *  with a transfer to a SIP or PSTN number.
 */

var http = require('http');
var tropowebapi = require('tropo-webapi');
var express = require('express');
var Spark = require('csco-spark');
var spark = Spark({
  uri: 'https://api.ciscospark.com/v1',
  token: 'YWYxZTZkMTctZjY3ZS00NjA1LTk2NWYtMjMyNDE5MjliNzE4MDM4NDZkZmYtZjE0'
});

var app = express();
app.set('view engine', 'ejs');
app.set('port', (process.env.PORT || 8080));
app.use(express.static(__dirname + '/'));

// Getting Spark Rooms 
var listRooms = spark.listItemEvt({
  item: 'rooms',
  max: '15' || undefined // Default = 50 
});
// Listen for Rooms 
listRooms.on('rooms', function(rooms) {
  console.log(rooms)
});
 
listRooms.on('rooms-end', function(rooms) {
  // Yes I am sending Data on the End Event 
  // I believe most don't 
});

app.get('/', function(req, res){
	listRooms.on('rooms', function(rooms) {
		console.log("hi");
	  console.log(rooms)
	});
});

app.listen(8000);
/*
var app = express();
app.set('view engine', 'ejs');
app.set('port', (process.env.PORT || 8000));
app.use(express.static(__dirname + '/'));*/
/*
var server = http.createServer(function (request, response) {
	
	// Create a new instance of the TropoWebAPI object.
	var tropo = new tropowebapi.TropoWebAPI(); 
	
	console.log("starting...");

	tropo.say('Please hold while your call is transferred.');
	tropo.say("Guess what? https://www.tropo.com/docs/troporocks.mp3", {voice:"kate"});
	tropo.transfer('mheadd@sip2sip.info', false, null, null, {'x-caller-name' : 'Mark Headd'}, null, null, true, '#', 60.0);
	
	// Render out the JSON for Tropo to consume.
	response.writeHead(200, {'Content-Type': 'application/json'}); 
	response.end(tropowebapi.TropoJSON(tropo));
	
}).listen(8000); // Listen on port 8000 for requests.
*/

//var app = express.createServer();
/*
app.get('/', function(req, res){
	var tropo = new tropowebapi.TropoWebAPI();

	tropo.say("hello world");

	res.send(tropowebapi.TropoJSON(tropo));
});

app.listen(8000);


console.log('Server running on http://0.0.0.0:8000/'); 
*/