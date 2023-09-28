/**
 * This hooks together all the CampusExplorer methods and binds them to clicks on the submit button in the UI.
 *
 * The sequence is as follows:
 * 1.) Click on submit button in the reference UI
 * 2.) Query object is extracted from UI using global document object (CampusExplorer.buildQuery)
 * 3.) Query object is sent to the POST /query endpoint using global XMLHttpRequest object (CampusExplorer.sendQuery)
 * 4.) Result is rendered in the reference UI by calling CampusExplorer.renderResult with the response from the endpoint as argument
 */

btnSubmit = document.getElementById("submit-button");
resContainer = document.getElementById("result-container");
let a;
btnSubmit.addEventListener("click", function (event) {
    let query = CampusExplorer.buildQuery();
    let response = CampusExplorer.sendQuery(query);
    a = JSON.stringify(query);
    response.then((d) => {
        // a = JSON.parse(d);
        console.log(d);
        // CampusExplorer.renderResult(JSON.parse(d).ids);
        CampusExplorer.renderResult(JSON.parse(d.responseText));
    }).catch( (e) => {
        console.error(`send failed: ${e}`)
    })
});

