'use strict';

function pageLoaded () {
	addListeners();
}

function createQuestionElem(type) {
	const questionElem = document.createElement('section');
	questionElem.classList.add('questionObj');

	const typeSpan = document.createElement('span');
	typeSpan.classList.add('typeSpan');
	typeSpan.value = type;
	typeSpan.textContent = type;

	const questionIDText = document.createElement('p');
	questionIDText.textContent = 'Question ID';

	const questionID = document.createElement('input');
	questionID.type = 'text';
	questionID.name = 'id';

	const questionTextText = document.createElement('p');
	questionTextText.textContent = 'Question Text';

	const questionText = document.createElement('input');
	questionText.type = 'text';
	questionText.name = 'text';

	questionElem.appendChild(typeSpan);
	questionElem.appendChild(questionIDText);
	questionElem.appendChild(questionID);
	questionElem.appendChild(questionTextText);
	questionElem.appendChild(questionText);

	if (type === 'single-select' | type === 'multi-select'){
		const validOptionsText = document.createElement('p');
		validOptionsText.textContent = 'Please enter the valid options (separate by commas)';
		const validOptions = document.createElement('input');
		validOptions.type = 'text';
		validOptions.name = 'options';

		questionElem.appendChild(validOptionsText);
		questionElem.appendChild(validOptions);
	}

	const formCreator = document.querySelector('#formCreator');
	formCreator.appendChild(questionElem);

}

function Jsonify() {
	const formName = document.querySelector('#formNameInput').value;
	const questionObjs = document.querySelectorAll('.questionObj');
	let idArray = [];

	let formJson = {'name': formName, questions: []};

	for (const questionObj of questionObjs) {
		let internalJson = {};
		const questionInputs = questionObj.querySelectorAll('input');
		for (const q of questionInputs){
			if (q.name === 'id' | q.name === 'text'){
				internalJson[q.name] = q.value;
				if (q.name === 'id'){
					if (idArray.includes(q.value)){
						console.log('re-used IDs');
						console.log(idArray);
						return;
					} else {
						idArray.push(q.value);
					}
				}
			} else {
				internalJson[q.name] = q.value.split(',').map(item => item.trim());
			}
			
		}
		const typeSpan = questionObj.querySelector('.typeSpan');
		internalJson['type'] = typeSpan.value;
		formJson['questions'].push(internalJson);
		
	}
	return formJson;
}

async function createForm() {
	const btnCreateForm = document.querySelector('#btnCreateForm');
	btnCreateForm.disabled = true;
	btnCreateForm.classList.add('disableBtn');
	const formJson = Jsonify();
	if (!formJson) {
		console.log('error');
		return;
	}
	console.log(formJson);
	const response = await fetch('/upload-form', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(formJson)
	});

	if (!response.ok) {
		console.warn('unsuccessful', response);
	} else {
		const data = await response.json();

		const secFormDetails = document.querySelector('#formDetailsHidden');
		const formIdSpan = document.querySelector('#formIdSpan');
		const formLinkSpan = document.querySelector('#formLinkSpan');
		formIdSpan.textContent = data.formId;

		const respIdSpan = document.querySelector('#respIdSpan');
		const respLinkSpan = document.querySelector('#respLinkSpan');
		respIdSpan.textContent = data.respId;

		const formIdLink = document.createElement('a');
		const formURL = `${window.location.origin}/form#${data.formId}`;
		formIdLink.href = formURL;
		formIdLink.textContent = formURL;
		formIdLink.target = '_blank';
		formLinkSpan.appendChild(formIdLink);

		const respIdLink = document.createElement('a');
		const respURL = `${window.location.origin}/answers/${data.respId}`;
		respIdLink.href = respURL;
		respIdLink.textContent = respURL;
		respIdLink.target = '_blank';
		respLinkSpan.appendChild(respIdLink);
		secFormDetails.id = 'formDetails';
	}
}

function addListeners(){
	const formDrop = document.querySelector('#formCreator');
	const dragObjs = document.querySelectorAll('#formObjects ul li');
	const btnCreateForm = document.querySelector('#btnCreateForm');

	formDrop.addEventListener('dragover', (e) => {
		e.preventDefault();
	});
	formDrop.addEventListener('drop', (e) => {
		let questionType = e.dataTransfer.getData('text/plain');
		createQuestionElem(questionType);
	});
	
	dragObjs.forEach(dragObj => {
		dragObj.addEventListener('dragstart', (e) => {

			e.dataTransfer.setData('text/plain', event.target.getAttribute('value'));  
		});
	});

	btnCreateForm.addEventListener('click', createForm);
}



window.addEventListener('load', pageLoaded);