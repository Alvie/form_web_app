'use strict';
const sqlite = require('sqlite');
const { nanoid } = require('nanoid');

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

module.exports = {
	findForm,
	addAnswer,
};