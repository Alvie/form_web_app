'use strict';

const express = require( 'express' );
const app = express ();
const forms = require ( './formfuncs' );

app.use(express.static('client', { extensions: ['html'] }));
app.listen(8080);

// wraps every function in a Promise / catch
function asyncWrap (f) {
	return (req, res, next) => {
		Promise.resolve(f(req, res, next))
			.catch((e) => next(e || new Error()));
	};
}

// Get form function
// called when client visits URL '/forms#{id}'
async function getForm (req, res) {
	// find a form relating to the id submitted in URL
	const result = await forms.findForm(req.params.id);
	if (!result) {
		// if no form found with id, send 404 with msg
		res.status(404).send('No match for that ID.');
		return;
	}
	// if found, use JSON location of form and send to client
	// (client builds webpage with formJson)
	const formJson = require('./' + result.jsonLocation);
	res.json(formJson);
}

// Submit form function
// called when client submits a form answer
async function submitForm (req, res) {
	// add answer to database via forms.addAnswer
	//     - supply req.body (which contains {id: id, answer: answer})
	const result = await forms.addAnswer(req.body);
	if (result === 'no form'){
		// if result receives a no form message then send 404 with message
		res.status(404).send('No form exists with the ID specified');
		return;
	} else if (result === 'incorrect structure'){
		// if result receives a incorrect structure message then send 400 with message
		res.status(400).send('The answers submitted do not match the structure of the form');
		return;
	}
	// if successful, send OK (200) response
	res.status(200).send('successful');
}

// answers of form sorted by each question
// called when client visits URL 'answers/question-sort/{id}'
async function getAnswersByQuestion (req, res) {
	// Get the answer structure of the form
	const answerStruct = await forms.getAnswerStruct(req.params.id);
	if (!answerStruct) {
		// send 404 message if answerStruct cannot be found
		res.status(404).send('No match for that ID.');
		return;
	}

	// Create an answers object using the structure of the form
	let answersJson = {};
	// for each attribute in the provided struct, create an array
	for (const obj in JSON.parse(answerStruct.answerStruct)){
		answersJson[obj] = [];
	}

	// Get all the answers stored in the database related to the id
	const answerArray = await forms.findAnswers(req.params.id);
	if (!answerArray) {
		// if answerArray doesnt exist, send a 404 msg
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


// getAnswers function
// called when client visits URL 'answers/{id}'
async function getAnswers (req, res) {
	const answerObj = { 'responses': [] };
	// Get all the answers stored in the database related to the id
	const answerArray = await forms.findAnswers(req.params.id);
	if (!answerArray) {
		// if answerArray doesnt exist, send a 404 msg
		res.status(404).send('No match for that ID.');
		return;
	}

	// for each answer, add it to the array
	for (const answer of answerArray) {
		answerObj['responses'].push(JSON.parse(answer.answer));
	}
	// respond with the answers object (answersJson)
	res.json(answerObj);
}

// Create form function
// called when client makes POST call /upload-form
async function createForm (req, res){
	// compare the received object to ensure it contains "name" and "question" attributes
	const correctFormat = forms.compareObjects(req.body.form, JSON.parse('{"name": "", "questions": []}'));
	if (correctFormat) {
		// add form to database via forms.addForm
		//     - includes entire body in case of an idToken being supplied
		const formDetailsObj = await forms.addForm(req.body);
		if (!formDetailsObj) {
			// if questions are not valid
			res.status(400).send('Incorrect JSON Structure');
		} else {
			// respond with the details found
			// e.g. {formId, answersId}
			res.json(formDetailsObj);
		}
	} else {
		// send 400 error with message alerting user it is an incorrect structure
		res.status(400).send('Incorrect JSON Structure');
	}
}

// Get forms created/uploaded by a user
// called when client makes POST call /all-user-forms
async function getUserForms (req, res) {
	// get array of details via forms.findUserForms
	//     - supply idToken to be verified
	const userFormArray = await forms.findUserForms(req.body.idToken);
	
	let userFormObj = {'userFormObjs': []};

	// for each item of the array, add information such as
	// formId, answersId, and formName (get from JSON file)
	for (const item of userFormArray) {
		let internalObj = {};
		internalObj['formId'] = item.id;
		internalObj['answersId'] = item.answersId;
		const data = require(`./${item.jsonLocation}`);
		internalObj['formName'] = data.name;
		userFormObj['userFormObjs'].push(internalObj);
	}

	// send the obj containing the array of form information
	res.json(userFormObj);
}

app.get('/forms/:id', asyncWrap(getForm));
app.post('/submit-form', express.json(), asyncWrap(submitForm));
app.get('/answers/question-sort/:id', asyncWrap(getAnswersByQuestion));
app.get('/answers/:id', asyncWrap(getAnswers));
app.post('/upload-form', express.json(), asyncWrap(createForm));
app.post('/all-user-forms', express.json(), asyncWrap(getUserForms));