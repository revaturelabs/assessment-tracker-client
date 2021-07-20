/**
 * This function is called when the webpage initially loads and populates information for the page
 */
async function pageDataToLoad() {
    // reset page content back to the actual page
    $("#mainbody").html(tempMainContentHolder);
    loadinfoByClass("associateName", loginData.firstName+" "+loginData.lastName);
    await loadBatches(loginData.id);
}

/**
 * Loads information on every batch an associate is registered for
 * TODO: Implement the endpoint /associates/<associateId>/batches to get all batches for which an associate is registered
 * @param {The ID of the associate to load information for} associateId 
 */
async function loadBatches(associateId) {
    //This endpoint currently doesn't exist in the backend.  Needs to be implemented for this function to work
    //const url = `${base_url}associates/${associateId}/batches`
    const response = await fetch(url);
    const batches = await response.json();

    document.getElementById("registeredBatches").innerHTML = "";

    if (response.status === 200) {
        batches.forEach(batch => {
		document.getElementById("registeredBatches").innerHTML += newBatch(batch);
	})
    }
}

/**
 * Generates a card with information that redirects to another webpage on click
 * @param {The batch to generate a card for} batch 
 * @returns A styled, clickable card in the form of a div 
 */
function newBatch(batch) {
    return `<div id="batch_${batch.id}" class="d-flex-inline-block flex-fill p-4 mr-2 my-2 bg-darker border border-dark" onclick="goToAssociateAssessmentPage(${batch.id})">
    <h4 class="card-title">${batch.trainingTrack}</h4>
    <hr class="bg-light" />
    <h5>${batch.name}</h5>
    </div>`;
}

/**
 * Redirects to a page that displays an associates results for a specific batches assessments
 * TODO: Create the associate_assessments.html file.  Currently, this redirects to nothing
 * @param {The ID of the batch to redirect to} batchId 
 */
function goToAssociateAssessmentPage(batchId) {
    window.location.href = `associate_assessments.html?batch=${batchId}`;
}