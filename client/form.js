'use strict';

// get formId function (return substring after # in url
// e.g. form#example returns 'example')
function getFormId() { return window.location.hash.substring(1); }

// get form JSON function
async function getFormJson() {
	// getId
	const id = getFormId();
	// GET request for form with id
	const response = await fetch(`forms/${id}`);
	let formJson = {};
	if (response.ok) {
		// formJson = e.g. {name:'', questions: []}
		formJson = await response.json();
	} else {
		formJson = { error: 'No form exists with this ID.' };
	}
	return formJson;
}

// function to add questions to main from provided array of questions
function addQuestions (arrQuestions) {

	const main = document.querySelector('main');
	// for each question, add question and input / select element depending on type
	for (const question of arrQuestions) {
		// create heading of the text of question
		const heading = document.createElement('h3');
		heading.textContent = question.text;
		main.appendChild(heading);

		if (question.type === 'text' || question.type === 'number') {
			// create input element, add id and type and append to main
			const questionElem = document.createElement('input');
			questionElem.classList.add('submitItem');
			questionElem.type = question.type;
			questionElem.id = question.id;
			main.appendChild(questionElem);
		} else if (question.type === 'single-select' || question.type ===
			'multi-select') {
			// create select element, add id
			const optSelection = document.createElement('select');
			optSelection.id = question.id;
			optSelection.classList.add('submitItem');
			
			// create hidden empty option and append to optSelection
			// so first option isn't selected as default
			const emptyOption = document.createElement('option');
			emptyOption.value = '';
			emptyOption.disabled = true;
			emptyOption.selected = true;
			emptyOption.hidden = true;
			optSelection.appendChild(emptyOption);

			// for each option, create option element with said option 
			// and append to optSelection element.
			for (const option of question.options) {
				const optionElem = document.createElement('option');				
				optionElem.value = option;
				optionElem.textContent = option;
				optSelection.appendChild(optionElem);
			}
			if (question.type === 'multi-select') {
				// if type is multi-select add multple option to optSelection
				optSelection.multiple = true;
				// add notice saying client may choose multiple
				const notice = document.createElement('p');
				notice.textContent = 'You can select multiple options';
				main.appendChild(notice);

				// following code prevents default so holding CTRL / Shift is not necessary
				optSelection.onmousedown = function(e) {
					e.preventDefault();
					let st = this.scrollTop;
					e.target.selected = !e.target.selected;
					setTimeout(() => this.scrollTop = st, 0);
					this.focus();
				};

				optSelection.onmousemove= function(e) {
					e.preventDefault();
				};
				// remove prevent default if on touch
				// (so touch devices can provide	default functions)
				optSelection.ontouchstart = function() {optSelection.onmousedown = null;};
				
			}
			main.appendChild(optSelection);
		}
	}
}
// get inputs function
// called in submitForm
function getInputs () {
	const inputs = document.querySelectorAll('.submitItem');
	let jsonobj = {};
	// for each input element, add id and value to jsonObj
	for (const inputElem of inputs) {
		if (inputElem.type === 'text') {
			jsonobj[inputElem.id] = inputElem.value;
		} else if (inputElem.type === 'number') {
			jsonobj[inputElem.id] = Number(inputElem.value); // convert to Number
		} else if (inputElem.tagName === 'SELECT') {
			if (inputElem.multiple === true) {
				// if <select multiple>, get array from the selected options
				jsonobj[inputElem.id] = 
				Array.from(inputElem.selectedOptions)
					.map(option => option.value)
					.filter(item => item !== '');
			} else{
				// if <select>, get value and add to jsonObj
				jsonobj[inputElem.id] = inputElem.value;
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
		// disallow multiple submissions
		const btnSubmit = document.querySelector('#btnSubmit');
		btnSubmit.disabled = true;
		// send success message
		const msgSuccess = document.createElement('p');
		msgSuccess.textContent = 'Thanks for submitting!';
		msgSuccess.classList.add('success');
		document.body.appendChild(msgSuccess);
	}

}

// add Submit function
// called on buildPage
function addSubmit (main) {

	// adds a submit button to form
	const submit = document.createElement('button');
	submit.textContent = 'Submit';
	submit.id = 'btnSubmit';
	// add event listener to submitForm (function) on click
	submit.addEventListener('click', submitForm);

	main.appendChild(submit);
}

// build page function
// adds headings, questions and submit button
async function buildPage() {
	const main = document.querySelector('main');
	const heading = document.createElement('h2');

	let data = await getFormJson();

	// if data is object that contains .error
	if (data.error !== undefined) {
		// set heading to Error
		heading.textContent = 'Error';
		main.appendChild(heading);
		return; // do not continue
	}
	// set title and heading to data.name (i.e. form's name) and append to main
	heading.textContent = data.name;
	document.title = data.name;
	main.appendChild(heading);
	addQuestions(data.questions); // add question elems from data.questions (i.e. form questions)
	addSubmit(main); // add submit button to end of form
}


// page loaded function
// call buildPage
function pageLoaded() {
	buildPage();
}

// add listener for when page loads and call pageLoaded function
window.addEventListener('load', pageLoaded);