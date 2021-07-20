const pythonPath = "http://ec2-34-204-173-118.compute-1.amazonaws.com:5000";
const bucketPath = "http://adam-ranieri-batch-1019.s3.amazonaws.com";
let java_base_url = "http://34.204.173.118:7001/";

/**
 * populates the tech stacks tables with every assessment and average
 * @param {String} category The name of the category 
 */
async function getAssessments(category){
    const response = await fetch(`http://34.204.173.118:7001/categories/${category}/averages`);
    const assessments = await response.json();
    
    let innerRows = "";
    for(let assessment of assessments) {
        innerRows += `
        <tr>
        <td>${assessment.title}</td>
        <td>${assessment.averageScore}</td>
        </tr>`

        document.getElementById(`${category}Stack`).innerHTML = innerRows;
    }

}


/**
 * Creates tables for each all the tech stack categories
 */

// currently the database is not set properly for categories related to assessments
async function getAllCategories(){
    const response = await fetch(`http://34.204.173.118:7001/categories`);
    const categories = await response.json();

    // creates cards for every tech stack and tables
    let stacks = "";
    for(let cat of categories){
        stacks += `
        <div class="d-flex-inline-block flex-fill p-4 mr-2 bg-darker border border-dark">
            <h4 class="card-title">${cat.name}</h4>
            <hr class="bg-light">
            <table class="table table-dark table-hover">
                <thead>
                    <tr>
                        <th id="assessmentName">Asssessment</th>
                        <th id="assessmentAverages">Average</th>
                        </tr>
                </thead>
                <tbody id="${cat.name}Stack">
                </tbody>
            </table>
        </div>
        `
        document.getElementById("techStacks").innerHTML = stacks;
        getAssessments(cat.name);
    }

    /**
     * populates the tech stacks tables with every assessment and average
     * @param {String} category The name of the tech stack
     */
    async function getAssessments(category){
        const response = await fetch(`http://34.204.173.118:7001/categories/${category}/averages`);
        const assessments = await response.json();
        
        let innerRows = "";
        for(let assessment of assessments) {
            innerRows += `
            <tr>
            <td>${assessment.title}</td>
            <td>${assessment.averageScore}</td>
            </tr>`

            document.getElementById(`${category}Stack`).innerHTML = innerRows;
        }
    
    }
}
/**
 * Clears the users session storage
 */
function wipeStorage() {
    sessionStorage.clear();
}

/**
 * Logs the user out and redirects them to the homepage
 */
function logout(){
	document.location = bucketPath + "/home.html"
}

getAllCategories();

