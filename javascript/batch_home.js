// highlights which page you are on in main nav
let onHome = offPage;
let onBatch = onPage;
let onAssess = offPage;
let onNotes = offPage;

let state={};
state.batchId = window.localStorage["batchId"];
if (window.localStorage["batchId"]){
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
};

let assesssments = new Object();
//Table variables
let associates = new Object();
let assessmentsArr = [];
//gradeCache[current week][associate index][assessment index] = current grade
let curWeek = 1;
let gradeCache = null;
let assessmentIDToAverageCache = null;
let prevActiveTableCellDOM = null;
let assessmentIDToTableCol = null;
let associateIDToTableRow = null;
let newGradeValueDOM;


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
async function getBatchGradesForWeek(week) {
    let response_func = getBatchGradesForWeekComplete;
    let endpoint =  `batches/${window.localStorage["batchId"]}/week/${week}/grades`;
    let url = java_base_url + endpoint;
    let request_type = "GET";
    let response_loc = `table-container`;
    let load_loc = "table-container";
    let jsonData = "";
    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData);
}
function getBatchGradesForWeekComplete(status, response, response_loc, load_loc) {
    if(status === 200) {
        generateGradeCache(curWeek);
        const gradesForWeek = JSON.parse(response);
        for(let g = 0; g < gradesForWeek.length; ++g) {
            let i = associateIDToTableRow[curWeek].get(gradesForWeek[g].associateId);
            let j = assessmentIDToTableCol[curWeek].get(gradesForWeek[g].assessmentId);
            //Skip invalid indices 
            if(!i && i !== 0) continue;
            if(!j && j !== 0) continue;
            gradeCache[curWeek][i][j] = gradesForWeek[g].score;
            assessmentIDToAverageCache[curWeek].get(gradesForWeek[g].assessmentId).numScores += 1;
        }
    }
}
async function getAveragesForWeek(week) {
    let response_func = getAveragesForWeekComplete;
    let endpoint =  `batches/${window.localStorage["batchId"]}/week/${week}/grades/average`
    let url = java_base_url + endpoint;
    let request_type = "GET";
    let response_loc = `table-container`;
    let load_loc = "table-container";
    let jsonData = "";
    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData);
}
function getAveragesForWeekComplete(status, response, response_loc, load_loc) {
    if(status === 200) {
        const averageForWeek = JSON.parse(response);
        assessmentIDToAverageCache[curWeek] = new Map();
        for(let i = 0; i < averageForWeek.length; ++i) {
            assessmentIDToAverageCache[curWeek].set(averageForWeek[i].assessmentId, {
                'average': averageForWeek[i].averageScore,
                'numScores': 0
            });
        }
    }
}
function generateGradeCache(week) {
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
    const buttonHTML = `
    <div class="alert alert-primary hidden" id="batch_home_alerts" role="alert">
            This is a light alert—check it out!
    </div>
    <div class = "d-flex">
        <button onclick="document.getElementById('assessment-week').innerHTML = ${week};clearFields();" id="addAssessmentBtn" 
        class="btn btn-secondary border-0 d-block" data-toggle="modal" data-target="#createAssessmentModal">
        <i class="fa fa-plus" aria-hidden="true"></i>&nbsp;Assessment
        </button>
        <button id="table_submit_button" type="submit" style= "position:relative;left:.3rem;" class="btn btn-info" data-dismiss="modal"
            onclick="updateTableGrades(${week});">
            Submit &nbsp;<i class="fa fa-floppy-o" aria-hidden="true"></i>
        </button>
    </div>`;
   //Empty assessment list
    if(!assessmentsArr[week]) {
        tableContainerDOM.innerHTML = "-No Assessments Yet-" + buttonHTML;
        return;
    }
    let tableInnards = `
    <div class="plusBox" onclick="flipArrow()">
        <h5 id="chartBoxHead">Click here to see a chart of the grades</h5>
        <div class="plus__btn">
            <span id="plus" class="plus"></span>
        </div>
    </div>
    <div id="chartBox" class="chartBox inactive">
        <div class="gradeChart">
            <canvas id="gradeChart"></canvas>
        </div>
        <div class="chartAssociatesList" id="chartAssociatesList"></div>
    </div>  
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
        batch.currentCategory = ${assessmentsArr[week][i].categoryId};
        batch.currentType = ${assessmentsArr[week][i].typeId};
        updateAssessInfo(batch.currentType, batch.currentCategory);
        document.getElementById('assessWeightTitle').innerHTML = '${assessmentsArr[week][i].assessmentTitle} Weight';
        document.getElementById('weightControl').value = assessmentsArr[${week}][${i}].assessmentWeight;
        document.getElementById('weightValue').innerHTML = assessmentsArr[${week}][${i}].assessmentWeight;
        getCategoryByAssessment(${assessmentsArr[week][i].assessmentId});
        " id="assessment_${assessmentsArr[week][i].assessmentId}" data-toggle="modal" href="#adjustWeightModal">${assessmentsArr[week][i].assessmentTitle}</a>
        </th>`;
    }
    tableInnards+=`<th>Totals</th>`;

    //Associate name row
    tableInnards+=`</thead><tbody>`;
    for(let i = 0; i < associates.length; ++i) {
        tableInnards+=`<tr><td id="associate-name-${i}" style="cursor:pointer;" 
        data-toggle="modal" data-target="#create_note_modal" class="toggle_create_note_modal_btn" 
        data-id="${associates[i].id}">${associates[i].firstName}</td>`;
        
        //Grade data
        let gradeTotal = 0;
        for(let j = 0; j < assessmentsArr[week].length; ++j) {
            let placeholder = gradeCache[week][i][j];
            if(gradeCache[week][i][j] !== "-") { 
                placeholder = Math.abs(gradeCache[week][i][j]); 
                gradeTotal += placeholder;
            }
            tableInnards += `
            <td>
                <input id="grade-data-${i}-${j}" type="number" min="0" max="100" class="table-active" placeholder="${placeholder}">
            </td>
            `;   
        }
        tableInnards += `<td id="total-data-${i}">${gradeTotal}</td></tr>`;
    }

    //Averages row
    tableInnards+=`<tr><td>Average</td>`;
    for(let j = 0; j < assessmentsArr[week].length; ++j) {
        let avg = "-";
        let avgInfo = assessmentIDToAverageCache[week].get(assessmentsArr[week][j].assessmentId);
        if(avgInfo) avg = parseFloat(avgInfo.average, 10).toFixed(2);
        tableInnards+=`<td id="avg-data-${j}">${avg}</td>`;
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
            //BUG - Add styling if needed for active cells
            if(prevActiveTableCellDOM) prevActiveTableCellDOM.className = "";
            curAssessCellDOM.className = "table-active";
            prevActiveTableCellDOM = curAssessCellDOM;
        });
    }
    //Grade Cell Click events
    for(let i = 0; i < associates.length; ++i) {
        for(let j = 0; j < assessmentsArr[week].length; ++j) {
            const curGradeCellDOM = document.getElementById(`grade-data-${i}-${j}`);
            curGradeCellDOM.addEventListener('input', (e) => {
                e.preventDefault();
                if(gradeCache[curWeek][i][j] === "*") return;
                //Mark this cell as edited
                if(gradeCache[curWeek][i][j] !== "-") 
                    gradeCache[curWeek][i][j] = -1 * Math.abs(gradeCache[curWeek][i][j]);
                else gradeCache[curWeek][i][j] = "*";
            });
        }
    }
}

