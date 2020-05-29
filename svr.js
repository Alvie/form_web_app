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
	console.log(req.body);
	if (result === 'no form'){
		res.status(404).send('No form exists with the ID specified');
		return;
	} else if (result === 'incorrect structure'){
		res.status(400).send('The answers submitted do not match the structure of the form');
	}
	res.status(200).send('successful');
}

async function getAnswers (req, res) {
	// Get the answer structure of the form
	const answerStruct = await forms.getAnswerStruct(req.params.id);
	if (!answerStruct) {
		res.status(404).send('No match for that ID.');
		return;
	}

	// Create an answers object using the structure of the form
	let answersJson = {};
	for (const obj in JSON.parse(answerStruct.answerStruct)){
		answersJson[obj] = [];
	}

	// Get all the answers stored in the database related to the id
	const answerArray = await forms.findAnswers(req.params.id);
	if (!answerArray) {
		res.status(404).send('No match for that ID.');
		return;
	}

	// For each answer, push it into the relevant array of the answers object (answersJson)
	for (const answer of answerArray){
		const answerObj = JSON.parse(answer.answer);
		for(const attr in answerObj){
			answersJson[attr].push(answerObj[attr]);
		}
	}

	// respond with the answers object (answersJson)
	res.json(answersJson);
}

async function createForm (req, res){
	const correctFormat = forms.compareObjects(req.body, JSON.parse('{"name": "", "questions": ""}'));
	if (correctFormat) {
		
		forms.addForm(req.body);
		res.send('upload');
	} else {
		res.status(400).send('Incorrect JSON Structure');
	}
	
}

app.get('/forms/:id', asyncWrap(getForm));
app.post('/submit-form', express.json(), asyncWrap(submitForm));
app.get('/answers/:id', asyncWrap(getAnswers));
app.post('/upload-form', express.json(), asyncWrap(createForm));