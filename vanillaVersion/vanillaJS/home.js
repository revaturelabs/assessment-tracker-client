const mainBody = document.getElementById('mainbody');
const emailInput = document.getElementById('recipient-email');
const emailValidAlert = document.querySelector('.invalid-feedback');
const loginSubmitBtn = document.getElementById('login_cred_button');
const logInOutBtn = document.getElementById('loginBtn');

/*UI Rendering*/
const renderNewBatchBtn = function(batches){
    const markup = batches.map(batch => {                                                                       
        const str = `<button id="${batch.trainingTrack}_button_${state.btnCounter}" style="margin-left: .17rem;" onclick="redirectTo('batch_home2.html')" class="d-inline-block my-2 btn btn-light text-primary border border-dark bg-darker p-1 rounded">${batch.trainingTrack} - ${batch.name}</button>`;
        state.btnCounter++;
        return str;
    });
        return markup.join('');
}

const renderNewBatchElement = function(year){
    let btns = [];
    state.btnCounter = 1;
    for(const yearBatches in state.user.batches){
        if(yearBatches === `${year}`)
            btns.push(renderNewBatchBtn(state.user.batches[yearBatches]));
    }
    delete state.btnCounter;
    return `
        <div id="batch_${year}" class="d-flex-inline-block flex-fill p-4 mr-2 my-2 bg-darker border border-dark">
            <h4 class="card-title">${year}</h4>
            <hr class="bg-light"/>
            ${btns.join('')}
        </div>`;
}

const renderAllBatchCards = function (){
    const markup = state.user.years.map(year => renderNewBatchElement(year.year));
    return markup.join("");
}

const renderMainSection = function(isLoggedIn){
    let markup = '';
    if(!isLoggedIn){
        markup = `<div class="col-sm-1-10">
            <div class="card mb-5 bg-darker p-3">
                <div class="card-body rounded p-3">
                    <h3 class="card-title"><strong>Please Log In</strong></h3>
                    <p class="">If you would like to view your batches then please <a data-toggle="modal" href="#loginModal">Log In Here</a>, or you may click the link above.</p>
                </div>
            </div>
        </div>`;
    }else{
        markup = `
        <div id="topMarker" class="col-sm-1-10">
            <div class="card mb-5 bg-darker p-3">
                <div class="card-body rounded p-3">
                    <h3 class="card-title"><i class="fa fa-user-circle-o" aria-hidden="true"></i><strong class="trainerName">${state.user.first_name+" "+state.user.last_name}</strong></h3>
                    <p class="text-muted">Information about <span class="trainerName">${state.user.first_name} ${state.user.last_name}</span>.</p>
                    <hr class="bg-lighter" /><br />
                    <h3 class="card-title"><i class="fa fa-users" aria-hidden="true"></i><strong>Batches</strong></h3>
                    <p class="text-muted">Shows a list of all the batches you have been attached to.</p>
                    <hr class="bg-lighter" />
                    <div id="batchLoader" class="d-flex justify-content-center">
                    </div>
                    <div id="yearsWorked" class="d-flex flex-wrap justify-content-around mb-3">
                        ${renderAllBatchCards()}
                    </div>
                    <a href="#topMarker">Back to Top&nbsp;<i class="fa fa-arrow-up" aria-hidden="true"></i></a>
                </div>
            </div>
        </div>`;
    }
    mainBody.innerHTML = markup;
}

const updateNavBar = function(){
    if(state.user) {
        logInOutBtn.innerHTML = `Log Out &nbsp;<i class="fa fa-sign-out" aria-hidden="true"></i>`;
        logInOutBtn.setAttribute("data-target", '#logoutModal');
    } else {
        logInOutBtn.setAttribute("data-target", '#loginModal');
        logInOutBtn.innerHTML = `Log In &nbsp;<i class="fa fa-sign-in" aria-hidden="true"></i>`;
    }
}

/*Application state changing functions*/
const initializeHomePage = function(){
    updateNavBar();
    updateMainSectionToUI();
}

const updateMainSectionToUI = function(){
    if(!state.user){
        renderMainSection(false);
    }else{
        renderMainSection(true);
    }
}

const getAllMyBatchesByYear = async function(){
    let obj = {};
    for(const year of state.user.years){
        obj[year.year] = {};
        obj[year.year] = await getMyBatchesByYear(year.year);
    }
    return obj;
}

//event handlers
const homelogInHandler = async function(e){
    e.preventDefault();
    try{
        state.user = await login();
        if(state.user){
            state.user.years = await getYearsForTrainer();
            state.user.batches = await getAllMyBatchesByYear();
            setLocalStorage();
            updateNavBar();
            updateMainSectionToUI();
        }else{
            updateNavBar();
            updateMainSectionToUI();
        }
    }catch(err){
        console.log(err.message);
    }
}

//Event Listener Binding
loginSubmitBtn.addEventListener('click', homelogInHandler);

//run on page load
onPageLoad(initializeHomePage);