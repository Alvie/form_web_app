'use strict';
const sqlite = require('sqlite');

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

async function findForm (urlId) {
	const db = await dbConn;
	const msg = db.get('SELECT jsonLocation FROM Forms WHERE urlLocation = ?', urlId);
	console.log(msg);
	return msg;
}

module.exports = {
	findForm,
};