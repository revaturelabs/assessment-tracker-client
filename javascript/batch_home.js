// highlights which page you are on in main nav
let onHome = offPage;
let onBatch = onPage;
let onAssess = offPage;
let onNotes = offPage;

let state={};
state.batchId = window.localStorage["batchId"];
if (window.localStorage["batchId"]){
    console.log("batchId already stored");
    console.log(window.localStorage["batchId"]);
}else{
    localStorage.setItem("batchId", null);
}
let batch = {
    id: 1,
    name: "",
    trainingTrack: "",
    startDate: "",
    currentWeek: 71,
    totalWeeks: 0
}
let assesssments = new Object();
//Table variables
let associates = new Object();
let assessmentsArr = [];
//gradeCache[current week][associate index][assessment index] = current grade
let curWeek = 1;
let gradeCache = null;
let prevActiveTableCellDOM = null;
let assessmentIDToTableCol = null;
let associateIDToTableRow = null;


function pageDataToLoad() {
    // reset page content back to the actual page
    $("#mainbody").html(tempMainContentHolder);
    if (state.batchId != null) {
        batch.id = state.batchId;
        batchData(batch.id, batch);
    } else {
        document.getElementById("mainbody").innerHTML = `
    <div id="batchLoader" class="d-flex justify-content-center"></div>
    <div id="panels">
        <div class="d-flex mb-5">
            <div id="empty" class="col col-12 p-0">
                <div class="card bg-darker">
                    <div class="card-body rounded">
                    <p>No batches have been selected! Please type in the search bar to find a batch or go back <a href="home">home</a> to select a batch!</p>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    }
}
const panels = document.getElementById("panels");

async function generateGradeCache(week) {
    //Exit if cache has already been made
    if(gradeCache[week]) return;

    gradeCache[week] = new Array(associates.length);
    assessmentIDToTableCol[week] = new Map();
    associateIDToTableRow[week] = new Map();
    for(let i = 0; i < associates.length; ++i) {
        associateIDToTableRow[week].set(associates[i].id, i);
        //Skip if no assessments exist
        if(!assessmentsArr[week]) continue;

        gradeCache[week][i] = new Array(assessmentsArr[week].length);
        for(let j = 0; j < assessmentsArr[week].length; ++j) {
            //Start with invalid score this gets reset to a vaild value if a score is found
            gradeCache[week][i][j] = "-";
            assessmentIDToTableCol[week].set(assessmentsArr[week][j].assessmentId, j);
            await getScore(assessmentsArr[week][j].assessmentId, associates[i].id, null, null);
        }
    }
}
function addGradeCacheCol(week) {
    //Add new row to compensate for new assessment created
    for(let i = 0; i < associates.length; ++i) {
        if(!gradeCache[week][i]) gradeCache[week][i] = [];
        gradeCache[week][i].push("-");
    }
}
function getUpdateScoreInnerHTML(item) {
    return `
    <form id="GiveScoreForm${item.assessmentId}" class="needs-validation" novalidate autocomplete="off">
        <div id="scoreFormElem${item.assessmentId}">
            <div class="form-group">
                <label for="score${item.assessmentId}">${item.assessmentTitle}</label>
                <input placeholder="Please type a score out of 100%" type="number" step="0.01" min="0.01" max="100" class="form-control" id="score${item.assessmentId}" name="score${item.assessmentId}" required>
                <div class="invalid-feedback">
                    Please type a valid Score percentage out of 100%.
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <span id="loadScoreResult${item.assessmentId}"></span><span id="ScoreLoad${item.assessmentId}"></span>
            <button onclick="let form = document.getElementById('GiveScoreForm${item.assessmentId}');
            if (form.checkValidity() === true) {
                batch.currentScores = new Object();
                UpdateScores(document.getElementById('score${item.assessmentId}').value,${item.assessmentId},'loadScoreResult${item.assessmentId}','ScoreLoad${item.assessmentId}');
            }" type="submit" class="btn btn-info">Save &nbsp;<i class="fa fa-floppy-o" aria-hidden="true"></i></button>
            <button type="button" class="btn btn-warning" data-dismiss="modal">Close <i class="fa fa-times-circle-o" aria-hidden="true"></i></button>
        </div>
    </form>`;
}
function generateDropdownHTML(numWeeks) {
    let dropdownHTML = `
    <div class="form-group">
        <label for="week-num" class="col-form-label h3">Current Week:</label>
        <select class="form-control form-control-lg h-50" id="week-num" required>
        `;

    for(let i = 0; i < numWeeks; ++i) {
        if(i+1 === curWeek) dropdownHTML += `<option value="${i+1}" selected="selected">Week ${i+1}</option>`;
        else dropdownHTML += `<option value="${i+1}">Week ${i+1}</option>`;
    }
    dropdownHTML += `</select></div>`;
    dropdownHTML += `<div id="table-container"></div>`;
    return dropdownHTML;
}
function generateTable(week){
    //Setup
    const tableContainerDOM = document.getElementById("table-container");
    const buttonHTML = `<button onclick="document.getElementById('assessment-week').innerHTML = ${week}" id="addAssessmentBtn" 
    class="btn btn-secondary border-0 d-block" data-toggle="modal" data-target="#createAssessmentModal">
       <i class="fa fa-plus" aria-hidden="true"></i>&nbsp;Assessment
   </button>`;
   //Empty assessment list
    if(!assessmentsArr[week]) {
        tableContainerDOM.innerHTML = "-No Assessments Yet-" + buttonHTML;
        return;
    }
    let tableInnards = `
    <table class="table table-dark table-striped table-hover">
        <thead>
            <th>Associate Name</th>
    `;
    //Assessment columns
    for(let i = 0; i < assessmentsArr[week].length; ++i) {
        tableInnards+=`
        <th id="assessment-name-${i}"><a onclick="
        batch.currentWeek = ${assessmentsArr[week][i].weekId};
        batch.currentID = ${assessmentsArr[week][i].assessmentId};
        document.getElementById('assessWeightTitle').innerHTML = '${assessmentsArr[week][i].assessmentTitle} Weight';
        document.getElementById('weightControl').value = assessmentsArr[${week}][${i}].assessmentWeight;
        document.getElementById('weightValue').innerHTML = assessmentsArr[${week}][${i}].assessmentWeight;
        " id="assessment_${assessmentsArr[week][i].assessmentId}" data-toggle="modal" href="#adjustWeightModal">${assessmentsArr[week][i].assessmentTitle}</a>
        </th>`;
        
    }
    tableInnards+=`<th>Totals</th>`;

    //Associate name row
    tableInnards+=`</thead><tbody>`;
    for(let i = 0; i < associates.length; ++i) {
        tableInnards+=`<tr><td id="associate-name-${i}" style="cursor:pointer;" class="toggle_create_note_modal_btn ${associates[i].id}">${associates[i].firstName}</td>`;
        
        //Grade data
        let gradeTotal = 0;
        for(let j = 0; j < assessmentsArr[week].length; ++j) {
            //tableInnards+=`<td id="grade-data-${i}-${j}">${gradeCache[week][i][j]}</td>`;
            tableInnards +=
            `<td><a id="grade-data-${i}-${j}" onclick="batch.currentAssoc = ${associates[i].id};
            batch.currentWeek = ${week};
            printWeekAssess(${week});
            document.getElementById('assessScoreTitle').innerHTML = 'Week '+ ${week};
            document.getElementById('studentName').innerHTML = '${associates[i].firstName}';
            " data-toggle="modal" href="#giveScores">${gradeCache[week][i][j]}</a></td>`;

            if(gradeCache[week][i][j] !== "-") gradeTotal += gradeCache[week][i][j];
        }
        tableInnards += `<td>${gradeTotal}</td></tr>`;
    }

    //Averages row
    tableInnards+=`<tr><td>Average</td>`;
    for(let j = 0; j < assessmentsArr[week].length; ++j) {
        //BUG - calc average
        tableInnards+=`<td>Average ${j+1}</td>`;
    }
    //Finalize table html
    tableInnards += `<td></td></tr></tbody></table>`;
    tableInnards += buttonHTML;
    tableContainerDOM.innerHTML=tableInnards;

    //Once InnerHTML is done set click events
    
    //Assessment Cell Click events
    for(let j = 0; j < assessmentsArr[week].length; ++j) {
        const curAssessCellDOM = document.getElementById(`assessment-name-${j}`);
        curAssessCellDOM.addEventListener('click', (e) => {
            if(prevActiveTableCellDOM) prevActiveTableCellDOM.className = "";
            curAssessCellDOM.className = "table-active";
            prevActiveTableCellDOM = curAssessCellDOM;
        });
    }
    //Grade Cell Click events
    for(let i = 0; i < associates.length; ++i) {
        for(let j = 0; j < assessmentsArr[week].length; ++j) {
            const curGradeCellDOM = document.getElementById(`grade-data-${i}-${j}`);
            curGradeCellDOM.addEventListener('click', (e) => {
                if(prevActiveTableCellDOM) prevActiveTableCellDOM.className = "";
                //BUG - Add styling if needed for active cells
                curGradeCellDOM.className = "table-active";
                prevActiveTableCellDOM = curGradeCellDOM;
                //BUG - Enable user to edit score
                document.getElementById("scoreForms").innerHTML = getUpdateScoreInnerHTML(assessmentsArr[week][j]);
                newGenForms();
            });
        }
    }
}

