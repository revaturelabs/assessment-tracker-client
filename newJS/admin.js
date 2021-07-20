let unaddedAssoc = document.getElementById("unaddedAssociates");
let addedAssoc = document.getElementById("addedAssociates");
let trainerInput = document.getElementById("batchTrainer");
let coTrainerInput = document.getElementById("batchCoTrainer");
let search = document.getElementById("searchAssociate");
const submit = document.getElementById("submitBatch");
const pythonPath = "http://ec2-34-204-173-118.compute-1.amazonaws.com:5000";
const bucketPath = "http://adam-ranieri-batch-1019.s3.amazonaws.com";
//const pythonPath = "http://localhost:5000";
//const bucketPath = "http://localhost:5500";

const associateEmailInput = document.getElementById("emailInput");
const associateFirstNameInput = document.getElementById("firstNameInput");
const associateLastNameInput = document.getElementById("lastNameInput");


/** Function that creates a new associate, 
 * and adds it to the unadded associates list
 */
async function createNewAssociate() {
	associateEmailInput.classList.remove("is-invalid");
	associateFirstNameInput.classList.remove("is-invalid");
	associateLastNameInput.classList.remove("is-invalid");

	if (
		isInputValid(
			associateEmailInput,
			associateFirstNameInput,
			associateLastNameInput
		)
	) {
		const associateEmail = associateEmailInput.value;
		associateEmailInput.value = "";

		const associateFirstName = associateFirstNameInput.value;
		associateFirstNameInput.value = "";

		const associateLastName = associateLastNameInput.value;
		associateLastNameInput.value = "";

		const config = {
			method: "POST",
			mode: "cors",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				firstName: associateFirstName,
				lastName: associateLastName,
				email: associateEmail,
				trainingStatus: "",
			}),
		};

		const response = await fetch(pythonPath + "/associates", config);

		if (response.status == 201) {
			$("#newAssociateModal").modal("hide");
			let result = await response.json();
			unaddedAssoc.innerHTML += `<li class="associateList" name="${result.id}">${result.firstName} ${result.lastName}<input class="associateCheck" onclick="clickAssociate(this.parentElement)" type="checkbox"></li>`;
		} else {
			alert("There was an error while creating the associate");
		}
	} else {
		return false;
	}
}
/** Function that validates input using regex.
 * Checks that email is valid format blank@blank.blank
 * Checks that first name and last name are purely alphabetical
 * 
 * @param {String} email 
 * @param {String} firstName 
 * @param {String} lastName 
 * @returns {boolean} true if valid input, false if invalid input
 */
function isInputValid(email, firstName, lastName) {
	let valid = true;
	if (
		!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
			email.value
		)
	) {
		email.classList.add("is-invalid");
		valid = false;
	}
	if (!/[a-zA-Z]/.test(firstName.value)) {
		firstName.classList.add("is-invalid");
		valid = false;
	}
	if (!/[a-zA-Z]/.test(lastName.value)) {
		lastName.classList.add("is-invalid");
		valid = false;
	}
	return valid;
}

/** Cheks that name and track are strings containing only the alphabet, numbers,
 * and some special characters
 * Checks that trainer and cotrainer are not the same
 * Checks that start date is before endate
 * 
 * @param {String} name 
 * @param {String} track 
 * @param {String} trainer 
 * @param {String} cotrainer 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {boolean} true if valid input, false if invalid input
 */
function validateBatchInfo(name, track, trainer, cotrainer, startDate, endDate){
	
	if(name === "" | track==="" | trainer === "" | endDate === ""){
		return false;
	} 

	if(
		!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]/.test(name) | 
		!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]/.test(track)
	){ return false;}

	if(trainer === cotrainer) return false;

	if(startDate > endDate) return false;

	return true;
}

/** This function populates the select field for trainers and cotrainers
 * from the database.
 * 
 */
async function getAllTrainers(){
	const config = {
		method: "GET"
	};
	const response = await fetch(pythonPath + "/trainers", config);
	if(response.status===200){
		const trainers = await response.json();
		for(trainer of trainers){
			if(!trainer.admin){
				trainerInput.innerHTML += `<option name="${trainer.id}">${trainer.firstName} ${trainer.lastName}</option>`;
				coTrainerInput.innerHTML += `<option name="${trainer.id}">${trainer.firstName} ${trainer.lastName}</option>`; 
			}
		}
	}
}

/** This function populates the unadded associates list with associates from
 * the database.
 * 
 */
async function getAllAssociates() {
	const config = {
		method: "GET",
	};
	const response = await fetch(pythonPath + "/associates", config);
	const associates = await response.json();
	for (index in associates) {
		unaddedAssoc.innerHTML += `<li class="associateList" name="${associates[index].id}">${associates[index].firstName} ${associates[index].lastName}<input class="associateCheck" onclick="clickAssociate(this.parentElement)" type="checkbox"></li>`;
	}
}


/** This function specifies what to do when a checkbox is clicked. 
 * Namely it switches the list element between the two unordered lists
 * 
 * @param {HTMLElement} listItem The list that the checkbox resides in
 */
function clickAssociate(listItem) {
	const parentList = listItem.parentElement;
	if (parentList === addedAssoc) {
		unaddedAssoc.appendChild(listItem);
	} else {
		addedAssoc.appendChild(listItem);
	}
}

/** This function reduces the amount of displayed associates based on whether
 * the associates first and last name contain
 * the text in the search bar
 * 
 */
