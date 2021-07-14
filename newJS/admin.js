const unaddedAssoc = document.getElementById("unaddedAssociates");
const addedAssoc = document.getElementById("addedAssociates");

async function getAllAssociates(){
    const config = {
        method: "GET",
    };
    const response = await fetch("http://ec2-34-204-173-118.compute-1.amazonaws.com:5000/associates", config);
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
        addedAssoc.appendChild(listItem);
    }
    console.log(unaddedAssoc.children);
    console.log(addedAssoc.children);
}


document.addEventListener("DOMContentLoaded", getAllAssociates);

