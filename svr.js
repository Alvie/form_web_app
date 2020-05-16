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

async function getForm (req, res) {
	const result = await forms.findForm(req.params.id);
	if (!result) {
		res.status(404).send('No match for that ID.');
		return;
	}
	const formJson = require('./' + result.jsonLocation);
	res.json(formJson);
}

async function submitForm (req, res) {
	const result = await forms.addAnswer(req.body);
	if (result === 'no form'){
		res.status(404).send('No form exists with the ID specified');
		return;
	} else if (result === 'incorrect structure'){
		res.status(422).send('The answers submitted do not match the structure of the form');
	}
	res.status(200).send('successful');
}

// async function getAnswers (req, res) {
// 	const result = await forms.getSubmissions(req.params.id);
// 	return result
// }

app.get('/forms/:id', asyncWrap(getForm));
app.post('/submit-form', express.json(), asyncWrap(submitForm));
// app.get('/answers/:id', asyncWrap(getAnswers));