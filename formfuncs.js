'use strict';
const sqlite = require('sqlite');
const fs = require('fs');
const { nanoid } = require('nanoid');
const CLIENT_ID = '1052392867708-n2s7e3m8c32vikl6ovrb7qgm4mutn1j6.apps.googleusercontent.com';
const { OAuth2Client } = require('google-auth-library');

async function getUserId(id_Token){
	let userId = '';
	if (id_Token !== '') {
		try {

			const client = new OAuth2Client(CLIENT_ID);

			const ticket = await client.verifyIdToken({
				idToken: id_Token, 
				audience: CLIENT_ID,
			});
  
			const payload = ticket.getPayload();
			userId = payload['sub'];
			return userId;
		} catch (e) {
			console.error(e);
			return userId;
		}
	} else {
		return userId;
	}
}

async function init() {
	const db = await sqlite.open('./database.sqlite', {
		verbose: true
	});
	await db.migrate({
		migrationsPath: './migrations-sqlite'
	});
	return db;
}
  
const dbConn = init();

async function findForm(id) {
	const db = await dbConn;
	const jsonLocation = db.get('SELECT jsonLocation FROM Forms WHERE id = ?', id);
	return jsonLocation;
}

async function findAnswers(id) {
	const db = await dbConn;
	const answers = db.all('SELECT answer FROM Answers JOIN Forms ON Forms.id = Answers.formId WHERE Forms.getRespId = ?', id);
	return answers;
}

async function getAnswerStruct(id){
	const db = await dbConn;
	const answerStruct = db.get('SELECT answerStruct FROM Forms WHERE getRespId = ?', id);
	return answerStruct;
}

async function findUserForms(idToken) {
	const db = await dbConn;
	const userId = await getUserId(idToken);
	const userForms = db.all('SELECT id, getRespId, jsonLocation FROM Forms WHERE authorId = ?', userId);
	return userForms;
}

function compareObjects(object1, object2){
	for (const i in object1){
		if (!Object.prototype.hasOwnProperty.call(object2, i)){
			return false;
		}
		if (typeof object1.i !== typeof object2.i){
			return false;
		}
	}
	return true;
}

async function addAnswer(answerObj) {
	const db = await dbConn;

	const existsJson = await db.get('SELECT EXISTS(SELECT 1 FROM Forms WHERE id = ?) AS existsBool', answerObj.id);
	if (existsJson.existsBool === 0){ return 'no form';	}

	const answerStructObj = await db.get('SELECT answerStruct FROM Forms WHERE id = ?', answerObj.id);

	const structMatch = compareObjects(answerObj.answers, JSON.parse(answerStructObj.answerStruct));
	if (structMatch === false){ return 'incorrect structure'; }

	await db.run('INSERT INTO Answers VALUES (?, ?, ?)', [nanoid(16), JSON.stringify(answerObj.answers), answerObj.id]);
	return 'success';
}

function generateAnswerStruct(formObject) {
	const questionArray = formObject.questions;
	let answerStruct = {};
	for (const question of questionArray){
		if (question.type === 'text' | question.type == 'single-select'){
			answerStruct[question.id] = '';
		} else if (question.type === 'number') {
			answerStruct[question.id] = 0;
		} else {
			answerStruct[question.id] = [];
		}
		
	}
	return answerStruct;
}

async function addForm(formObj) {

	console.log(formObj);

	const db = await dbConn;
	const formId = nanoid(16);
	const respId = nanoid(16);
	const locStr = `forms/${formId}.json`;
	fs.writeFile(locStr, JSON.stringify(formObj.form), function (err) {
		if (err) return console.log(err);
	});

	const formAnswerStruct = JSON.stringify(generateAnswerStruct(formObj.form));
	const gUserId = await getUserId(formObj.idToken);

	await db.run('INSERT INTO Forms VALUES (?, ?, ?, ?, ?)', [formId, formAnswerStruct, locStr, respId, gUserId]);

	const formDetailsObj = {
		'formId' : formId, 
		'respId' : respId 
	};

	return formDetailsObj;
}


module.exports = {
	findForm,
	addAnswer,
	findAnswers,
	getAnswerStruct,
	compareObjects,
	addForm,
	findUserForms,
};