async function addWeek(totalWeeks) {
    let holder = "";
    for (i = 1; i <= totalWeeks; i++) {
        holder += newWeek(i);
    }
    document.getElementById("mainbody").innerHTML = `
    <div id="batchLoader" class="d-flex justify-content-center"></div>
    <div id="panels" class="card bg-darker p-3">
        <h3 class="card-title text-center"><i class="fa fa-users" aria-hidden="true"></i>&nbsp;<strong>${batch.trainingTrack} - ${batch.name}</strong></h3>
        <p class="text-muted text-center">All the weeks for this batch. Total is ${batch.totalWeeks} weeks</p>
        ${holder}
    </div>`;
    
    for (i = 1; i <= totalWeeks; i++) {
        await getAssessments(i);
    }
}
//creates a new assessment link for
function displayAssessments(assessments){
    let display = "";
    let tempObj = assesssments;
    Array.prototype.forEach.call(assessments, (assessment)=>{
        assesssments["assessment"+assessment.assessmentId] = assessment;
        tempObj["assessment"+assessment.assessmentId] = assesssments["assessment"+assessment.assessmentId];
        batch["week"+assessment.weekId] = tempObj;
        display += `<li class="m-2" id="assessment${assessment.assessmentId}">
        <a onclick="batch.currentWeek = ${assessment.weekId};
        batch.currentID = ${assessment.assessmentId};
        document.getElementById('assessWeightTitle').innerHTML = '${assessment.assessmentTitle} Weight';
        document.getElementById('weightControl').value = batch.week${assessment.weekId}.assessment${assessment.assessmentId}.assessmentWeight;
        document.getElementById('weightValue').innerHTML = batch.week${assessment.weekId}.assessment${assessment.assessmentId}.assessmentWeight;
        " id="assessment_${assessment.assessmentId}" data-toggle="modal" href="#adjustWeightModal">${assessment.assessmentTitle}</a>
        </li>`;
    });
    console.log(batch);
    return display
}
// holds the styling for the batches
function newWeek(week) {
    return `
    <div class="d-flex mb-5">
        <div id="week_${week}" class="col col-12 p-0">
            <div class="card bg-darker">
                <div class="card-body rounded">
                    <div id="batchLoader${week}" class="d-flex justify-content-center"></div>
                    <div class="d-flex flex-wrap justify-content-around">
                        <div class="d-flex-inline-block flex-fill">
                            <h3 class="card-title"><strong>Week ${week}</strong></h3>
                            <ul class=" card-text overflow-auto assess-panel" id="week${week}Assessments">
                                -No Assessments Yet-
                            </ul>
                            <button onclick="document.getElementById('assessment-week').innerHTML = ${week}" id="addAssessmentBtn" class="btn btn-secondary border-0 d-block" data-toggle="modal" data-target="#createAssessmentModal"><i class="fa fa-plus" aria-hidden="true"></i>&nbsp;Assessment</button>
                        </div>
                        <div class="d-flex-inline-block flex-fill bg-darkest rounded p-3">
                            <h3>Associates</h3>
                            <ul id="${week}" class="d-inline-block card-text overflow-auto assess-panel allAssociates col col-12">
                                -No Associates-
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}//Get all Current Assessments for a Week
async function getAssessmentsForWeek(weekId) {
    let response_func = getAssessmentsForWeekComplete;
    let endpoint =  `batches/${window.localStorage["batchId"]}/weeks/${weekId}/assessments`
    let url = java_base_url + endpoint;
    let request_type = "GET";
    let response_loc = `mainbody`;
    let load_loc = "batchLoader"+weekId;
    let jsonData = "";
    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData)
}

function getAssessmentsForWeekComplete(status, response, response_loc, load_loc) {
    if (status == 200) {
        assessmentsArr[curWeek] = JSON.parse(response); 
    }
}

//Get all Current Assessments for a Week
async function getAssessments(weekId) {
    //set the caller_complete to the function that is supposed to receive the response
    let response_func = getAssessments_complete;
    //endpoint: rest api endpoint
    let endpoint =  `batches/${window.localStorage["batchId"]}/weeks/${weekId}/assessments`
    //set the url by adding (base_url/java_base_url) + endpoint
    //options:
    //base_url(python)
    //java_base_url(java)
    let url = java_base_url + endpoint;
    console.log(url)
    //request_type: type of request
    let request_type = "GET";
    //location you want the response to load
    let response_loc = `week${weekId}Assessments`;
    //optional:location you want the load animation to be generated while awaiting the response
    //can be set for any location but will most often be set to response_loc
    //can be left blank if not needed
    let load_loc = "batchLoader"+weekId;
    //optional:json data to send to the server
    //can be left blank if not needed
    let jsonData = "";

    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData)
}
//ajax on-complete function: receives the response from an ajax request
function getAssessments_complete(status, response, response_loc, load_loc) {
    //do some logic with the ajax data that was returned
    //do this if you are expecting a json object - JSON.parse(response)

    //The var "load_loc" is set in case the response message is different from the action to be loaded into the named location
    //example:
    //-- you want a message to say "ajax done!" in a popup while the data is compiled and loaded somewhere else

    //action if code 200
    if (status == 200) {
        let res = JSON.parse(response)
        console.log(res);
        //load the response into the response_loc
        if(Object.keys(res).length <= 0) {
            document.getElementById(response_loc).innerHTML = "-No Assessments Yet-";
        } else {
            console.log(res);
            document.getElementById(response_loc).innerHTML = displayAssessments(res);
            console.log("batch");
            console.log(batch);
        }

        //action if code 201
    } else if (status == 201) {
        document.getElementById(response_loc).innerHTML = JSON.parse(response);
        //action if code 400
    } else if (status == 400) {
        //load the response into the response_loc
        document.getElementById(response_loc).innerHTML = response;
    } else if (status == 0) {
        //load the response into the response_loc
        document.getElementById(response_loc).innerHTML = "-No Assessments Yet-";
    }
}

//Caller function: calls an ajax request
////Get all Current weeks for a Batch
async function batchData(batchID, response_loc) {
    //set the caller_complete to the function that is supposed to receive the response
    //naming convention: [this function name]_complete
    let response_func = batchData_complete;
    //endpoint: rest api endpoint
    let endpoint = "batches/"+batchID;
    //set the url by adding (base_url/java_base_url) + endpoint
    //options:
    //base_url(python)
    //java_base_url(java)
    let url = base_url + endpoint;
    //request_type: type of request
    //options:
    //"GET", "POST", "OPTIONS", "PATCH", "PULL", "PUT", "HEAD", "DELETE", "CONNECT", "TRACE"
    let request_type = "GET";
    //location you want the response to load
    //let response_loc = "yearsWorked";
    //optional:location you want the load animation to be generated while awaiting the response
    //can be set for any location but will most often be set to response_loc
    //can be left blank if not needed
    let load_loc = "batchLoader";
    //optional:json data to send to the server
    //can be left blank if not needed
    let jsonData = "";

    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData)
}
//ajax on-complete function: receives the response from an ajax request
async function batchData_complete(status, response, response_loc, load_loc) {
    //do some logic with the ajax data that was returned
    //do this if you are expecting a json object - JSON.parse(response)

    //The var "load_loc" is set in case the response message is different from the action to be loaded into the named location
    //example:
    //-- you want a message to say "ajax done!" in a popup while the data is compiled and loaded somewhere else
    
    //action if code 200
    if(status == 200) {
        let jsonHolder = JSON.parse(response);
        response_loc = jsonHolder;
        batch = response_loc;
        //await addWeek(batch.totalWeeks);
        let dropdownDOM = document.getElementById("week-num");
        //Set inital cache week size if it wasnt set before
        if(!gradeCache) {
            await getAssociates();
            gradeCache = new Array(batch.totalWeeks+1);
            assessmentIDToTableCol = new Array(batch.totalWeeks+1);
            associateIDToTableRow = new Array(batch.totalWeeks+1);
            assessmentsArr = new Array(batch.totalWeeks+1);
            document.getElementById("mainbody").innerHTML = generateDropdownHTML(gradeCache.length);
            dropdownDOM = document.getElementById("week-num");
            dropdownDOM.addEventListener('input', (e) => {
                e.preventDefault();
                curWeek = Number(e.target.value);
                //Disable this element until the table is fully loaded
                dropdownDOM.disabled = true;
                batchData(batch.id, batch);
            });
            //Disable for now until week 1 is loaded by default
            dropdownDOM.disabled = true;
        }
        //Get assessments for the week if we didnt already
        if(!gradeCache[curWeek]) {
            await getAssessmentsForWeek(curWeek);
            await generateGradeCache(curWeek);
        }
        generateTable(curWeek); 
        dropdownDOM.disabled = false;
        
        //action if code 201
    } else if(status == 201) {
        document.getElementById(response_loc).innerHTML = JSON.parse(response);
        //action if code 400
    } else if(status == 400) {
        //load the response into the response_loc
        let responseDOM = document.getElementById(response_loc);
        if(responseDOM) responseDOM.innerHTML = response;
    }
}

// ---------------------createAssessment---------------------
async function createAssessment() {
    let response_func = createAssessment_complete;
    //endpoint: rest api endpoint
    let endpoint = "assessments"
    let url = java_base_url + endpoint;
    console.log(url)
    let request_type = "POST";
    //location you want the response to load
    let thisWeekId = document.getElementById("assessment-week").innerHTML
    let response_loc = `week${thisWeekId}Assessments`;
    let load_loc = "batchLoader"+thisWeekId;

    let defaultWeight = 0;
    switch (Number(document.getElementById("assessment-type").value)) {
        case 1:
            defaultWeight = 100;
            break;
        case 2:
            defaultWeight = 40;
            break;
        case 3:
            defaultWeight = 60;
            break;
        case 4:
            defaultWeight = 80;
            break;
    }

    let thisAssessment = {
        assessmentTitle: document.getElementById("assessment-title").value,
        typeId: Number(document.getElementById("assessment-type").value),
        batchId: Number(window.localStorage["batchId"]),
        weekId: document.getElementById("assessment-week").innerHTML,
        assessmentWeight: defaultWeight,
        categoryId: 2
    }
    let jsonData = thisAssessment;
    console.log(thisAssessment);
    console.log(thisWeekId);

    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData)
}

function createAssessment_complete(status, response, response_loc, load_loc) {
    //action if code 200
    if(status == 200) {
        //let newJson = JSON.parse(response)
        //load the response into the response_loc
        /*if(document.getElementById(response_loc).innerHTML == "-No Assessments Yet-") {
            document.getElementById(response_loc).innerHTML = displayAssessments([newJson]);
        } else {
            document.getElementById(response_loc).innerHTML += displayAssessments([newJson]);
        }*/

        
        //action if code 201
    } else if(status == 201) {
        //document.getElementById(response_loc).innerHTML = JSON.parse(response);
        //Update our table
        let newJson = JSON.parse(response)
        if(!assessmentsArr[curWeek]) assessmentsArr[curWeek] = [];
        let j = assessmentsArr[curWeek].length;
        assessmentsArr[curWeek].push(newJson);
        assessmentIDToTableCol[curWeek].set(newJson.assessmentId, j);
        addGradeCacheCol(curWeek);
        generateTable(curWeek); 
        //action if code 400
    } else if(status == 400) {
        //load the response into the response_loc
        document.getElementById(response_loc).innerHTML = response;
    }
}

//Update the weight of an assessment
async function updateWeight(weekID, assessID, weight) {
    //set the caller_complete to the function that is supposed to receive the response
    let response_func = updateWeight_complete;
    //endpoint: rest api endpoint
    let endpoint =  `weight/${weight}/assessments/${assessID}`
    //set the url by adding (base_url/java_base_url) + endpoint
    //options:
    //base_url(python)
    //java_base_url(java)
    let url = java_base_url + endpoint;
    //request_type: type of request
    //options:
    //"GET", "POST", "OPTIONS", "PATCH", "PULL", "PUT", "HEAD", "DELETE", "CONNECT", "TRACE"
    let request_type = "PATCH";
    //location you want the response to load
    //batch[`week${weekID}`][`assessment${assessID}`].assessmentWeight = weight;
    let i = assessmentIDToTableCol[weekID].get(assessID);
    assessmentsArr[weekID][i].assessmentWeight = weight;
    let response_loc = weight; //batch[`week${weekID}`][`assessment${assessID}`].assessmentWeight;
    //optional:location you want the load animation to be generated while awaiting the response
    //can be set for any location but will most often be set to response_loc
    //can be left blank if not needed
    let load_loc = "WeightLoad";
    //optional:json data to send to the server
    //can be left blank if not needed
    let jsonData = "";

    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData)
}
//ajax on-complete function: receives the response from an ajax request
function updateWeight_complete(status, response, response_loc, load_loc) {
    //do some logic with the ajax data that was returned
    //do this if you are expecting a json object - JSON.parse(response)

    //The var "load_loc" is set in case the response message is different from the action to be loaded into the named location
    //example:
    //-- you want a message to say "ajax done!" in a popup while the data is compiled and loaded somewhere else

    //action if code 200
    if (status == 200) {
        let res = JSON.parse(response);
        console.log("batch");
        console.log(batch);

        //action if code 201
    } else if (status == 201) {
        document.getElementById(response_loc).innerHTML = JSON.parse(response);
        //action if code 400
    } else if (status == 400) {
        //load the response into the response_loc
        document.getElementById(response_loc).innerHTML = response;
    } else if (status == 0) {
        //load the response into the response_loc
        document.getElementById(response_loc).innerHTML = "-Could not find a weight-";
    }
}

//Update the weight of an assessment
async function getAssociates() {
    //set the caller_complete to the function that is supposed to receive the response
    let response_func = getAssociates_complete;
    //endpoint: rest api endpoint
    let endpoint =  `batches/${window.localStorage["batchId"]}/associates`
    //set the url by adding (base_url/java_base_url) + endpoint
    //options:
    //base_url(python)
    //java_base_url(java)
    let url = base_url + endpoint;
    //request_type: type of request
    //options:
    //"GET", "POST", "OPTIONS", "PATCH", "PULL", "PUT", "HEAD", "DELETE", "CONNECT", "TRACE"
    let request_type = "GET";
    //location you want the response to load
    let response_loc = "allAssociates";
    //optional:location you want the load animation to be generated while awaiting the response
    //can be set for any location but will most often be set to response_loc
    //can be left blank if not needed
    let load_loc = "batchLoader";
    //optional:json data to send to the server
    //can be left blank if not needed
    let jsonData = "";

     await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData)
}
//ajax on-complete function: receives the response from an ajax request
function getAssociates_complete(status, response, response_loc, load_loc) {
    //do some logic with the ajax data that was returned
    //do this if you are expecting a json object - JSON.parse(response)

    //The var "load_loc" is set in case the response message is different from the action to be loaded into the named location
    //example:
    //-- you want a message to say "ajax done!" in a popup while the data is compiled and loaded somewhere else

    //action if code 200

    if (status == 200) {
        associates = JSON.parse(response);
        loadinfoByClass(response_loc, printAssociates(associates));
        //action if code 201
    } else if (status == 201) {
        associates = JSON.parse(response);
        document.getElementById(response_loc).innerHTML = associates;
        //action if code 400
    } else if (status == 404) {
        //load the response into the response_loc
        loadinfoByClass(response_loc, "-No Associates-");
    } else if (status == 0) {
        //load the response into the response_loc
        document.getElementById(response_loc).innerHTML = "-No Associates-";
    }
}

//Update the the score of an assessment for an associate
async function UpdateScores(grade,assessmentID,response_loc,load_loc) {
    //set the caller_complete to the function that is supposed to receive the response
    let response_func = UpdateScores_complete;
    //endpoint: rest api endpoint
    let endpoint =  `grades`
    //set the url by adding (base_url/java_base_url) + endpoint
    //options:
    //base_url(python)
    //java_base_url(java)
    let url = java_base_url + endpoint;
    //request_type: type of request
    //options:
    //"GET", "POST", "OPTIONS", "PATCH", "PULL", "PUT", "HEAD", "DELETE", "CONNECT", "TRACE"
    let request_type = "PUT";
    //location you want the response to load
    //let response_loc = "";
    //optional:location you want the load animation to be generated while awaiting the response
    //can be set for any location but will most often be set to response_loc
    //can be left blank if not needed
    //let load_loc = "";
    //optional:json data to send to the server
    //can be left blank if not needed
    let jsonData = {
        "assessmentId": assessmentID,
        "associateId": batch.currentAssoc,
        "score": grade
    };

    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData)
}
//ajax on-complete function: receives the response from an ajax request
function UpdateScores_complete(status, response, response_loc, load_loc) {
    //do some logic with the ajax data that was returned
    //do this if you are expecting a json object - JSON.parse(response)

    //The var "load_loc" is set in case the response message is different from the action to be loaded into the named location
    //example:
    //-- you want a message to say "ajax done!" in a popup while the data is compiled and loaded somewhere else

    //action if code 200
    if (status == 200) {
        const updatedGrade = JSON.parse(response);
        if(updatedGrade) {
            document.getElementById(response_loc).innerHTML = `<p class="text-success">Your grade was saved!</p>`;
            //Update table cell
            let i = associateIDToTableRow[curWeek].get(updatedGrade.associateId);
            let j = assessmentIDToTableCol[curWeek].get(updatedGrade.assessmentId);
            gradeCache[curWeek][i][j] = updatedGrade.score;
            document.getElementById(`grade-data-${i}-${j}`).innerText = gradeCache[curWeek][i][j];
        }
        //action if code 201
    } else if (status == 201) {
        document.getElementById(response_loc).innerHTML = `<p class="text-success">${response}</p>`;
        //action if code 400
    } else if (status == 404) {
        //load the response into the response_loc
        document.getElementById(response_loc).innerHTML = `<p class="text-danger">${response}</p>`;
    } else if (status == 0) {
        //load the response into the response_loc
        document.getElementById(response_loc).innerHTML = `<p class="text-danger">${response}</p>`;
    }
}

//get the score for an assessment for an associate
async function getScore(assessmentId,associateId,response_loc,load_loc) {
    //set the caller_complete to the function that is supposed to receive the response
    let response_func = getScore_complete;
    //endpoint: rest api endpoint
    let endpoint =  `assessments/${assessmentId}/associates/${associateId}/grades`;
    //set the url by adding (base_url/java_base_url) + endpoint
    //options:
    //base_url(python)
    //java_base_url(java)
    let url = java_base_url + endpoint;
    //request_type: type of request
    //options:
    //"GET", "POST", "OPTIONS", "PATCH", "PULL", "PUT", "HEAD", "DELETE", "CONNECT", "TRACE"
    let request_type = "GET";
    //location you want the response to load
    //let response_loc = "";
    //optional:location you want the load animation to be generated while awaiting the response
    //can be set for any location but will most often be set to response_loc
    //can be left blank if not needed
    //let load_loc = "";
    //optional:json data to send to the server
    //can be left blank if not needed
    let jsonData = "";

    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData)
}
//ajax on-complete function: receives the response from an ajax request
function getScore_complete(status, response, response_loc, load_loc) {
    //do some logic with the ajax data that was returned
    //do this if you are expecting a json object - JSON.parse(response)

    //The var "load_loc" is set in case the response message is different from the action to be loaded into the named location
    //example:
    //-- you want a message to say "ajax done!" in a popup while the data is compiled and loaded somewhere else

    //action if code 200
    if (status == 200) {
        if(response != null) {
            const grade = JSON.parse(response);
            const scoreDOM = document.getElementById(response_loc);
            if(scoreDOM) scoreDOM.value = grade.score;
            let i = associateIDToTableRow[curWeek].get(grade.associateId);
            let j = assessmentIDToTableCol[curWeek].get(grade.assessmentId);
            gradeCache[curWeek][i][j] = grade.score;
        }

        //action if code 201
    } else if (status == 201) {
        document.getElementById(load_loc).innerHTML = `<p class="text-success">${response}</p>`;
        //action if code 400
    } else if (status == 404) {
        //load the response into the response_loc
        const loadDOM = document.getElementById(load_loc);
        if(loadDOM) loadDOM.innerHTML = `<p class="text-danger">${response}</p>`;
    } else if (status == 0) {
        //load the response into the response_loc
        document.getElementById(load_loc).innerHTML = `<p class="text-danger">${response}</p>`;
    }
}
function printAssociates(arrayData) {
    let display = "";
    $.each(arrayData,((index) => {
        display += `<li class="m-2" id="associate${arrayData[index].id}"><a onclick="batch.currentAssoc = ${arrayData[index].id};batch.currentWeek = this.parentNode.parentNode.getAttribute('id');printWeekAssess(this.parentNode.parentNode.getAttribute('id'));executePreLoadScores();document.getElementById('assessScoreTitle').innerHTML = 'Week '+this.parentNode.parentNode.getAttribute('id');document.getElementById('studentName').innerHTML = '${arrayData[index].firstName}';" data-toggle="modal" href="#giveScores">${arrayData[index].firstName}</a></li>`;
    }));
    return display;
}
//print all the tests that can have a score given to them
function printWeekAssess(weekID) {
    //resets the form element
    batch.loadScores = new Object();
    let display = "";
    document.getElementById("scoreForms").innerHTML = display;
    //$.each(batch["week"+weekID],(index,item) => {
    $.each(assessmentsArr[weekID],(index,item) => {
        if(weekID == item.weekId){
            batch.loadScores[`score${item.assessmentId}`] = new Object();
            batch.loadScores[`score${item.assessmentId}`].assessmentId = item.assessmentId;
            batch.loadScores[`score${item.assessmentId}`].associateId = batch.currentAssoc;
            batch.loadScores[`score${item.assessmentId}`].response_loc = `score${item.assessmentId}`;
            batch.loadScores[`score${item.assessmentId}`].load_loc = `loadScoreResult${item.assessmentId}`;
            display += `
            <form id="GiveScoreForm${item.assessmentId}" class="needs-validation" novalidate autocomplete="off">
                <div id="scoreFormElem${item.assessmentId}">
                    <div class="form-group">
                        <label for="score${item.assessmentId}">${item.assessmentTitle}</label>
                        <input placeholder="Please type a score out of 100%" type="number" step="0.01" min="0.01" max="100" class="form-control" id="score${item.assessmentId}" name="score${item.assessmentId}" required>
                        <div class="invalid-feedback">
                            Please type a valid Score percentage out of 100%.
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <span id="loadScoreResult${item.assessmentId}"></span><span id="ScoreLoad${item.assessmentId}"></span>
                    <button onclick="let form = document.getElementById('GiveScoreForm${item.assessmentId}');
                    if (form.checkValidity() === true) {
                        batch.currentScores = new Object();
                        UpdateScores(document.getElementById('score${item.assessmentId}').value,${item.assessmentId},'loadScoreResult${item.assessmentId}','ScoreLoad${item.assessmentId}');
                    }" type="submit" class="btn btn-info">Save &nbsp;<i class="fa fa-floppy-o" aria-hidden="true"></i></button>
                    <button type="button" class="btn btn-warning" data-dismiss="modal">Close <i class="fa fa-times-circle-o" aria-hidden="true"></i></button>
                </div>
            </form>`;
        }
    });
    if(display) {
        document.getElementById("scoreForms").innerHTML = display;
        newGenForms();
    } else {
        document.getElementById("scoreForms").innerHTML = "<p>No Assessments have been assigned to this week!</p>";
    }
}
function executePreLoadScores() {
    $.each(batch.loadScores,(key,item) => {
        getScore(item.assessmentId,item.associateId,item.response_loc,item.load_loc);
    });
}
