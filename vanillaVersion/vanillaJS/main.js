const pythonUrl = "http://localhost:3000/";
const javaUrl = "http://localhost:7001/";

/*local cache*/
let state = {};

/**
 * Function to fetch user login credentials
 * @return {Promise <object>} returns promise to return user credentials as object
 * @throws throws an error on fail to load resource
 **/
const login = async function (){
    try{
        const config = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify({email: emailInput.value})
        };
        let response = await fetch(`${pythonUrl}trainers`, config);
        let data = await response.json();
        if(response.ok){
            return data;
        }else{
            throw new Error("Failed to fetch data");
        }
    }catch(e){
        throw Error(e.message);
    }
}

/**
 * Function to fetch user's available batch years
 * @return {Promise <object>} returns a promise to resolve the user year information as an object
 * @throws throws an error on fail to load resource
 **/
const getYearsForTrainer = async function (){
    try{
        let response = await fetch(`${pythonUrl}years?trainerId=${state.user.id}`);
        let data = await response.json();
        if(response.ok){
            return data;
        }else{
            throw new Error("Failed to fetch data");
        }
    }catch(e){
        throw Error(e.message);
    }
}

/**
 * Function to fetch the user's batches for a given year
 * @param {number} year
 * @return {Promise <object>} returns a promise to resolve the user's batches as an array(e.g. {2020: [{obj}, {obj}...]})
 * @throws throws an error on fail to load resource
 **/
const getMyBatchesByYear = async function(year){
    try{
        let response = await fetch(`${pythonUrl}trainers/${state.user.id}/batches?year=${year}`);
        let data = await response.json();
        if(response.ok){
            return data;
        }else{
            throw new Error("Failed to fetch data");
        }
    }catch(e){
        throw Error(e.message);
    }
}

/**
 * Function that will recover state with what is in 
 * local storage and will execute a callback
 * @param {function} callback 
 * @return {void}
 **/
const onPageLoad = function(callback){
    if(!callback) callback = () => {};
    state = getLocalStorage();
    callback();
}

/**
 * Function that stores local cache 'state' in local storage if it exists
 * @return {void}
 **/
const setLocalStorage = function(){
    if (state) localStorage.setItem('data', JSON.stringify(state));
}

/**
 * Function that retrieves local storage to state
 * @return {object} returns an empty object if no local storage
 * or returns the data in local storage 
 **/
const getLocalStorage = function(){
    return JSON.parse(localStorage.getItem('data')) || {};
}

/**
 * Function that retrieves local storage to state
 * @return {voit}
 **/
const logOut = function(){
    localStorage.clear();
    updateMainSectionToUI();
    updateNavBar();
    redirectTo("homeVanilla.html");
}

/**
 * Function that redirects the current page to target url
 * @param {string} url the target url
 * @return {void} returns an empty object if no local storage
 * or returns the data in local storage 
 **/
const redirectTo = function(url){
    window.location = url;
}