function filterList() {
	let input = search.value.toUpperCase();
	const associates = unaddedAssoc.children;

	// Associate is the list element in this for loop
	for (associate of associates) {
		let assocName = associate.innerText;
		if (!assocName.toUpperCase().includes(input))
			associate.style.display = "none";
		else associate.style.display = "";
	}
}

/** Creates a batch and calls registerAssociatesToBatch and 
 * registerTrainerToBatch.
 * 
 * @returns {Alert} returns an alert if batch inputs are invalid
 */
async function createBatch() {
	let nameInput = document.getElementById("nameInput").value;
	let trackInput = document.getElementById("trackInput").value;
	const start = document.getElementById("startDate").value;
	const end = document.getElementById("endDate").value;
	let startDate = new Date(start).getTime() / 1000;
	let endDate = new Date(end).getTime() / 1000;

	// get the ids from the select tag
	const trainerOption = trainerInput.options[trainerInput.selectedIndex];
	const cotrainerOption = coTrainerInput.options[coTrainerInput.selectedIndex];
	console.log(cotrainerOption);
	const trainerId = Number(trainerOption.getAttribute("name"));
	let cotrainerId = null;

	// checks if there is a cotrainer
	if(cotrainerOption.innerText !== "--Select a Cotrainer--")
		cotrainerId = Number(cotrainerOption.getAttribute("name"));
	console.log(cotrainerId);

	//boolean variables to see if associates and trainers are properly registered
	let associateStatus = false;
	let trainerStatus = false;

	// checks values for input errors
	const goAhead = validateBatchInfo(nameInput, trackInput, trainerInput, coTrainerInput, startDate, endDate);
	if(!goAhead){
		return alert("Problem with one or more fields");	
	}

	const req = {
		name: nameInput,
		trainingTrack: trackInput,
		startDate: startDate,
		endDate: endDate,
	};

	const config = {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req),
	};

	const resp = await fetch(pythonPath + "/batches", config);
	if (resp.status == 201) {
		const batchId = Number(await resp.json());
		associateStatus = await registerAssociatesToBatch(batchId);
		const leadStatus = await registerTrainerToBatch(trainerId, batchId, "Lead");
		let coLeadStatus = false;
		if(cotrainerId !== null & cotrainerId !== undefined)
			coLeadStatus = await registerTrainerToBatch(cotrainerId, batchId, "Co-lead");
		else
			coLeadStatus = true;
		trainerStatus = leadStatus && coLeadStatus;
		if(associateStatus & trainerStatus){
			alert("Batch created Successfully");
			location.reload();
		}
	} 
	else {
		alert("Something went wrong.");
	}
}

/** Registers associates to a batch.
 * It registers the associates in the added associates list
 * 
 * @param {Number} batchId The id number of the batch.
 * @returns {boolean} true if all associates are added successfully, false otherwise
 */
async function registerAssociatesToBatch(batchId){
	let valid = true;
	const associates = addedAssoc.children;
	const assocIds = [];
	for (associate of associates) {
		const assocId = Number(associate.getAttribute("name"));
		assocIds.push(assocId);
	}
		const body = {
			associateIds: assocIds,
			batchId: batchId,
			trainingStatus: "Enrolled"
		};
		const config = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		};
		const res = await fetch(pythonPath + "/associates/multiregister", config);
		if(res.status !== 201){
			alert(`Adding the trainers or the associates with id ${await res.json().id}`);
			return valid = false;
		}

	return valid;
}

/** Registers a trainer to a batch.
 * 
 * @param {Number} trainerId The unique ID of the trainer
 * @param {Number} batchId  The unique ID of the batch
 * @param {String} trainerRole The role a trainer will have for the batch. Usually
 * lead or co-lead
 * @returns {boolean} Returns true if the trainer was registered, false otherwise
 */
async function registerTrainerToBatch(trainerId, batchId, trainerRole){
	const trainerReq = {
		trainerId: trainerId,
		batchId: batchId,
		trainerRole: trainerRole
	}

	const trainerConfig = {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(trainerReq)
	};

	const res = await fetch(pythonPath + "/trainers/register", trainerConfig);
	if(res.status !== 201){
		alert("issue adding trainer");
		return false;
	}
	else return true;

}

/**
 * This function wipes session storage
 **/
function wipeStorage() {
    sessionStorage.clear();
}

/**
 * This function logs the user out and returns them to the home page
 **/
function logout(){
	document.location = bucketPath + "/home.html"
}

/**
 * This function sets the startDate input field to todays date by default
 */
const setStartDate = () => {
	const currDate = new Date().toDateInputValue();
	document.getElementById("startDate").value = currDate;
};

/**
 * This function sets the endDate input field to 2 weeks after the start date
 */
const setEndDate = () => {
	const currDate = new Date().getTime();
	const laterTime = currDate + 1209600000;
	const laterDate = new Date(laterTime).toDateInputValue();
	document.getElementById("endDate").value = laterDate;
}

/**
 * Helper function to stripdown date to this format: "07-02-2021" for the frontend date selector
 * @returns {Date}
 */
Date.prototype.toDateInputValue = function () {
	var local = new Date(this);
	local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
	return local.toJSON().slice(0, 10);
};

search.addEventListener("keyup", filterList);
submit.addEventListener("click", createBatch);
document.addEventListener("DOMContentLoaded", getAllAssociates);
document.addEventListener("DOMContentLoaded", setStartDate);
document.addEventListener("DOMContentLoaded", setEndDate);
document.addEventListener("DOMContentLoaded", getAllTrainers);
