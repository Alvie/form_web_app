'use strict';

function pageLoaded() {
    buildPage();
}

async function buildPage() {
    const main = document.querySelector('main');

    let data = await getJson();

    const heading = document.createElement("h2");
    heading.textContent = data.name;
    main.appendChild(heading);

    addQuestions(data.questions);

    addSubmit(main);
}

async function getJson() {
    const response = await fetch("./example.json");
    const data = await response.json();

    return data;
}

async function submitMessage() {

    let inputs = getInputs();
    console.log(inputs);

    const response = await fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputs)
    });

    if (!response.ok) {
        console.warn('motd not submitted correctly', response);
    } else {
        console.log('submitted successfully');
    }

    console.log(response.textContent);

    loadMessage();

}

function getInputs() {
    let inputs = document.querySelectorAll('input');
    let jsonobj = {};

    for (let inputElem of inputs) {
        if (inputElem.type === "text" || inputElem.type === "number") {
            jsonobj[inputElem.id] = inputElem.value;
        }
        else if (inputElem.checked) {
            if (jsonobj[inputElem.name] == null) {
                jsonobj[inputElem.name] = [inputElem.value];
            } else {
                jsonobj[inputElem.name].push(inputElem.value);
            }

        }
        else {
            if (jsonobj[inputElem.name] == null) {
                jsonobj[inputElem.name] = [];
            }
        }

    }

    return jsonobj;

}

async function loadMessage() {
    const response = await fetch('/submit');
    if (!response.ok) {
        console.error('cannot get motd', response);
        return;
    }

    const text = await response.text();

    document.querySelector("h2").textContent = text;
}


function addSubmit(main) {

    const submit = document.createElement("button");

    submit.textContent = "submit";
    submit.id = "#btnSubmit";

    submit.addEventListener('click', submitMessage);

    main.appendChild(submit);

}



function addQuestions(arrQuestions) {

    const main = document.querySelector('main');

    for (const question of arrQuestions) {
        const heading = document.createElement("h3");
        heading.textContent = question.text;
        main.appendChild(heading);

        if (question.type === "text" || question.type === "number") {
            const questionElem = document.createElement("input");
            questionElem.type = question.type;
            questionElem.id = question.id;
            main.appendChild(questionElem);
        } else if (question.type === "single-select" || question.type === "multi-select") {
            const optionSection = document.createElement("section");
            optionSection.classList.add("option");
            for (const option of question.options) {

                const questionLabel = document.createElement("label");
                const questionElem = document.createElement("input");
                if (question.type === "single-select") {
                    questionElem.type = "radio";
                }
                else {
                    questionElem.type = "checkbox";
                }
                questionElem.name = question.id;
                questionElem.value = option;

                questionLabel.append(questionElem);
                questionLabel.append(option);
                optionSection.appendChild(questionLabel);
            }
            main.appendChild(optionSection);
        }
    }
}



window.addEventListener("load", pageLoaded);