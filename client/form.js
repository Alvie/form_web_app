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
			questionElem.classList.add('submitItem');
			questionElem.type = question.type;
			questionElem.id = question.id;
			main.appendChild(questionElem);
		} else if (question.type === 'single-select' || question.type ===
			'multi-select') {
			const optSelection = document.createElement('select');
			optSelection.id = question.id;
			optSelection.classList.add('submitItem');

			const emptyOption = document.createElement('option');
			emptyOption.value = '';
			emptyOption.disabled = true;
			emptyOption.selected = true;
			emptyOption.hidden = true;
			optSelection.appendChild(emptyOption);

			for (const option of question.options) {
				const optionElem = document.createElement('option');				
				optionElem.value = option;
				optionElem.textContent = option;
				optSelection.appendChild(optionElem);
			}
			if (question.type === 'multi-select') {
				optSelection.multiple = true;
				const notice = document.createElement('p');
				notice.textContent = 'You can select multiple options';
				main.appendChild(notice);

				optSelection.onmousedown = function(e) {
					e.preventDefault();
					let st = this.scrollTop;
					e.target.selected = !e.target.selected;
					setTimeout(() => this.scrollTop = st, 0);
					this.focus();
				};

				optSelection.ontouchstart = function() {optSelection.onmousedown = null;};
				
				optSelection.onmousemove= function(e) {
					e.preventDefault();
				};
			}
			main.appendChild(optSelection);
		}
	}
}

function getInputs () {
	const inputs = document.querySelectorAll('.submitItem');
	let jsonobj = {};
	
	for (const inputElem of inputs) {
		if (inputElem.type === 'text') {
			jsonobj[inputElem.id] = inputElem.value;
		} else if (inputElem.type === 'number') {
			jsonobj[inputElem.id] = Number(inputElem.value);
		} else if (inputElem.tagName === 'SELECT') {
			if (inputElem.multiple === true) {
				jsonobj[inputElem.id] = 
				Array.from(inputElem.selectedOptions)
					.map(option => option.value)
					.filter(item => item !== '');
			} else{
				jsonobj[inputElem.id] = inputElem.value;
			}
		}
	}
	console.log(jsonobj);
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

	const btnSubmit = document.querySelector('#btnSubmit');
	btnSubmit.disabled = true;
	btnSubmit.classList.add('disableBtn');
	const msgSuccess = document.createElement('p');
	msgSuccess.textContent = 'Thanks for submitting!';
	msgSuccess.classList.add('success');
	document.body.appendChild(msgSuccess);

}

function addSubmit (main) {
	const submit = document.createElement('button');
	submit.textContent = 'Submit';
	submit.id = 'btnSubmit';

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