//creates colors for every associate when the page loads
associateChartColor = [];
function generateColors(){
    for(let i = 0; i < associates.length; ++i){
        associateChartColor.push("#" + Math.floor(Math.random()*16777215).toString(16));
    }
}
//hides and unhides the chart by making its heigh 0 or not
// Class inactive makes it so that it starts at a max-height: 0
//isBoxOpen traacks if the chart should be open when the new week is made
isBoxOpen = false;
function flipArrow(){
    const chartBox = document.getElementById('chartBox');
    const plus = document.getElementById('plus');
    plus.classList.toggle("plus--acitve")
    if (chartBox.style.maxHeight){
        chartBox.style.maxHeight = null;
        isBoxOpen = false;
    } else {
        chartBox.style.maxHeight = chartBox.scrollHeight + 500 + "px";
        isBoxOpen = true;

    }
}
// creates base chart and associates list on load
async function generateChart(week){
    if(associateChartColor.length != associates.length){
        generateColors();
    }
    if(isBoxOpen === true){
        flipArrow();
    }
    let associateArrNumberandName =[];
    let assessmentsArrNames = [];
    let averageArrGrades = [];
    let averageArrGradeIds = [];

    //Makes associates list for the chart 
    const chartAssociatesList = document.getElementById("chartAssociatesList");
    for(let i = 0; i < associates.length; ++i){
        associateArrNumberandName.push([associates[i].firstName + " " +associates[i].lastName, i])
    }
    letchartAssociatesListFill = "<ul>";
    associateArrNumberandName.map(associateArr => letchartAssociatesListFill+=`<li><input type="checkbox" id="checkbox${associateArr[1]}" name="chartcheckbox${associateArr[1]}" onclick='generateChartAssociateUpdate(${week}, ${associateArr[1]}, "${associateArr[0]}")'><label for="chartcheckbox${associateArr[1]}">&nbsp;${associateArr[0]}</label></li>`)
    letchartAssociatesListFill += "</ul>";
    chartAssociatesList.innerHTML = letchartAssociatesListFill;

    //Makes default chart
    assessmentsArr[week].map(assessment => assessmentsArrNames.push(assessment.assessmentTitle));
    assessmentsArr[week].map(assessment => averageArrGradeIds.push(assessment.assessmentId));
    for(let j = 0; j < assessmentsArr[week].length; ++j) {
        let avg = "-";
        let avgInfo = assessmentIDToAverageCache[week].get(assessmentsArr[week][j].assessmentId);
        if(avgInfo) avg = avgInfo.average;
        averageArrGrades.push(avg)
    }
    let data = {
        labels: assessmentsArrNames,
        datasets: [{
            label: 'Class Average',
            backgroundColor: '#4694c4', 
            borderColor: '#4694c4',
            data: averageArrGrades,
        }]
    };
    const config = {
        type: 'line',
        data,
        options: {}
    };
    gradeChart = new Chart(
        document.getElementById('gradeChart'),
        config
    );
    //Set the max height of the associates list to the height of the chart so that the list does not over flow
    let box = document.getElementById('gradeChart');
    let chartHeight = box.offsetHeight;
    chartAssociatesList.style.maxHeight=chartHeight + "px";

}
// Updates chart depending on who you select from the Associate list
async function generateChartAssociateUpdate(week, associateArrNumber, associateFullName){
    let associatesArrGrades = [];
    gradeCache[week][associateArrNumber].map(associate => associatesArrGrades.push(associate))
    //Sees if you have checked or unchecked
    const checkbox = document.getElementById(`checkbox${associateArrNumber}`).checked;
    if(checkbox === true){
        const newData = {
            label: associateFullName,
            backgroundColor: associateChartColor[associateArrNumber],
            borderColor: associateChartColor[associateArrNumber],
            data: associatesArrGrades};
        gradeChart.data.datasets.push(newData);
    }else{
        for(let i = 0; i < gradeChart.data.datasets.length; ++i) {
            if(gradeChart.data.datasets[i].label === associateFullName){
                gradeChart.data.datasets.splice(i, 1);
            }
        }
    }

    gradeChart.update();
}
//
function generateUpdatedChart(week){
    let assessmentsArrNames = [];
    let averageArrGrades = [];
    assessmentsArr[week].map(assessment => assessmentsArrNames.push(assessment.assessmentTitle));
    for(let j = 0; j < assessmentsArr[week].length; ++j) {
        let avg = "-";
        let avgInfo = assessmentIDToAverageCache[week].get(assessmentsArr[week][j].assessmentId);
        if(avgInfo) avg = avgInfo.average;
        averageArrGrades.push(avg)
    }
    gradeChart.data = {
        labels: assessmentsArrNames,
        datasets: [{
            label: 'Class Average',
            backgroundColor: '#4694c4', 
            borderColor: '#4694c4',
            data: averageArrGrades,
        }]};
    gradeChart.update();
}


