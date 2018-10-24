var express = require('express');
var bodyParser = require('body-parser');
var routes = require('./routes');

var app = express();

var port = process.env.PORT || 3000;
//global.recentInput = "";
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false })) 
app.use(bodyParser.json());

app.use(routes);

var server = app.listen(port,function(){
	console.log("Application started listening port "+port);
	console.log(process.env.apikeys);
});


