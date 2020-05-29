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
		console.log('successful');
	}

}

function addListeners() {
	const inputFile = document.querySelector('#newFile');
	inputFile.addEventListener('change', decideUpload);
	const btnUpload = document.querySelector('#btnUpload');
	btnUpload.addEventListener('click', uploadJson);
}

window.addEventListener('load', pageLoaded);