const unaddedAssoc = document.getElementById("unaddedAssociates");
const addedAssoc = document.getElementById("addedAssociates");
const trainerInput = document.getElementById("batchTrainer");
const coTrainerInput = document.getElementById("batchCoTrainer");
let search = document.getElementById("searchAssociate");
const submit = document.getElementById("submitBatch");
const pythonPath = "http://ec2-34-204-173-118.compute-1.amazonaws.com:5000";
const bucketPath = "http://adam-ranieri-batch-1019.s3.amazonaws.com";
//const pythonPath = "http://localhost:5000";
//const bucketPath = "http://localhost:5500";

const associateEmailInput = document.getElementById("emailInput");
const associateFirstNameInput = document.getElementById("firstNameInput");
const associateLastNameInput = document.getElementById("lastNameInput");

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

function validateBatchInfo(name, track, trainer, cotrainer, startDate, endDate){
	
	if(name === "" | track==="" | trainer === "" | cotrainer === "" | endDate === ""){
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

function clickAssociate(listItem) {
	const parentList = listItem.parentElement;
	if (parentList === addedAssoc) {
		unaddedAssoc.appendChild(listItem);
	} else {
		addedAssoc.appendChild(listItem);
	}
}

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

async function createBatch() {
	const nameInput = document.getElementById("nameInput").value;
	const trackInput = document.getElementById("trackInput").value;
	const start = document.getElementById("startDate").value;
	const end = document.getElementById("endDate").value;
	const startDate = new Date(start).getTime() / 1000;
	const endDate = new Date(end).getTime() / 1000;
	const trainerOption = trainerInput.options[trainerInput.selectedIndex];
	const cotrainerOption = coTrainerInput.options[coTrainerInput.selectedIndex];
	const trainerId = Number(trainerOption.getAttribute("name"));
	const cotrainerId = Number(cotrainerOption.getAttribute("name"));
	console.log(trainerId);
	console.log(cotrainerId);
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
		const coLeadStatus = await registerTrainerToBatch(cotrainerId, batchId, "Co-lead");
		trainerStatus = leadStatus && coLeadStatus;
		console.log(associateStatus);
		console.log(trainerStatus);
		if(associateStatus & trainerStatus){
			alert("Batch created Successfully");
			nameInput = "";
			trackInput = "";
			end = "";
		}
	} 
	else {
		alert("Something went wrong.");
	}
}

	//associates is the array of all the list items


async function registerAssociatesToBatch(batchId){
	let valid = true;
	const associates = addedAssoc.children;
	for (associate of associates) {
		const assocId = Number(associate.getAttribute("name"));
		const body = {
			associateId: assocId,
			batchId: batchId,
		};
		const config = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		};
		const res = await fetch(pythonPath + "/associates/register", config);
		console.log(res.status);
		if(res.status !== 201){
			alert(`Adding the trainers or the associates with id ${await res.json().id}`);
			return valid = false;
		}
	}
	return valid;
}

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
	console.log(res.status);
	if(res.status !== 201){
		alert("issue adding trainer");
		return false;
	}
	else return true;

}

function wipeStorage() {
    sessionStorage.clear();
}

// logout function
function logout(){
	document.location = bucketPath + "/home.html"
}

//sets startDate to today's date
const setStartDate = () => {
	const currDate = new Date().toDateInputValue();
	document.getElementById("startDate").value = currDate;
};

const setEndDate = () => {
	const currDate = new Date().getTime();
	const laterTime = currDate + 1209600000;
	const laterDate = new Date(laterTime).toDateInputValue();
	document.getElementById("endDate").value = laterDate;
}


//Helper function to stripdown date to this format: "07-02-2021" for the frontend date selector
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
