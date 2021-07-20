//urls
let base_url = "http://34.204.173.118:5000/";
let java_base_url = "http://34.204.173.118:7001/";

//state variables
let loginData = new Object();
let batches = new Object();
let months = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
/*the followin 2 variables represents whether 
/*you are on this page in main nav or not*/
let onPage = "text-light";
let offPage = "text-dark";
// temporarily holds the main body content if user is not logged in until user logs in
let tempMainContentHolder = $("#mainbody").html();

//create local storage key 'batchId'
if (!window.localStorage["batchId"]){
    localStorage.setItem("batchId", null);
}

// header markup 
let mainHeader = `
<nav class="nav top-nav navbar-expand-lg d-flex justify-content-between bg-dark" aria-labelledby="Topbar navigation">
    <a class="navbar-toggler rounded-0" type="button" data-toggle="collapse" data-target="#navbarToggle" aria-controls="navbarToggle" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon text-darker text-center rounded-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
            </svg>
        </span>
    </a>
    <a class="navbar-brand order-xs-1 order-sm-1 order-md-1 order-lg-1 order-md-1 col col-6 col-sm-4 col-md-3 col-lg-2" href="home.html"><img src="images/rev-logo.png" alt="Revature Logo"></a>
    <div class="order-xs-3 order-sm-3 order-md-2 order-lg-3 order-md-3 mr-3 col col-3 col-sm-2">
        <a id="loginBtn" data-toggle="modal" data-target="#loginModal" data-preLoad="Some content to pre-load" class="nav-link d-flex text-dark bg-info align-items-center">Log In &nbsp;<i class="fa fa-sign-in" aria-hidden="true"></i></a>
    </div>
    <div class="collapse navbar-collapse order-xs-3 order-sm-3 order-md-3 order-lg-2 col-xs-12 bg-dark py-3" id="navbarToggle">
        <form class="mr-5 col-md-9 col-sm-12 needs-validation" novalidate autocomplete="off">
            <div class="input-group">
                <div class="input-group-prepend">
                    <label for="search" id="searchLabel" class="input-group-text bg-darkest border-none text-light"><i class="fa fa-search" aria-hidden="true"></i></label>
                </div>
                <input oninput="document.getElementById('searchSuggestion').classList.remove('d-none');searchBatches(this.value);" id="search" class="form-control bg-darkest border-none col col-12 rounded-right" type="search" placeholder="Search" aria-label="Search" aria-describedby="Search a batch" />
                <div class="bg-darkest rounded col col-12 p-3 d-none" id="searchSuggestion"></div>
            </div>
        </form>
    </div>
</nav>`;

//markup when user is not logged in
let mustLogin = `
<div class="col-sm-1-10">
    <div class="card mb-5 bg-darker p-3">
        <div class="card-body rounded p-3">
            <h3 class="card-title"><strong>Please Log In</strong></h3>
            <p class="">If you would like to view your batches then please <a data-toggle="modal" href="#loginModal">Log In Here</a>, or you may click the link above.</p>
        </div>
    </div>
</div>`;

/** Function to perform fetch request
 * @param {string} requestMethod method of request GET, POST...etc.
 * @param {string} url address to send request to
 * @param {object} requestBody (optional) object to send in body with request
 * @throws error if fetch fails
 * @return {object} response object returned by fetch  
 **/
async function fetchFactory(requestMethod, url, requestBody){
    //Build request config
    let config = {
        method: requestMethod,
        mode: 'cors',
        credentials: 'same-origin',
        referrerPolicy: 'no-referrer'
    };
    if(requestBody) {
        config.headers = {'Content-Type': 'application/json'};
        config.body = JSON.stringify(requestBody);
    }
    try{
        const response = await fetch(url, config);
        return response;
    }catch(err){
        console.log('failed to fetch resource...');
    }
}

/**
 * @param {string} requestMethod method of request GET, POST...etc.
 * @param {string} url address to send request to
 * @param {function} cbFunction callback function to execute  
 * @param {string} responseLocation (optional) the element that needs to be updated on UI
 * @param {string} loaderLocation (optional) the position of the loader by element ID
 * @param {object} requestBody (optional) object to send in body with request
 **/
async function fetchAndUpdateUi(requestMethod, url, cbFunction, responseLocation, loaderLocation, requestBody) {
    toggleLoader(true, loaderLocation);
    const response = await fetchFactory(requestMethod, url, requestBody);
    const responseJSON = await response.text();
    toggleLoader(false, loaderLocation);
    cbFunction(response.status, responseJSON, responseLocation, loaderLocation);
}

