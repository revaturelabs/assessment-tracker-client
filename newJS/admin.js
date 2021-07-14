const unaddedAssoc = document.getElementById("unaddedAssociates");
const addedAssoc = document.getElementById("addedAssociates");
let search = document.getElementById("searchAssociate");
const submit = document.getElementById("submitBatch");
const path = "http://ec2-34-204-173-118.compute-1.amazonaws.com:5000"

async function getAllAssociates(){
    const config = {
        method: "GET",
    };
    const response = await fetch(path + "/associates", config);
    const associates = await response.json();
    for(index in associates){
        unaddedAssoc.innerHTML+=`<li name="${associates[index].id}">${associates[index].firstName} ${associates[index].lastName}<input onclick="clickAssociate(this.parentElement)" type="checkbox"></li>`
    }
}

function clickAssociate(listItem){
    const parentList = listItem.parentElement;
    if(parentList === addedAssoc){
        unaddedAssoc.appendChild(listItem);
    }
    else{
        addedAssoc.innerHTML.appendChild(listItem);
    }
}

function filterList(){
    
    let input = search.value.toUpperCase();
    const associates = unaddedAssoc.children;

    // Associate is the list element in this for loop
    for(associate of associates){
        let assocName = associate.innerText;
        if(!assocName.toUpperCase().includes(input))
            associate.style.display = "none";
        else
            associate.style.display = "";
    }
}

async function createBatch(){
    const nameInput = document.getElementById("nameInput").value;
    const trackInput = document.getElementById("trackInput").value;
    const start = document.getElementById("startDate").value
    const end = document.getElementById("endDate").value
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const req = {
        "name": nameInput,
        "trainingTrack": trackInput,
        "startDate": startDate,
        "endDate": endDate 
    }

    const config = {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req)
	};

    const resp = await fetch(path+"/batches", config);
    console.log(resp);
    const batch = await resp.text();
    const batchId = Number(batch);
    const associates = addedAssoc.children;
    for(associate of associates){
        const assocId = associate.getAttribute("name");
        const body = {

        }

    }
    

    //associates is the array of all the list items
    
    
}


search.addEventListener("onkeyup", filterList);
submit.addEventListener("click", createBatch);
document.addEventListener("DOMContentLoaded", getAllAssociates);


