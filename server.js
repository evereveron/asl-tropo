var express = require('express');
var $ = jQuery = require('jQuery');

var app = express();
app.set('view engine', 'ejs');
app.set('port', (process.env.PORT || 8080));
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