/**Log in handler for login button.
 * @param {string} email email input to login
 * @param {function} cbFunction callback function to execute
 */
async function logMeIN(email, cbFunction = logMeIN_complete){
    let url = base_url + 'login';
    let requestMethod = "POST";
    let responseLocation = "loadResult";
    let loaderLocation = "logload";
    let requestBody = email;
    await fetchAndUpdateUi(requestMethod, url, cbFunction, responseLocation, loaderLocation, requestBody);
}

/** 
 * Function to toggle the loader.
 * @param {boolean} onOroff flag to indicate whether loader should be turned on or off
 * @param {string} location id of dom element where loader should be loaded
 */
function toggleLoader(onOroff, loaderLocation){
    if(onOroff){
         //check if loaderLocation exists
        if(document.getElementById(loaderLocation)) {
            document.getElementById(loaderLocation).innerHTML = "";
            //creates loader
            let loaderAnimation = document.createElement("div");
            loaderAnimation.setAttribute("class", "loader");
            document.getElementById(loaderLocation).appendChild(loaderAnimation);
        }
    }else{
        const loaderDom = document.getElementById(loaderLocation);
        if(loaderDom) loaderDom.innerHTML = "";
    }
}

/**
 * Function that runs after response to login completes
 * @param {number} status status code from response
 * @param {string} response JSON string body of response 
 * @param {string} responseLocation id of dom element to be updated
 */
function logMeIN_complete(status, response, responseLocation) {
    //action if code 200
    if(status == 200) {
        //update UI
        document.getElementById("loginBtn").innerHTML = `Log Out &nbsp;<i class="fa fa-sign-out" aria-hidden="true"></i>`;
        document.getElementById("loginBtn").setAttribute("data-target", "#logoutModal");
        //preserve state and save session storage
        saveSession(loginData, response);
        loginData = getSession(loginData, true);
        //check if user is admin
        if(loginData["admin"]){
            goToAdminPage(true);
        }
        //update UI
        $('#loginModal').modal('hide');
        pageDataToLoad();
    }else if(status == 201) {
        document.getElementById(responseLocation).innerHTML = JSON.parse(response);
    }else if(status == 404) {
        document.getElementById(responseLocation).innerHTML = `<p class="text-danger">${response}!</p>`;
    }
}

/**
 * Function to search fetch batches
 * @param {string} searchVal 
 */
async function searchBatches(searchVal) {
    let cbFunction = searchBatches_complete;
    let endpoint = `trainers/${loginData.id}/batches?track=${searchVal}`;
    let url = base_url + endpoint;
    let requestMethod = "GET";
    let responseLocation = "searchSuggestion";
    let loaderLocation = responseLocation;
    let requestBody = "";
    if(searchVal && loginData.id != undefined) {
        await fetchAndUpdateUi(requestMethod, url, cbFunction, responseLocation, loaderLocation, requestBody);
    } else if(loginData.id == undefined) {
        document.getElementById('searchSuggestion').innerHTML = `<div class="d-block m-1 bg-lighter rounded"><p class="d-block text-center text-black p-3 bg-lighter rounded">Please <a class="text-info login-modal-link rounded" data-toggle="modal" href="#loginModal">Log In</a> to use this search feature.</p></div>`;
    }
    if(!searchVal) {
        if(!document.getElementById('searchSuggestion').classList.contains("d-none")) {
            document.getElementById('searchSuggestion').classList.add('d-none');
        }
    }
}

/**
 * Function to execute after batch fetch competes.
 * @param {number} status response status code 
 * @param {object} response response object returned from fetch
 * @param {string} responseLocation id of do element where ui must update due to response
 */
function searchBatches_complete(status, response, responseLocation) {
    //action if code 200
    if(status == 200) {
        let parsedResponse = JSON.parse(response);
        console.log(parsedResponse);
        if(Object.keys(parsedResponse).length <= 0) {
            document.getElementById(responseLocation).innerHTML = `<div class="d-block m-1 bg-lighter rounded"><p class="d-block text-center text-black p-3 bg-lighter rounded">- No Batches with this name exist! -</p></div>`;
        } else {
            document.getElementById(responseLocation).innerHTML = styleSearch(parsedResponse, document.getElementById("search").value);
        }
        //action if code 201
    } else if(status == 201) {
        document.getElementById(responseLocation).innerHTML = JSON.parse(response);
        //action if code 400
    } else if(status == 400) {
        //load the response into the responseLocation
        document.getElementById(responseLocation).innerHTML = response;
    }
}