//updateAssessInfo is called whenever you click on an assessment in the Batch Home page. This updates the two lines that tells you what type and category the assessment belongs to.
//Assessment types are currently fixed, so a switch determines which type to display based on typeId.
//The Category name is retrieved from the DB using the given ID and displayed using getCategoryNameComplete.
async function updateAssessInfo(typeId, catId) {
    let typeName = "";
    let typeNum = 0;

    switch (typeId) {
        case 1:
            typeName = "QC";
            typeNum = 100;
            break;
        case 2:
            typeName = "Quiz";
            typeNum = 40;
            break;
        case 3:
            typeName = "One-on-Ones";
            typeNum = 60;
            break;
        case 4:
            typeName = "Project";
            typeNum = 80;
            break;
    }

    let response_func = getCategoryNameComplete;
    let endpoint =  `categories/${catId}`;
    let url = java_base_url + endpoint;
    let request_type = "GET";
    let response_loc = false;
    let load_loc = false;
    let jsonData = false;

    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData);
    document.getElementById('assessTypeText').innerText = "Assessment Type: "+typeName;
    document.getElementById('assessWeightText').innerText = "Default weight is "+String(typeNum);
}

function getCategoryNameComplete(status, response, response_loc, load_loc) {
    if(status==200){
        //console.log("Success");
        let catName = JSON.parse(response);
        //console.log(catName.name);
        document.getElementById('assessCategoryText').innerText = "Assessment Category: "+catName.name;
    }else{
        console.log("Potential Failure");
        console.log(JSON.parse(response));
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
    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData);
}
function getAssessmentsForWeekComplete(status, response, response_loc, load_loc) {
    if (status == 200) {
        assessmentsArr[curWeek] = JSON.parse(response); 
    }
}

