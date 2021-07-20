// highlights which page you are on in main nav
let onHome = onPage;
let onBatch = offPage;

batchButtonCounter = 0;

//checks admin flag. If is admin, go to admin page
if(sessionStorage.getItem("isAdmin")){
    window.location.href = "admin.html";
}

/**
 * This function begins the GET request to get all batch years
 * @param {Number} trainerId the trainer id to load batches for
 **/
async function loadBatchesbyYear(trainerId) {
    let response_func = loadBatchesbyYear_complete;
    let endpoint = "years?trainerId="+trainerId
    let url = base_url + endpoint;
    let request_type = "GET";
    let response_loc = "yearsWorked";
    let load_loc = "batchLoader";
    let jsonData = "";

    await fetchAndUpdateUi(request_type, url, response_func, response_loc, load_loc, jsonData)
}

/**
 * This function displays the years from the GET request
 * @param {String} status the status code response
 * @param {String} response the response message
 * @param {String} response_loc the response location
 * @param {String} load_loc the load location
 **/
function loadBatchesbyYear_complete(status, response, response_loc, load_loc) {
    console.log(response);
    let jsonHolder = JSON.parse(response);
    document.getElementById(response_loc).innerHTML = "";
    if(status == 200) {
        batches = jsonHolder;
        $.each(batches,((index) => {
            document.getElementById(response_loc).innerHTML += batchYear(batches[index].year);
            branchData(loginData.id, batches[index].year, "year_"+batches[index].year);
        }));
    } else if(status == 201) {
        document.getElementById(response_loc).innerHTML = JSON.parse(response);
    } else if(status == 400) {
        document.getElementById(response_loc).innerHTML = response;
    }
    console.log("jsonHolder");
    console.log(jsonHolder);
}

/**
 * This function begins the GET request to get all batches by year
 * @param {Number} trainerId the trainer id to load batches for
 **/
async function branchData(trainerId, year, response_loc) {
    let response_func = branchData_complete;
    let endpoint =`/trainers/${trainerId}/batches?year=${year}`;
    let url = base_url + endpoint;
    let request_type = "GET";
    let load_loc = "batchLoader";
    let jsonData = "";

    await fetchAndUpdateUi(request_type, url, response_func, response_loc, load_loc, jsonData)
}

/**
 * This function displays the batches by year from the GET request
 * @param {String} status the status code response
 * @param {String} response the response message
 * @param {String} response_loc the response location
 * @param {String} load_loc the load location
 **/
function branchData_complete(status, response, response_loc, load_loc) {
    let jsonHolder = JSON.parse(response);
    if(status == 200) {
        batches = jsonHolder;
        let myDateArray = [];
        $.each(batches,((index) => {
            let myDate = new Date(batches[index].startDate);
            if(myDateArray.indexOf(myDate.getUTCMonth()) == -1){
                myDateArray.push(myDate.getUTCMonth());
                document.getElementById(response_loc).innerHTML += newBatchBtn(batches[index].trainingTrack+" - "+batches[index].name, batches[index].id, batches[index].trainingTrack, myDate.getUTCMonth());
            } else {
                document.getElementById(response_loc).innerHTML += newBatchBtn(batches[index].trainingTrack+" - "+batches[index].name, batches[index].id, batches[index].trainingTrack);
            }
        }));
    } else if(status == 201) {
        document.getElementById(response_loc).innerHTML = JSON.parse(response);
    } else if(status == 400) {
        document.getElementById(response_loc).innerHTML = response;
    }
    console.log("batches");
    console.log(batches);
}

/**
 * This function should be replicated for each page to abstract 
 * the load process in case the user was not logged in on load
 **/
async function pageDataToLoad() {
    // reset page content back to the actual page
    $("#mainbody").html(tempMainContentHolder);
    loadinfoByClass("trainerName", loginData.firstName+" "+loginData.lastName);
    await loadBatchesbyYear(loginData.id);
}

/**
 * This function holds the styling for the batch year
 **/
function batchYear(year) {
    return `<div id="year_${year}" class="d-flex-inline-block flex-fill p-4 mr-2 my-2 bg-darker border border-dark">
    <h4 class="card-title">${year}</h4>
    <hr class="bg-light" />
    </div>`;
}

/**
 * This function holds the styling for the batches
 **/
function newBatchBtn(btnName, batchID, btnID, monthName) {
    if(monthName) {
        batchButtonCounter++;
        return `
        <h6 class="card-title">${months[monthName]}</h6>
        <button id="${btnID}_button_${batchButtonCounter}" onclick="goToBatchPage(${batchID})" class="d-inline-block my-2 btn btn-light text-primary border border-dark bg-darker p-1 rounded">${btnName}</button>
        `;
    } else {
        batchButtonCounter++;
        return `
        <button id="${btnID}_button_${batchButtonCounter}" onclick="goToBatchPage(${batchID})" class="d-inline-block my-2 btn btn-light text-primary border border-dark bg-darker p-1 rounded">${btnName}</button>
        `;
    }
}
