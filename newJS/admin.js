async function createNewAssociate() {
	const associateEmailInput = document.getElementById("emailInput");
	const associateFirstNameInput = document.getElementById("firstNameInput");
	const associateLastNameInput = document.getElementById("lastNameInput");

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
			alert("The associate was added");
			$('#newAssociateModal').modal('hide');
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