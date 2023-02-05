i = 0; 

function advance() {
	switch (i) {
		case 0:
			document.getElementById("advanceButton").classList.remove("visually-hidden");
			document.getElementById("backButton").classList.remove("visually-hidden");
			break;
		case 2: 
			document.getElementById("advanceButton").classList.add("visually-hidden");
			document.getElementById("submitButton").classList.remove("visually-hidden");
			break;
		case 3:
			document.getElementById("submitButton").classList.add("visually-hidden");
			document.getElementById("backButton").classList.add("visually-hidden");
			break;
	};
	var oldId = `page${i+1}`
	var newId = `page${i+2}`
	document.getElementById(oldId).classList.add("visually-hidden");
	document.getElementById(newId).classList.remove("visually-hidden");
	i++;
}

function back() {
	if (i == 1) {
		document.getElementById("advanceButton").classList.add("visually-hidden");
		document.getElementById("backButton").classList.add("visually-hidden");
	}
	if (i == 3) {
		document.getElementById("submitButton").classList.add("visually-hidden");
		document.getElementById("advanceButton").classList.remove("visually-hidden");
	};
	var oldId = `page${i+1}`
	var newId = `page${i}`
	document.getElementById(oldId).classList.add("visually-hidden");
	document.getElementById(newId).classList.remove("visually-hidden");
	i--;
}

function submit() {
	if (document.getElementById("emergencyContactName2") != null) {
		var data = {
			"name": document.getElementById("name").value,
			"userNumber": document.getElementById("userNumber").value,
			"recipients": [
				{
					"name": document.getElementById("emergencyContactName1").value,
					"number": document.getElementById("emergencyContactNumber1").value
				}, 
				{
					"name": document.getElementById("emergencyContactName2").value,
					"number": document.getElementById("emergencyContactNumber2").value
				}
			]
		}
	}
	else {
		var data = {
			"name": document.getElementById("name").value,
			"userNumber": document.getElementById("userNumber").value,
			"recipients": [
				{
					"name": document.getElementById("emergencyContactName1").value,
					"number": document.getElementById("emergencyContactNumber1").value
				}
			]
		}
	}
	const options = {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(data)
	  };
	  
	  fetch('https://europe-west1-safetynet-rhul.cloudfunctions.net/newConfig', options)
		.then(response => response.json())
		.then(response => console.log(response))
		.then(advance())
		.catch(err => {
			console.error(err);
			triggerError();
		});
}