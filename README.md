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
	"responses" : ["Array of answer objects"]
}
```

An example can be viewed here: `http://localhost:8080/answers/example`
If it is currently empty, add responses: `http://localhost:8080/form#example`


#### View responses sorted by question

Authors may view the responses of their forms with the answer link at `http://localhost:8080/answers/question-sort/{id}`. This will be a .json format structured as such:

```json
{
	"q1" : ["Array of answers"],
	"q2" : ["Array of answers"],
	"q3" : ["Array of answers"],
	"q4" : ["Array of answers"]
}
```
`answers` will be String / Number / Array of Strings depending on the type of question

An example can be viewed here: `http://localhost:8080/answers/question-sort/example`
If it is currently empty, add responses: `http://localhost:8080/form#example`

## Design and Implementation Rationale

From the beginning, the web application was built so that it would work with multiple forms and not only that supplied by the example JSON file.

## Page builder and input catcher

The first feature to be created was the ability to build a page from a local JSON file. This was eventually successful, but filling in answers without them going anywhere was pointless. After this was realised, a function was created to get all inputs in a desirable format. Following this, a HTTP post function was created so the server may receive 'answers', but could not yet do anything with these. That's where the database comes in...

## Database

The next feature to be created was the stored response in a database. This then meant that a database had to be created and SQLite was chosen as no additional applications outside of node are required. Upon creation, I decied only two tables were needed `Forms` and `Answers`

As a `Form` can have many `Answer`, they are linked by a foreign key. The database was adjusted and changed over time. For example, upon realising that any client will easily be able to view answers with the Form ID, a new attribute `answersId` was created so there is no link between the two.

## CSS

Only after the core functionality of the ability to fill in a questionnaire and store responses, was the CSS created. A highly legible sans-serif font, 'Inter' was chosen and a minimal style is used. A mobile first implementation is employed.

## Get answers

As answers were only a JSON file and thus no styling was needed, this was not done before the CSS. This was a pretty simple feature to implement with a get request based on URL ID. Originally this used the same ID as the form ID, but was changed to use an answer ID.

## Form upload and Form creation GUI

### Form upload

This was mainly created so other forms can be easily added to the database without having to run SQL commands manually. An input file in the homepage accepts .json files and sends them to a server that stores it in a folder. It is not assigned the same name as it was uploaded, due to it having the ability to cause conflicts if multiple files had the same name. Instead the server creates a unique ID, which is used as the Form.id for the database as well as the JSON file name.

Eventually, this was somewhat adjusted so that if the user is signed in (via Google Auth), an object containing both the id token and a parsed version of the file would be submitted.

### Form creation GUI

So far, the web application was lacking any inventiveness (apart from maybe the get answers sorted by questions?), so I decided to create a drag and drop form creator. This was using the draggable attribute of elements as well as dragStart / drop inputs.

With this, I then had to create a function that when dropped, creates an element with input sub elements to get attributes such as id, text, and options (if type is select).

Following that, a function to get all questions and their attributes was created, and the same HTTP POST as the one used for uploading a file was used here.

## Sign in

This feature was created so a user can sign in to the home page / form creator and have any forms they author be related to their user ID. Google OAuth was used for this and the `google-auth-library` was installed in npm.

This in turn, created a few changes, such as:

- `userId` having to be an attribute of form
- HTTP POST /upload-form having to be adjusted to allow for an idToken as well as the form
- use of localStorage to store tokens / remove on sign out

## Refactor

Once the web application was fully built, every function was looked at and seen if needed to be simpler / split up. A few simple name changes were done as well as some actions being turned into its own function rather than as a part of a larger one. (The larger one will now call the function). There are still a few functions that can (/should) be refactored but given time constraints, this did not happen.