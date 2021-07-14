async function createNewAssociate() {
	const associateEmail = document.getElementById("emailInput").value;
	const associateFirstName = document.getElementById("firstNameInput").value;
	const associateLastName = document.getElementById("lastNameInput").value;

	document.getElementById("emailInput").value = "";
	document.getElementById("firstNameInput").value = "";
	document.getElementById("lastNameInput").value = "";


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
	} else {
		alert("There was an error while creating the associate");
	}
}