//Iterates through all forms on a page then cancels the forms default functions
//validates form data based on elements attributes and 'is-valid' class
(function() {
    'use strict';
    window.addEventListener('load', function() {
        //set up header content
        $("#headContent").html(mainHeader);
        
        //session data space
        // Logged in check
        if(getSession(loginData, true)){
            loginData = getSession(loginData, true);
            pageDataToLoad();
            $("#loginBtn").html(`Log Out&nbsp;<i class="fa fa-sign-out" aria-hidden="true"></i>`);
            document.getElementById("loginBtn").setAttribute("data-target", "#logoutModal");
        } else {
            tempMainContentHolder = $("#mainbody").html();
            $("#mainbody").html(mustLogin);
        }

        //set up main nav links
        //this is so you do not have to copy paste to every page
        $("#navController").html(setMainNav());

        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.getElementsByClassName('needs-validation');
        // Loop over them and prevent submission
        Array.prototype.filter.call(forms, function(form) {
            form.addEventListener('submit', function(event) {
                event.stopPropagation();
                event.preventDefault();
                if (form.checkValidity() === false) {
                    //at least one element does not have a valid value
                    console.log("Form not valid");
                } else {
                    //all elements are valid
                    console.log("Form is valid");
                }
                form.classList.add('was-validated');
            }, false);
        });
    }, false);
})();
// Chapter 3. Onload.Body Initializers End ----------------

// Chapter 4. Listeners -----------------------------------
// Chapter 4. Listeners End -------------------------------

// Chapter 5. Arrow/Anonymous Functions -------------------
// Chapter 5. Arrow/Anonymous Functions End ---------------

// Chapter 6. Misc Named Functions ------------------------

// Sets the main navigation
function setMainNav() {
    //some of these are stretch goal links so they are commented out until they can be completed
    return `
    <a class="nav-link ${onHome} d-flex align-items-center justify-content-center justify-content-md-start" title="Home" href="home.html"><i class="fa fa-home" aria-hidden="true"></i>&nbsp;<span class="d-none d-md-inline">Home</span></a>
    <a class="nav-link ${onBatch} d-flex align-items-center justify-content-center justify-content-md-start" title="Batch" href="batch_home.html"><i class="fa fa-users" aria-hidden="true"></i>&nbsp;<span class="d-none d-md-inline">Batch</span></a>
    `;
}

// ---------- pulling and saving form data ------------

// logout function
function logout(){
    $("#loginBtn").html(`Log In&nbsp;<i class="fa fa-sign-in" aria-hidden="true"></i>`);
    document.getElementById("loginBtn").setAttribute("data-target", "#loginModal");
    tempMainContentHolder = $("#mainbody").html();
    $("#mainbody").html(mustLogin);
    loginData = new Object();
}

/*
 * Extracts form elements and maps to passed in object
 */
 function extractObjectFromForm($fieldContainer,objectType) {
    var innerArray=[];
    var obj = $.map($fieldContainer.find(":input"), function(n, i)
    {
        var o = {};
        if($(n).is("input:text") 
                || $(n).is("textarea") 
                || $(n).is("input:hidden") 
                || $(n).is("input:password"))
            o[n.name] = $(n).val();
        else if($(n).is("input:checkbox"))
            o[n.name] = ($(n).is(":checked") ? true:false);
        else if(n.type == 'radio') {
            if(innerArray.indexOf(n.name)==-1) {
                innerArray.push(n.name);
            }
        }
        else
            o[n.name] = $(n).val();
        return o;
    });
    $.each(innerArray,function(index,item){
        var iobj={};
        iobj[item]=$("input[name='"+item+"']:checked").val();
        obj.push(iobj);
    });
    return getObjectFromObject(obj,objectType);
}


// Takes a object created from a form scour and
// converts it to an Object type
function getObjectFromObject(formObject,outputObject) {
    $.each(formObject,function(index,item){
        $.each(item,function(key,value){
            if(key) {
                outputObject[index] = item;
            }
        });
    });
    console.log(outputObject);
    return outputObject;
}

//pre-load both the services page and the activities page
function preloadService(formObject) {
    $.each(formObject,function(index,item){
        if(document.getElementById(index)) {
            if(typeof(formObject[index].isSelected) == 'boolean') {
                $('#'+index).prop('checked', true);
            } else {
                document.getElementById(index).value = formObject[index].quantity;
            }
        }
    });
}

//  --------- Manipulating sessionStorage -------------

//Directs user to another page
//use to customize any functionality to send a user to a new page
function goToBatchPage(batchId) {
    window.localStorage["batchId"]= batchId;
    window.location.href = "batch_home.html";
}

function goToAdminPage(isAdmin) {
    window.sessionStorage["isAdmin"]= isAdmin;
    window.location.href = "admin.html";
}

