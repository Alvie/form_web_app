'use strict';
const sqlite = require('sqlite');
const fs = require('fs');
const { nanoid } = require('nanoid');
const CLIENT_ID = '1052392867708-n2s7e3m8c32vikl6ovrb7qgm4mutn1j6.apps.googleusercontent.com';
const { OAuth2Client } = require('google-auth-library');


// getUserId function with Google Auth Library
// supply id_Token to to be verified which can return an id via a ticket
async function getUserId(id_Token){
	let userId = ''; // default to no user
	// if id_Token supplied is not empty
	if (id_Token !== '') {
		try {
			// instantiate Google Auth client with id
			const client = new OAuth2Client(CLIENT_ID);
			// verify id_Token with Google
			const ticket = await client.verifyIdToken({
				idToken: id_Token, 
				audience: CLIENT_ID,
			});
			// get payload from ticket
			const payload = ticket.getPayload();
			// get userId from payload
			userId = payload['sub'];
			// return userId
			return userId;
		} catch (e) {
			// log errors if they arise
			console.error(e);
			// return userId, - will be default: ''
			return userId;
		}
	} else {
		// return userId, - will be default: ''
		return userId;
	}
}

// initialise database
async function init() {
	const db = await sqlite.open('./database.sqlite', {
		verbose: true
	});
	await db.migrate({
		migrationsPath: './migrations-sqlite'
	});
	return db;
}

// call database initialisation
const dbConn = init();


// find form function
// supply an id
async function findForm(id) {
	// connect to database
	const db = await dbConn;
	// get the JSON Location of the form
	const jsonLocation = db.get('SELECT jsonLocation FROM Forms WHERE id = ?', id);
	// return JSON location of the form
	return jsonLocation;
}

// find Answers function
// supply an id
async function findAnswers(answersId) {
	// connect to database
	const db = await dbConn;
	// get all answers that relate to the form with supplied id
	const answers = db.all('SELECT answer FROM Answers JOIN Forms ON Forms.id = Answers.formId WHERE Forms.answersId = ?', answersId);
	return answers;
}

// get answer structure function
// supply an id
async function getAnswerStruct(answersId){
	// connect to database
	const db = await dbConn;
	// get answerStruct of database with supplied id
	const answerStruct = db.get('SELECT answerStruct FROM Forms WHERE answersId = ?', answersId);
	return answerStruct;
}

// find user forms function
// supply an idToken
async function findUserForms(idToken) {
	// connect to database
	const db = await dbConn;
	// get userId from getUserId function, supply token
	const userId = await getUserId(idToken);
	// get all responses where authorId matches userId
	// includes formId, answersId, and JSON location of form
	const userForms = db.all('SELECT id, answersId, jsonLocation FROM Forms WHERE authorId = ?', userId);
	return userForms;
}

// function to compare two JSON objects
// returns equal if they have same attributes
// and if attributes have same type
function compareObjects(object1, object2){
	// for each attribute in the first object
	for (const i in object1){
		// if second object doesn't have the first objects attribute 
		if (!Object.prototype.hasOwnProperty.call(object2, i)){
			return false;
		} // if first and second object's types of the same attribute do not match
		if (typeof object1.i !== typeof object2.i){
			return false;
		}
	}
	return true;
}

// add answer function
//     - supply an answerObj
//       which contains: .id (id of form)
//                       .answers (answers submitted)

async function addAnswer(answerObj) {
	// connect to database
	const db = await dbConn;

	// check if form with (id: answerObj.id) exists 
	const existsJson = await db.get('SELECT EXISTS(SELECT 1 FROM Forms WHERE id = ?) AS existsBool', answerObj.id);
	// existsJson is equal to 0 if no form exists. If so, return message
	if (existsJson.existsBool === 0){ return 'no form';	}

	// get answer structure of form where id is answerObj.id
	const answerStructObj = await db.get('SELECT answerStruct FROM Forms WHERE id = ?', answerObj.id);

	// check if the answerObj.answers and answerStruct of form match
	const structMatch = compareObjects(answerObj.answers, JSON.parse(answerStructObj.answerStruct));
	// if not return message
	if (structMatch === false){ return 'incorrect structure'; }

	// if match, insert answers into database Answers table
	// values are (id, answers, formID)
	// id is nanoid(16) which creates a unique/random id
	await db.run('INSERT INTO Answers VALUES (?, ?, ?)', [nanoid(16), JSON.stringify(answerObj.answers), answerObj.id]);
	return 'success';
}

// generate answer structure
// called when a form is uploaded/created
//     - supply a formObject
function generateAnswerStruct(formObject) {
	const questionArray = formObject.questions;
	let answerStruct = {};

	// for each question of the form
	for (const question of questionArray){
		if (question.type === 'text' | question.type == 'single-select'){
			// type of answer must be String
			answerStruct[question.id] = '';
		} else if (question.type === 'number') {
			// type of answer must be number
			answerStruct[question.id] = 0;
		} else { // if multi-select, type of answer must be array
			answerStruct[question.id] = [];
		}
		
	}
	return answerStruct;
}

// add form function
//     - supply a formObj
//       which contains: .idToken (to verify with Google and get userId)
//                       .form (form JSON object e.g. {"name": name, "questions": questions})

async function addForm(formObj) {

	console.log(formObj);
	// connect to database
	const db = await dbConn;
	const formId = nanoid(16); // create unique/random id for form
	const answersId = nanoid(16); // create a different unique/random id for getting answers
	
	// add the json file to /forms/ with filename of formId
	const locStr = `forms/${formId}.json`;
	fs.writeFile(locStr, JSON.stringify(formObj.form), function (err) {
		if (err) return console.log(err);
	});

	// get answer structure of the form
	const formAnswerStruct = JSON.stringify(generateAnswerStruct(formObj.form));
	// get userId from formObj.idToken
	const userId = await getUserId(formObj.idToken);

	// insert into Forms table of database
	await db.run('INSERT INTO Forms VALUES (?, ?, ?, ?, ?)', [formId, formAnswerStruct, locStr, answersId, userId]);

	// create formDetailsObj to return
	// so client can get a share link / response view link with ids
	const formDetailsObj = {
		'formId' : formId, 
		'answersId' : answersId 
	};

	return formDetailsObj;
}

// export functions
module.exports = {
	findForm,
	addAnswer,
	findAnswers,
	getAnswerStruct,
	compareObjects,
	addForm,
	findUserForms,
};