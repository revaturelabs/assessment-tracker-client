const unaddedAssoc = document.getElementById("unaddedAssociates");
const addedAssoc = document.getElementById("addedAssociates");
let search = document.getElementById("searchAssociate");
const submit = document.getElementById("submitBatch");
const path = "http://ec2-34-204-173-118.compute-1.amazonaws.com:5000"

const associateEmailInput = document.getElementById("emailInput");
const associateFirstNameInput = document.getElementById("firstNameInput");
const associateLastNameInput = document.getElementById("lastNameInput");


async function createNewAssociate() {
	associateEmailInput.classList.remove("is-invalid");
	associateFirstNameInput.classList.remove("is-invalid");
	associateLastNameInput.classList.remove("is-invalid");

	if (isInputValid(associateEmailInput, associateFirstNameInput, associateLastNameInput)) {
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
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				"firstName": associateFirstName,
				"lastName": associateLastName,
				"email": associateEmail,
				"trainingStatus": ""
			})
		};

		const response = await fetch("http://ec2-34-204-173-118.compute-1.amazonaws.com:5000/associates", config);

		if (response.status == 201) {
			$('#newAssociateModal').modal('hide');
			let result = await response.json();
        		unaddedAssoc.innerHTML+=`<li name="${result.id}">${result.firstName} ${result.lastName}<input onclick="clickAssociate(this.parentElement)" type="checkbox"></li>`
		} else {
			alert("There was an error while creating the associate");
		}
	} else {
		return false;
	}
}


function isInputValid(email, firstName, lastName) {
	let valid = true;
	if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email.value)) {
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

async function getAllAssociates(){
    const config = {
        method: "GET",
    };
    const response = await fetch(path + "/associates", config);
    const associates = await response.json();
    for(index in associates){
        unaddedAssoc.innerHTML+=`<li name="${associates[index].id}">${associates[index].firstName} ${associates[index].lastName}<input onclick="clickAssociate(this.parentElement)" type="checkbox"></li>`
    }
}

function clickAssociate(listItem){
    const parentList = listItem.parentElement;
    if(parentList === addedAssoc){
        unaddedAssoc.appendChild(listItem);
    }
    else{
        addedAssoc.innerHTML.appendChild(listItem);
    }
}

function filterList(){
    
    let input = search.value.toUpperCase();
    const associates = unaddedAssoc.children;

    // Associate is the list element in this for loop
    for(associate of associates){
        let assocName = associate.innerText;
        if(!assocName.toUpperCase().includes(input))
            associate.style.display = "none";
        else
            associate.style.display = "";
    }
}

async function createBatch(){
    const nameInput = document.getElementById("nameInput").value;
    const trackInput = document.getElementById("trackInput").value;
    const start = document.getElementById("startDate").value
    const end = document.getElementById("endDate").value
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const req = {
        "name": nameInput,
        "trainingTrack": trackInput,
        "startDate": startDate,
        "endDate": endDate 
    }

    const config = {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req)
	};

    const resp = await fetch(path+"/batches", config);
    console.log(resp);
    const batch = await resp.text();
    const batchId = Number(batch);
    const associates = addedAssoc.children;
    for(associate of associates){
        const assocId = associate.getAttribute("name");
        const body = {

        }

    }
    

    //associates is the array of all the list items
    
    
}


search.addEventListener("onkeyup", filterList);
submit.addEventListener("click", createBatch);
document.addEventListener("DOMContentLoaded", getAllAssociates);