//retrieves the session and saves it somewhere
//if expecting an object pass in optional second arg, make it true
//Getter
function getSession(getData, isObj) {
    if(isObj && sessionStorage[getData]) {
        return JSON.parse(sessionStorage[getData]);
    } else if(sessionStorage[getData]) {
        return sessionStorage[getData];
    } else {
        return;
    }
}

// Adding new value to storage
function newStorage(key, val) {
    if(sessionStorage.getItem(key) == undefined) {
        sessionStorage.setItem(key, val);
    }
}

//save a value to a session
//if object must save as JSON.stringify(val)
//do this or break up the object and pass in
//Setter
function saveSession(key, val) {
    //check if val is an object and turn to string
    let stringVal;
    if(typeof(val) === "object") {
        stringVal = JSON.stringify(val);
    } else {
        stringVal = val;
    }
    //save session if exists else create a new session key pair
    if(sessionStorage.getItem(key) != undefined) {
        sessionStorage.removeItem(key);
        sessionStorage.setItem(key, stringVal);
    }
    else {
        newStorage(key, stringVal);
    }
}

// Remove all storage data
function wipeStorage() {
    sessionStorage.clear();
}

//this sets the date ranges allowed for a form input["date"] element
function getDateFormat(myDate, addDay, addMonth, addYear) {
    myDate.setUTCDate(myDate.getUTCDate());
    //to increase the future date just add a number to it ex. +5
    let n = myDate.getUTCHours()+4;
    let dd = myDate.getUTCDate()+addDay;
    let mm = myDate.getUTCMonth()+1+addMonth; //January is 0!
    let yyyy = myDate.getFullYear()+addYear;
    if(dd<10){
        dd='0'+dd
    } 
    if(mm<10){
        mm='0'+mm
    } 

    myDate = yyyy+'-'+mm+'-'+dd;
    return myDate;
}

// finds the difference between 2 dates in days
function dateDiff(date1, date2) {
    let diff = (date2 - date1)/1000;
    diff = Math.abs(Math.floor(diff));
    dateDiffHolder = Math.floor(diff/(24*60*60));
    if(date1 > date2) {
        dateDiffHolder = 0;
    }
    return dateDiffHolder+1;
}

//load data that needs loaded more than once to anywhere that contains this class
function loadinfoByClass(theClass, dataToLoad) {
    let trainerName = document.getElementsByClassName(theClass);
    Array.from(trainerName).forEach(element => {
        element.innerHTML = dataToLoad;
    });
}
//same as the onload except need to re-attach add-listeners
function newGenForms() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    Array.prototype.filter.call(forms, function(form) {
        form.addEventListener('submit', function(event) {
            event.stopPropagation();
            event.preventDefault();
            if (form.checkValidity() === false) {
                //at least one element does not have a valid value
                console.log("Form not valid");
            } else {
                //all elements are valid
                console.log("Form is valid");
            }
            form.classList.add('was-validated');
        }, false);
    });
}
// function to style the search results
function styleSearch(searchJson, searchTxt) {
    let display = "";
    $.each(searchJson,((index, item) => {
        display += `<div class="d-block m-1 bg-lighter rounded"><a onclick='setSearchBatch(${item.id})' href="batch_home.html" class="d-block text-white p-1 bg-lighter rounded" ><strong class="text-black">${item.trainingTrack.substr(0, searchTxt.length)}</strong>${item.trainingTrack.substr(searchTxt.length)}<small> - <i>[${item.name}]</i> Started(${item.startDate}) and goes for ${item.totalWeeks} weeks</small></a></div>`;
    }));
    return display;
}
/*execute a function when someone clicks in the document:*/
//this is to close the autocomplete search if you click off
function setSearchBatch(id){
    window.localStorage["batchId"]=id;
}
document.addEventListener("click", function (e) {
    closeAllLists(e.target);
});
//check to see if you clicked off search results then makes it go away
function closeAllLists(clickOn) {
    if (clickOn != document.getElementById('searchSuggestion') && clickOn != document.getElementById('search')) {
        if(!document.getElementById('searchSuggestion').classList.contains("d-none")) {
            document.getElementById('searchSuggestion').classList.add('d-none');
        }
    }
}
//detects if you hit the x in a search to clear the search bar
$('input[type=search]').on('search', function () {
    // search logic here
    // this function will be executed on click of X (clear button)
    if(!document.getElementById('searchSuggestion').classList.contains("d-none")) {
        document.getElementById('searchSuggestion').classList.add('d-none');
    }
});
// Chapter 6. Misc Named Functions ------------------------
