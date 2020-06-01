'use strict';

// page loaded function
// adds event listeners
function pageLoaded () {
	addListeners();
}


// create question element function
//     - supply a type 'text' | 'number' | 'single-select' | 'multi-select'
function createQuestionElem(type) {
	// create section element, questionElem
	const questionElem = document.createElement('section');
	questionElem.classList.add('questionObj');

	// create span element containing the type as its value and text content
	const typeSpan = document.createElement('span');
	typeSpan.classList.add('typeSpan');
	typeSpan.value = type;
	typeSpan.textContent = type;

	// create p element with an input asking for id
	const questionIDText = document.createElement('p');
	questionIDText.textContent = 'Question ID';
	const questionID = document.createElement('input');
	questionID.type = 'text';
	questionID.name = 'id';

	// create p element with an input asking for text
	const questionTextText = document.createElement('p');
	questionTextText.textContent = 'Question Text';
	const questionText = document.createElement('input');
	questionText.type = 'text';
	questionText.name = 'text';

	// append above elements to questionElem
	questionElem.appendChild(typeSpan);
	questionElem.appendChild(questionIDText);
	questionElem.appendChild(questionID);
	questionElem.appendChild(questionTextText);
	questionElem.appendChild(questionText);

	if (type === 'single-select' | type === 'multi-select'){
		// if type is select, create additional element asking for valid options
		const validOptionsText = document.createElement('p');
		validOptionsText.textContent = 'Please enter the valid options (separate by commas)';
		const validOptions = document.createElement('input');
		validOptions.type = 'text';
		validOptions.name = 'options';
		// append above elements to questionElem
		questionElem.appendChild(validOptionsText);
		questionElem.appendChild(validOptions);
	}

	// append questionElem to formCreator
	const formCreator = document.querySelector('#formCreator');
	formCreator.appendChild(questionElem);
}


// Jsonify function
// converts page to a valid JSON object
function Jsonify() {
	// get formName from input
	const formName = document.querySelector('#formNameInput').value;
	// get all question objects
	const questionObjs = document.querySelectorAll('.questionObj');
	let idArray = [];
	// create initial formJson object
	let formJson = {'name': formName, questions: []};

	// for each question, create an object containing id, text, type, and options (if select)
	for (const questionObj of questionObjs) {
		let internalJson = {};
		// for each input element within question object
		const questionInputs = questionObj.querySelectorAll('input');
		for (const q of questionInputs){
			if (q.name === 'id' | q.name === 'text'){
				// add value and attribute to internal JSON object
				internalJson[q.name] = q.value;
				if (q.name === 'id'){
					if (idArray.includes(q.value)){
						// if same id is re-used multiple times, show err msg & return nothing
						const main = document.querySelector('main');
						const errorElem = document.createElement('p');
						errorElem.textContent = `Form not created (${q.value} is used multiple times)`;
						main.appendChild(errorElem);
						return;
					} else {
						// add id to array (can later be checked for re-use)
						idArray.push(q.value);
					}
				}
			} else {
				// if option, then split and trim each option to array
				internalJson[q.name] = q.value.split(',').map(item => item.trim());
			}
			
		}
		// get type of question from value of the typeSpan element
		const typeSpan = questionObj.querySelector('.typeSpan');
		internalJson['type'] = typeSpan.value;
		// append internal JSON object of question {id, text, type, (options)}
		// to formJson.questions
		formJson['questions'].push(internalJson);
		
	}
	return formJson;
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
	const idToken = gUser.getAuthResponse().id_token; // get token
	localStorage.setItem('idToken', idToken); // and set in local storage
}

// sign out function
async function onSignOut() {
	// set idToken in localStorage to '' (no user)
	localStorage.setItem('idToken', '');
	const btnSignOut = document.querySelector('#btnSignOut');
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
// create form function
// called when client clicks upload button
async function createForm() {
	const secFormDetails = document.querySelector('#formDetailsHidden');
	const btnCreateForm = document.querySelector('#btnCreateForm');
	const localToken = localStorage.getItem('idToken');
	btnCreateForm.disabled = true; // disallow multiple creations

	// hide form details on each upload. Make visible later if response.ok
	if (secFormDetails){ secFormDetails.id = 'formDetailsHidden'; }

	// get JSON from html elements
	const formJson = Jsonify();
	if (!formJson) {
		// if formJson is null, log error and don't continue
		console.log('error');
		return;
	}

	let payloadObj = {};
	// and add formJson to payloadObj.form
	payloadObj['form'] = formJson;

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
		const main = document.querySelector(main);
		const errorElem = document.createElement('p');
		errorElem.textContent = 'The creation was unsucessful';
		main.appendChild(errorElem);
	} else {
		// if successful, response.json() will contain an object
		// with a .formId and .answersId
		const data = await response.json();
		// pass data (object) to populateFormDetails
		populateFormDetails(data);
	}
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
	// clear current links (if user manually enables button and
	//                          creates form, this is necessary)
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
function addListeners(){
	const formDrop = document.querySelector('#formCreator');
	const dragObjs = document.querySelectorAll('#formObjects ul li');
	// prevent default functions of drag over
	formDrop.addEventListener('dragover', (e) => {
		e.preventDefault();
	});
	// get text on drop, and call createQuestionElemt to build inputs
	// form question of type from text
	formDrop.addEventListener('drop', (e) => {
		e.preventDefault(); // Prevent firefox redirects 
		let questionType = e.dataTransfer.getData('text/plain');
		createQuestionElem(questionType);
	});
	
	// for each of the drag objects, when dragstart, set data transfer
	// of the value of the element (i.e. text | number | single-select | multi-select)
	dragObjs.forEach(dragObj => {
		dragObj.addEventListener('dragstart', (e) => {
			e.dataTransfer.setData('text/plain', event.target.getAttribute('value'));  
		});
	});

	// when btnCreateForm is clicked, upload the JSON to server (createForm function)	
	const btnCreateForm = document.querySelector('#btnCreateForm');
	btnCreateForm.addEventListener('click', createForm);

	// when btnSignOut is clicked, call onSignOut function
	const btnSignOut = document.querySelector('#btnSignOut');
	btnSignOut.addEventListener('click', onSignOut);
}

// add listener for when page loads and call pageLoaded function
window.addEventListener('load', pageLoaded);