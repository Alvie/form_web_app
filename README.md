# Questionnaire Coursework

## Installation

```shell
npm install
npm start
```
Open `http://localhost:8080` in a web browser

## Key Features

### Populate form pages from a JSON file

If a form exists in the Forms table, there will be an ID for the Form and a JSON file containing the name of the form and the questions.

The ID will be used as an identifier for the URL: `http://localhost:8080/form#{id}`
Currently there is one set up as an example: `http://localhost:8080/form#example`

On any `form` pages, if an ID exists for the #, the page will be built from the JSON file

### Create forms from a JSON file

You may upload your own JSON files as a form to the database. They must be of extension `.json` and the strucure must be:

```json
{
	"name" : "String",
	"questions" : ["Array of questions"]
}
```
where each question's structure must be:

```json
{
	"id" : "String",
	"text" : "String",
	"type" : "String",
	"options" : ["Array of Strings"]
}
```

If uploaded successfully, the server will respond with a share link to the form, and a view answer link. They are NOT the same so clients will not be able to view answers with the id of the share link. This will be presented to the user in a meaningful way.

If signed in, the form will be associated to the user.

### Create forms from a web builder [EXPERIMENTAL]

You may create forms using the experimental web builder at `http://localhost:8080/create`

It uses drag and drop and is usable on both desktop with mouse, or on mobile with touch (although you may have to hold the drag item for a second before it is draggable)

Once created, the server will respond with a share link to the form, and a view answer link. They are NOT the same so clients will not be able to view answers with the id of the share link. This will be presented to the user in a meaningful way.

If signed in, the form will be associated to the user.

### Google Auth signin to save form to user

If signed in on upload / creation of form, the form will be associated with that user.

This allows users to log in and view any forms they are authors of and quickly find the share links as well as the view answer link.

Non logged in users may still use the service, but will not be linked to any forms they create. They should be especially careful with keeping share and answer links safe.

### Submit forms to a database

On form submission on any form page `http://localhost:8080/form#{id}`, the client may submit their answers. This will then be checked by the server to ensure it's structure and the type of answers are correct. If it is correct, a success message will be shown on the client's web page

### View responses (JSON)

Authors may view the responses of their forms with the answer link at `http://localhost:8080/answers/{id}`. This will be a .json format structured as such:

```json
{
	"responses" : [Array of answer objects]
}
```

An example can be viewed here: `http://localhost:8080/answers/example`
If it is currently empty, add responses: `http://localhost:8080/form#example`


#### View responses sorted by question

Authors may view the responses of their forms with the answer link at `http://localhost:8080/answers/question-sort/{id}`. This will be a .json format structured as such:

```json
{
	"q1" : [Array of answers],
	"q2" : [Array of answers],
	"q3" : [Array of answers],
	"q4" : [Array of answers],
}
```
`answers` will be String / Number / Array of Strings depending on the type of question

An example can be viewed here: `http://localhost:8080/answers/question-sort/example`
If it is currently empty, add responses: `http://localhost:8080/form#example`

## Design and Implementation Rationale