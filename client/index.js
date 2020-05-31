'use strict';

function pageLoaded () {
	addListeners();
}

function createAndAppend(content, parent){
	const newElem = document.createElement('p');
	newElem.textContent = content;
	parent.appendChild(newElem);
}

function createAndAppendLink(href, place, parent){
	const newElem = document.createElement('p');
	newElem.textContent = `Link to ${place}: `;
	const link = document.createElement('a');
	link.textContent = `${place}`;
	link.href = href;
	newElem.appendChild(link);
	parent.appendChild(newElem);
}

async function populateAnswerZone() {
	//const formArray = some http request.
	const idObj = {
		'idToken': localStorage.getItem('idToken')
	};
	const viewAnswerZone = document.querySelector('#viewAnswerZone');
	viewAnswerZone.textContent = '';
	const response = await fetch('/all-user-forms', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(idObj)
	});
	const formArray = await response.json();
	console.log(formArray);
	for (const formDetailObj of formArray.userFormObjs) {
		const formItem = document.createElement('section');
		formItem.classList.add('formItem');
		createAndAppend(formDetailObj.formName, formItem);
		createAndAppendLink(`/form#${formDetailObj.formId}`, 'Form', formItem);
		createAndAppendLink(`/answers/${formDetailObj.answersId}`, 'Answers', formItem);
		createAndAppend(`Form ID: ${formDetailObj.formId}`, formItem);
		createAndAppend(`Answers ID: ${formDetailObj.answersId}`, formItem);
		viewAnswerZone.appendChild(formItem);
	}

	
}


// eslint-disable-next-line no-unused-vars
async function onSignIn(gUser) { //when/if user is signed in.	
	const btnSignOut = document.querySelector('#btnSignOut');
	btnSignOut.disabled = false;
	btnSignOut.textContent = 'SIGN OUT';
	const idToken = gUser.getAuthResponse().id_token; // get token
	localStorage.setItem('idToken', idToken); // and set in local storage
	populateAnswerZone();
}

// eslint-disable-next-line no-unused-vars
async function onSignOut() {
	localStorage.setItem('idToken', 'null');
	const btnSignOut = document.querySelector('#btnSignOut');
	const viewAnswerZone = document.querySelector('#viewAnswerZone');
	viewAnswerZone.textContent = '';
	createAndAppend('You must be signed in to view this section', viewAnswerZone);
	btnSignOut.disabled = true;
	btnSignOut.textContent = 'SIGNED OUT';
	// eslint-disable-next-line no-undef
	const auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
	});
}

function decideUpload() {
	const inputFile = document.querySelector('#newFile');
	const btnUpload = document.querySelector('#btnUpload');

	if(inputFile.files.length == 0 ){ 
		console.log('empty');
	} else {
		// get file extension
		if (inputFile.files[0].name.split('.')[1].toLowerCase() !== 'json') {
			console.log('wrong file type');
			// add disable button class if it not already existing
			if (!btnUpload.classList.contains('disableBtn')){
				btnUpload.disabled = true;
				btnUpload.classList.add('disableBtn');
			}
		} else {
			btnUpload.disabled = false;
			btnUpload.classList.remove('disableBtn');
		}
	}
}

async function getJsonContents(inputFile) {
	const reader = new FileReader();
	return new Promise((resolve, reject) => {
		reader.onerror = () => {
			reader.abort();
			reject(new DOMException('Problem parsing input file.'));
		};
		reader.onload = () => {
			resolve(reader.result);
		};
		reader.readAsText(inputFile);
	});
}

async function uploadJson() {
	const btnUpload = document.querySelector('#btnUpload');
	const inputFile = document.querySelector('#newFile');

	btnUpload.classList.add('disableBtn');
	btnUpload.disabled = true;

	let payloadObj = {};
	payloadObj['form'] = JSON.parse(await getJsonContents(inputFile.files[0]));
	if (localStorage.getItem('idToken') !== null) {
		payloadObj['idToken'] = localStorage.getItem('idToken');
	} else {
		payloadObj['idToken'] = '';
	}

	const response = await fetch('/upload-form', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payloadObj)
	});

	if (!response.ok) {
		console.warn('unsuccessful', response);
	} else {
		const data = await response.json();

		const secFormDetails = document.querySelector('#formDetailsHidden');
		const formIdSpan = document.querySelector('#formIdSpan');
		const formLinkSpan = document.querySelector('#formLinkSpan');
		formIdSpan.textContent = data.formId;

		const answersIdSpan = document.querySelector('#answersIdSpan');
		const answersLinkSpan = document.querySelector('#answersLinkSpan');
		answersIdSpan.textContent = data.answersId;

		const formIdLink = document.createElement('a');
		const formURL = `${window.location.origin}/form#${data.formId}`;
		formIdLink.href = formURL;
		formIdLink.textContent = formURL;
		formIdLink.target = '_blank';
		formLinkSpan.appendChild(formIdLink);

		const answersIdLink = document.createElement('a');
		const respURL = `${window.location.origin}/answers/${data.answersId}`;
		answersIdLink.href = respURL;
		answersIdLink.textContent = respURL;
		answersIdLink.target = '_blank';
		answersLinkSpan.appendChild(answersIdLink);
		secFormDetails.id = 'formDetails';
	}

}

function addListeners() {
	const inputFile = document.querySelector('#newFile');
	inputFile.addEventListener('change', decideUpload);
	const btnUpload = document.querySelector('#btnUpload');
	btnUpload.addEventListener('click', uploadJson);
	const btnSignOut = document.querySelector('#btnSignOut');
	btnSignOut.addEventListener('click', onSignOut);
}

window.addEventListener('load', pageLoaded);