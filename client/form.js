'use strict';

function getFormId() { return window.location.hash.substring(1); }

async function getFormJson() {
	const id = getFormId();
	const response = await fetch(`forms/${id}`);
	let formJson = {};
	if (response.ok) {
		formJson = await response.json();
	} else {
		formJson = { error: 'No form exists with this ID.' };
	}
	return formJson;
}

function addQuestions (arrQuestions) {

	const main = document.querySelector('main');

	for (const question of arrQuestions) {
		const heading = document.createElement('h3');
		heading.textContent = question.text;
		main.appendChild(heading);

		if (question.type === 'text' || question.type === 'number') {
			const questionElem = document.createElement('input');
			questionElem.type = question.type;
			questionElem.id = question.id;
			main.appendChild(questionElem);
		} else if (question.type === 'single-select' || question.type ===
			'multi-select') {
			const optSelection = document.createElement('select');
			optSelection.id = question.id;
			for (const option of question.options) {
				const optionElem = document.createElement('option');
				optionElem.value = option;
				optionElem.textContent = option;
				optSelection.appendChild(optionElem);
			}
			if (question.type === 'multi-select') {optSelection.multiple = true;}
			main.appendChild(optSelection);
		}
	}
}

function getInputs () {
	let inputs = document.querySelectorAll('input');
	let jsonobj = {};

	for (let inputElem of inputs) {
		if (inputElem.type === 'text') {
			jsonobj[inputElem.id] = inputElem.value;
		} else if (inputElem.type === 'number') {
			jsonobj[inputElem.id] = Number(inputElem.value);
		} else if (inputElem.checked) {
			if (jsonobj[inputElem.name] == null) {
				if (inputElem.type === 'checkbox') {
					jsonobj[inputElem.name] = [inputElem.value];
				} else {
					jsonobj[inputElem.name] = inputElem.value;
				}
			} else {
				jsonobj[inputElem.name].push(inputElem.value);
			}

		} else {
			if (jsonobj[inputElem.name] == undefined) {
				if (inputElem.type === 'checkbox') {
					jsonobj[inputElem.name] = [];
				} else {
					jsonobj[inputElem.name] = '';
				}
			}
		}

	}
	return jsonobj;
}

async function submitForm () {
	let formSubmission = {
		id: getFormId(),
		answers: getInputs()
	};

	const response = await fetch('/submit-form', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(formSubmission)
	});

	if (!response.ok) {
		console.warn('form not submitted correctly', response);
	} else {
		console.log('submitted successfully');
	}

	console.log(response.textContent);

}

function addSubmit (main) {
	const submit = document.createElement('button');
	submit.textContent = 'submit';
	submit.id = '#btnSubmit';

	submit.addEventListener('click', submitForm);

	main.appendChild(submit);
}

async function buildPage() {
	const main = document.querySelector('main');
	const heading = document.createElement('h2');

	let data = await getFormJson();

	if (data.error !== undefined) {
		heading.textContent = 'Error';
		main.appendChild(heading);
		return;
	}
	heading.textContent = data.name;
	main.appendChild(heading);
	addQuestions(data.questions);
	addSubmit(main);
}

function pageLoaded() {
	buildPage();
}

window.addEventListener('load', pageLoaded);