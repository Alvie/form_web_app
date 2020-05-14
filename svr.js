'use strict';

const express = require( 'express' );
const app = express ();
const forms = require ( './formfuncs' );
app.use(express.static('client', { extensions: ['html'] }));
app.listen(8080);


function asyncWrap (f) {
	return (req, res, next) => {
		Promise.resolve(f(req, res, next))
			.catch((e) => next(e || new Error()));
	};
}

let message = '';

app.post('/submit', express.json(), function (req, res) {
	let message = req.body;
	console.log(message);
	res.send(message);
});

app.get('/submit', (req, res) => {
	res.send(message);
});

async function getForm (req, res) {
	const result = await forms.findForm(req.params.id);
	if (!result) {
		res.status(404).send('No match for that ID.');
		return;
	}
	res.json(result);
}

app.get('/form/:id', asyncWrap(getForm));