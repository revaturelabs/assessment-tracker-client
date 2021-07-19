async function pageDataToLoad() {
    // reset page content back to the actual page
    $("#mainbody").html(tempMainContentHolder);
    loadinfoByClass("associateName", loginData.firstName+" "+loginData.lastName);
    await loadBatches(loginData.id);
}

async function loadBatches(associateId) {
    const url = `http://10.58.50.3:5000/associates/${associateId}/batches`;
    const response = await fetch(url);
    const batches = await response.json();

    document.getElementById("registeredBatches").innerHTML = "";

    if (response.status === 200) {
        batches.forEach(batch => {
		document.getElementById("registeredBatches").innerHTML += newBatch(batch);
	})
    }
}

function newBatch(batch) {
    return `<div id="batch_${batch.id}" class="d-flex-inline-block flex-fill p-4 mr-2 my-2 bg-darker border border-dark" onclick="goToAssociateAssessmentPage(${batch.id})">
    <h4 class="card-title">${batch.trainingTrack}</h4>
    <hr class="bg-light" />
    <h5>${batch.name}</h5>
    </div>`;
}

function goToAssociateAssessmentPage(batchId) {
    window.location.href = `associate_assessments.html?batch=${batchId}`;
}