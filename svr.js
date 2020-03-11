'use strict';

const express = require('express');
const app = express();
app.use(express.static('client', { extensions: ['html'] }));
app.listen(8080);

let message = '';

console.log('HELLO');

app.post('/submit', express.json(), function (req, res) {
	let message = req.body;
	console.log(message);
	res.send(message);
});

app.get('/submit', (req, res) => {
	res.send(message);
});

// app.get('/example', express.json(), function(req, res){
//   res.send(JSON.stringify(url: ))
// });