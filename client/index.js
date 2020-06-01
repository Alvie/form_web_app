'use strict';


// page loaded function
// adds event listeners
function pageLoaded () {
	addListeners();
}

// creates and appends a <p> elem with specified
// text content to specified parent
function createAndAppend(content, parent){
	const newElem = document.createElement('p');
	newElem.textContent = content;
	parent.appendChild(newElem);
}

// creates and appends a <p> elem with nested <a>
// with specified href, place, text conent
// to specified parent
function createAndAppendLink(href, place, content, parent){
	const newElem = document.createElement('p');
	newElem.textContent = `Link to ${place}: `;
	const link = document.createElement('a');
	link.textContent = `${content}`;
	link.href = href;
	link.target = '_blank'; // open in new tab
	newElem.appendChild(link); // nest <a> link in <p>
	parent.appendChild(newElem);
}

// populates answer zone
// called upon sign in
// adds details of Forms
async function populateFormsZone() {
	//const formArray = some http request.
	const idToken =  localStorage.getItem('idToken');
	const viewForms = document.querySelector('#viewForms');
	// remove existing content from viewForms section
	viewForms.textContent = '';

	// make request to get details of all forms
	// related to logged in user
	const response = await fetch(`/all-user-forms/${idToken}`);
	const formArray = await response.json();

	// if user has no forms associated, display message
	if (formArray.userFormObjs.length === 0){
		createAndAppend('You currently have no forms associated with your user', viewForms);
		return; // do not continue with function
	}

	// for each form of the array of forms, add it to viewForms
	for (const formDetailObj of formArray.userFormObjs) {
		createFormItemSection(formDetailObj);
	}
}

// create form item section function
//    - supply a formDetailObj e.g. {formName, formId, answersId}
//    appends to viewForms
function createFormItemSection(formDetailObj) {
	const viewForms = document.querySelector('#viewForms');
	// create section of class formItem
	const formItem = document.createElement('section');
	formItem.classList.add('formItem');
	// append details such as names and links to formItem section
	createAndAppend(formDetailObj.formName, formItem);
	createAndAppendLink(`/form#${formDetailObj.formId}`, 'Form', 'Form', formItem);
	createAndAppendLink(`/answers/${formDetailObj.answersId}`, 'Answers', 'Answers', formItem);
	createAndAppend(`Form ID: ${formDetailObj.formId}`, formItem);
	createAndAppend(`Answers ID: ${formDetailObj.answersId}`, formItem);
	// append formItem section as a child of viewForms
	viewForms.appendChild(formItem);
}

// sign in function (google Auth)
//     - supply a gUser (handled by Google script in html)
// eslint-disable-next-line no-unused-vars
async function onSignIn(gUser) { //when/if user is signed in.	
	// allow sign out button to be clickable, and say 'SIGN OUT'
	const btnSignOut = document.querySelector('#btnSignOut');
	btnSignOut.disabled = false;
	btnSignOut.textContent = 'SIGN OUT';
	// get idToken from authResponse and store it in localStorage
	const idToken = gUser.getAuthResponse().id_token;
	localStorage.setItem('idToken', idToken);
	// users may have forms already, populate forms zone with their forms
	populateFormsZone();
}

// sign out function
async function onSignOut() {
	// set idToken in localStorage to '' (no user)
	localStorage.setItem('idToken', '');
	const btnSignOut = document.querySelector('#btnSignOut');
	const viewForms = document.querySelector('#viewForms');
	// remove any existing form information from viewForms and display sign in msg
	viewForms.textContent = '';
	createAndAppend('You must be signed in to view this section', viewForms);
	// disabled sign out button and set to 'SIGNED OUT'
	btnSignOut.disabled = true;
	btnSignOut.textContent = 'SIGNED OUT';
	// handled by Google Script to sign out
	// eslint-disable-next-line no-undef
	const auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
	});
}

// function to make decision on upload
function decideUpload() {
	const inputFile = document.querySelector('#newFile');
	const btnUpload = document.querySelector('#btnUpload');

	if(inputFile.files.length == 0 ){ // if no file submitted
		console.log('empty');
	} else {
		// get file extension
		if (inputFile.files[0].name.split('.')[1].toLowerCase() !== 'json') {
			// if file is not .json / .JSON etc
			console.log('wrong file type');
			btnUpload.disabled = true;
		} else {
			// allow upload button to be clicked
			btnUpload.disabled = false;
		}
	}
}