//Update all grades in the table
async function updateTableGrades(week) {
    let response_func = updateTableGradesComplete;
    let endpoint =  `grades`;
    let url = java_base_url + endpoint;
    let response_loc = ``;
    let load_loc = "";
    //Disable dropdown until we are done updating
    let dropdownDOM = document.getElementById("week-num");
    dropdownDOM.disabled = true;
    for(let i = 0; i < associates.length; ++i) {
        for(let j = 0; j < assessmentsArr[week].length; ++j) {
            //skip non negative grade values or -; these were not updated
            if(gradeCache[week][i][j] === "-" || gradeCache[week][i][j] > 0)
                continue;
            //0 edge case - compare values and see if edited
            newGradeValueDOM = document.getElementById(`grade-data-${i}-${j}`);
            if(gradeCache[week][i][j] === 0) {
                if(gradeCache[week][i][j] === newGradeValueDOM.value) continue;
            }
            //Set our method depending on value
            let method = "PUT";
            if(gradeCache[week][i][j] === "*") method = "POST";
            
            let jsonData = {
                "associateId": associates[i].id,
                "assessmentId": assessmentsArr[week][j].assessmentId,
                "score": newGradeValueDOM.value
            };
            await ajaxCaller(method, url, response_func, response_loc, load_loc, jsonData);
        }
    }
    dropdownDOM.disabled = false;
}
function updateTableGradesComplete(status, response, response_loc, load_loc) {
    console.log(status);
    if(status === 200 || status === 201) {
        const updatedGrade = JSON.parse(response);
        let i = associateIDToTableRow[curWeek].get(updatedGrade.associateId);
        let j = assessmentIDToTableCol[curWeek].get(updatedGrade.assessmentId);
        const totalDataDOM = document.getElementById(`total-data-${i}`);
        const avgDataDOM = document.getElementById(`avg-data-${j}`);

        //if this is this first new grade for a column place it inside of our cache
        if(!assessmentIDToAverageCache[curWeek].get(updatedGrade.assessmentId)) {
            assessmentIDToAverageCache[curWeek].set(updatedGrade.assessmentId, {
            'average': 0,
            'numScores': 0
            });
        }

        //Update average + total
        let avgInfo = assessmentIDToAverageCache[curWeek].get(updatedGrade.assessmentId);
        let curTotal = avgInfo.average * avgInfo.numScores;
        let curAssociateTotal = Number(totalDataDOM.innerHTML);
        console.log(avgInfo, curTotal);
        curTotal += updatedGrade.score;
        curAssociateTotal += updatedGrade.score;
        if(gradeCache[curWeek][i][j] === "*") {
            //new grade added
            avgInfo.average = curTotal / (++avgInfo.numScores);
        } else {
            //grade updated
            curTotal += gradeCache[curWeek][i][j];
            curAssociateTotal += gradeCache[curWeek][i][j];
            avgInfo.average = curTotal / avgInfo.numScores;
        }
        console.log(avgInfo, curTotal);
        avgDataDOM.innerHTML = parseFloat(avgInfo.average, 10).toFixed(2);
        totalDataDOM.innerHTML = curAssociateTotal;
        //update cache
        gradeCache[curWeek][i][j] = updatedGrade.score;
        toggleAlert(true, "Successfully updated grade table.");
    }
    else if(status === 404) {
        //keep original value - do nothing
        //BUG - possibly change style to show user a value was invalid
        toggleAlert(false, "Error updating grade error.");
    }else if(status >= 500){
        toggleAlert(false, "Internal service error.");
    }
    generateUpdatedChart(curWeek);
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
            assessmentIDToAverageCache = new Array(batch.totalWeeks+1);
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
        //Get assessments and grades for the week if we didnt already
        if(!gradeCache[curWeek]) {
            await getAssessmentsForWeek(curWeek);
            await getAveragesForWeek(curWeek);
            await getBatchGradesForWeek(curWeek);
        }
        generateTable(curWeek);
        dropdownDOM.disabled = false;
        generateChart(curWeek);
        
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
        generateChart(curWeek);
        generateUpdatedChart(curWeek);
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

//list of categories (category ID's) to add upon submit
let pendingCategories = new Map();
let assessment_id;
let category_id;
let cur_category;
async function checkValid(){
    let form = document.getElementById("createAssessmentForm");
    if (form.checkValidity() === true) {
        await createAssessment();//creates new assessment
        
        for([cat_name, cat_id] of pendingCategories){
            await postCategory(cat_name, cat_id);//creates all pending categories
        }
    }
    displayCategories();
}

async function postCategory(cat_name, cat_id){
    let request_type = "POST";
    arr = assessmentsArr[curWeek].length-1;
    let endpoint = `assessments/${assessmentsArr[curWeek][arr].assessmentId}/categories/${cat_id}`;
    let url = java_base_url + endpoint;
    let response_func = newCategory_Complete;
    let response_loc = "";
    let load_loc = "";
    let jsonData = {'name': cat_name, 'id': cat_id};
    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData);
}

