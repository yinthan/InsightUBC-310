
/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill) {
        let xhr = new XMLHttpRequest();
        let baseURL = "http://localhost:4321/";
        let url = baseURL + "query";
        xhr.open("POST", url, true);

        // xhr.addEventListener("load", () => {
        //     console.log("rec: " + JSON.stringify(query));
        //     console.log("rec: " + xhr.responseText);
        //     // fulfill(xhr.responseText);
        //     fulfill(xhr);
        // });

        xhr.onload = () => {
            console.log("sent: " + JSON.stringify(query));
            console.log("rec: " + xhr.responseText);
            // fulfill(xhr.responseText);
            fulfill(xhr);
        };

        // xhr.addEventListener("error", () => {
        //     // reject(xhr.responseText);
        //     reject(xhr);
        // });
        // xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(query));
    });
};
