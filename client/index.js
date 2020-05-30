'use strict';

function pageLoaded () {
	addListeners();
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

async function uploadJson() {
	const btnUpload = document.querySelector('#btnUpload');
	const inputFile = document.querySelector('#newFile');

	btnUpload.classList.add('disableBtn');
	btnUpload.disabled = true;

	console.log(inputFile.files[0]);

	const response = await fetch('/upload-form', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: inputFile.files[0]
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

function addListeners() {
	const inputFile = document.querySelector('#newFile');
	inputFile.addEventListener('change', decideUpload);
	const btnUpload = document.querySelector('#btnUpload');
	btnUpload.addEventListener('click', uploadJson);
}

window.addEventListener('load', pageLoaded);