function postCategory_Complete(status, response, response_loc, load_loc){
    if(status === 201){
        toggleAlert(true, "Category successfully created.");
        clearFields();
    }
    else{
        toggleAlert(false, "Failed to post category.");
        clearFields();
    }
}

function clearFields(){
    document.getElementById("assessment-title").value = "";
    pendingCategories.clear();
    displayCategories();
}

async function newCategory(){
    let request_type = "POST";
    let endpoint = `categories`;
    let url = java_base_url + endpoint;
    let response_func = newCategory_Complete;
    let response_loc = "";
    let load_loc = "";
    let jsonData = {'name': document.getElementById("new-category").value};
    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData);
}

function newCategory_Complete(status, response, response_loc, load_loc){
    if(status === 201){
        document.getElementById("new-category").value = "";
        toggleAlert(true, "Category successfully created.");
    }
    else{
        toggleAlert(false, "Failed to create category.");
    }
}

async function getCategories() {
    let response_func = getCategories_Complete;
    let endpoint =  `categories`;
    let url = java_base_url + endpoint;
    let request_type = "GET";
    let response_loc = false;
    let load_loc = false;
    let jsonData = false;

    
    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData);
}

let categories;
function getCategories_Complete(status, response, response_loc, load_loc){
    if(status===200){
        categories = JSON.parse(response);
        let select = document.getElementById("category-select");
        let category;
        for(let i=0;i<categories.length;i++){
            category = categories[i];
            if(document.getElementById(category.name) == null){
                let option = document.createElement(`option`);
                option.id = category.name;
                option.value = category.name;
                option.innerHTML = category.name;
                // option.onclick = addCategoryList(category);
                select.appendChild(option);
                
            }
        }
    }else{
        console.log("Potential Failure");
    }
}