// function to get JSON contents of a file
//     - supply an inputFile
async function getJsonContents(inputFile) {
	// instatiate a FileReader
	const reader = new FileReader();
	return new Promise((resolve, reject) => {
		reader.onerror = () => {
			reader.abort();
			reject(new DOMException('Problem parsing input file.'));
		};
		reader.onload = () => {
			// resolve with contents of reader (.result)
			resolve(reader.result);
		};
		reader.readAsText(inputFile);
	});
}

// upload json (form) function
// called when client clicks upload button
async function uploadJson() {
	const secUpload = document.querySelector('#upload');
	const secFormDetails = document.querySelector('#formDetails');
	const btnUpload = document.querySelector('#btnUpload');
	const inputFile = document.querySelector('#newFile');
	const localToken = localStorage.getItem('idToken');
	btnUpload.disabled = true; // disallow multiple uploads

	// hide form details on each upload. Make visible later if response.ok
	if (secFormDetails){ secFormDetails.id = 'formDetailsHidden'; }

	let payloadObj = {};
	
	try {
		// get contents of JSON file and add to payloadObj.form
		payloadObj['form'] = JSON.parse(await getJsonContents(inputFile.files[0]));
	} catch(err) {
		createAndAppend('The contents of the .json file does not parse as a JSON object', secUpload);
		console.log(err); // log error
		return; // do not continue
	}
	if (localToken !== null) {
		// set idToken to localToken (from localStorage)
		// may be '' (if signed in then signed out)
		payloadObj['idToken'] = localToken;
	} else {
		payloadObj['idToken'] = '';
	}

	// POST request to upload form with payloadObj ({idToken, form}) as body
	const response = await fetch('/upload-form', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payloadObj)
	});

	if (!response.ok) {
		console.warn('unsuccessful', response);
		createAndAppend('The JSON file submitted is not correctly formatted, perhaps questions is missing an id/text/type?', secUpload);
	} else {
		// if successful, response.json() will contain an object
		// with a .formId and .answersId
		const data = await response.json();
		// pass data (object) to populateFormDetails
		populateFormDetails(data);
	}
}

// populate form details function
//     - supply data (object containing formId & answerId)
//                    e.g. {formId, answersId}
function populateFormDetails(data){
	// select necessary elements
	const secFormDetails = document.querySelector('#formDetailsHidden');
	const formIdSpan = document.querySelector('#formIdSpan');
	const formLinkSpan = document.querySelector('#formLinkSpan');
	const answersIdSpan = document.querySelector('#answersIdSpan');
	const answersLinkSpan = document.querySelector('#answersLinkSpan');
	// populate spans with respective ids (form / answers)
	formIdSpan.textContent = data.formId;
	answersIdSpan.textContent = data.answersId;
	// clear current links (if multiple valid jsons uploaded, this is necessary)
	answersLinkSpan.textContent = '';
	formLinkSpan.textContent = '';
	// create links with anchors to form and answers
	const formURL = `${window.location.origin}/form#${data.formId}`;
	createAndAppendLink(formURL, 'form', formURL, formLinkSpan);
	const answersURL = `${window.location.origin}/answers/${data.answersId}`;
	createAndAppendLink(answersURL, 'answers', answersURL, answersLinkSpan);
	// set section id to formDetails (removes display: none) so it is visible
	if (secFormDetails) {secFormDetails.id = 'formDetails';}
}

// add listeners function
// called on page load
function addListeners() {
	// when inputFile changes, decide whether upload is allowed (decideUpload function)
	const inputFile = document.querySelector('#newFile');
	inputFile.addEventListener('change', decideUpload);

	// when btnUpload is clicked, upload the JSON to server (uploadJson function)
	const btnUpload = document.querySelector('#btnUpload');
	btnUpload.addEventListener('click', uploadJson);

	// when btnSignOut is clicked, call onSignOut function
	const btnSignOut = document.querySelector('#btnSignOut');
	btnSignOut.addEventListener('click', onSignOut);
}

// add listener for when page loads and call pageLoaded function
window.addEventListener('load', pageLoaded);