var express = require('express');
//var $ = jquery = require('jquery');
var fs = require('fs');

var app = express();
app.set('view engine', 'ejs');
app.set('port', (process.env.PORT || 8000));
app.use(express.static(__dirname + '/'));

console.log('starting app at localhost:8000...');

app.get('/', function(req, res) {
    console.log('home');
    res.render('pages/index');  
});

app.get('/learn', function(req, res) {
    console.log('learn');
    
    res.render('pages/learn');
});

app.get('/connect', function(req, res) {
    console.log('connect');
    res.render('pages/connect');
});

app.listen(8000);

var data = [];
var fileContents = fs.readFileSync('public/asl.txt');
var lines = fileContents.toString().split('\n');

var router = express.Router(); 
router.route('/random')
  .get(function (req, res) {
    var num = Math.random()*500;
    res.json(num);
    
  });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