async function getCategoryByAssessment(assessId){
    let response_func = getCategoryByAssessment_Complete;
    let endpoint =  `assessments/${assessId}/categories`;
    let url = java_base_url + endpoint;
    let request_type = "GET";
    let response_loc = false;
    let load_loc = false;
    let jsonData = false;

    await ajaxCaller(request_type, url, response_func, response_loc, load_loc, jsonData);
}

function getCategoryByAssessment_Complete(status, response, response_loc, load_loc){
    if(status===200){
        categories = JSON.parse(response);
        let catText = "";
        for(let i=0;i<categories.length;i++){
            category = categories[i];
            catText += category.name+", ";
        }
        document.getElementById('assessCategoryText').innerText = "Assessment Category: "+catText.slice(0,-2);
    }else{
        console.log("Potential Failure");
    }
}

async function addCategory(){
    if(document.getElementById("category-select").value == null){//no option selected upon an add
        toggleAlert(false, "Please select a category.");
        return;
    }
    let value = document.getElementById("category-select").value;
    let category;
    for(let i=0;i<categories.length;i++){
        category = categories[i];
        if(category.name == value){
            addCategoryList(category);//add to list, will POST all upon clicking submit button
            document.getElementById("category-select").selectedIndex = -1;
        }
    }
    displayCategories();
}

function addCategoryList(category){
    if(pendingCategories.has(category.name)){//if category already in pending list
        toggleAlert(false, "Category already added.");
        return;
    }
    else{
        pendingCategories.set(category.name, category.categoryId);
    }
}

function cancelCategory(category_name){
    
    pendingCategories.delete(category_name.id);
    displayCategories();
}

function displayCategories(){
    let li = document.getElementById("category-list");
    li.innerHTML = ``;
    for(let [cat_name, cat_id] of pendingCategories){
        li.innerHTML += `
        <li id="li${cat_name}">${cat_name}
        <button style="float:right" id="cancel${cat_id}" type="button" class="remove-row" onclick="cancelCategory(${cat_name})">Cancel<i class="fa fa-times-circle-o" aria-hidden="true"></i></button>
        </li><br />`;
    }
       
}


/**
 * This function toggles the alert in batch_home.html 
 *@param {boolean} isSuccessful flag to indicate if success or not
 *@param {string} message the message you want to display on the alert
 **/
const toggleAlert = function(isSuccessful, message){
    const alert = document.getElementById('batch_home_alerts');
    alert.innerHTML = message;
    if(isSuccessful) alert.className = 'alert alert-success show';
    else alert.className = 'alert alert-danger show';

    setTimeout(() => {
        alert.className = "alert alert-primary hidden";
        alert.innerHTML = "";
    }, 1500);
}
