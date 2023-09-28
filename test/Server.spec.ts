import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import * as fs from "fs";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        server.start().catch( (e) => {
            Log.p(e, "R");
        });
    });

    after(function () {
        // TODO: stop server here once!
        server.stop().catch( (e) => {
            Log.p(e, "R");
        });
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // TODO: read your courses and rooms datasets here once!

    // Sample on how to format PUT requests
    const datasetsToLoad: { [id: string]: string } = {
        coursesOne: "./test/data/coursesOne.zip",
        CWOthers: "./test/data/CWOthers.zip",
        empty: "./test/data/empty.zip",
        emptyC: "./test/data/emptyC.zip",
        falseExt: "./test/data/falseExt.zip",
        noFolder: "./test/data/noFolder.zip",
        others: "./test/data/others.zip",
        badSectionA: "./test/data/badSectionA.zip",
        badSectionR: "./test/data/badSectionR.zip",
        ext: "./test/data/ext.zip",
        notZip: "./test/data/notZip.png",
        picContent: "./test/data/picContent.zip",
        weird: "./test/data/weird~!@#$%^&().zip",
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
    };

    const SERVER_URL = "http://localhost:4321/";
    it("PUT test for courses dataset", function () {
        const ENDPOINT_URL = "/dataset/x/courses";
        const ZIP_FILE_DATA = Buffer.from(fs.readFileSync(datasetsToLoad["coursesOne"]).toString("base64"));
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.p(`sent`);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.p(`${err}`, "R");
                    expect.fail();
                });
        } catch (err) {
            Log.p(`init fail`, "R");
        }
    });

    it("PUT test for courses dataset, failed", function () {
        const ENDPOINT_URL = "/dataset/y/courses";
        const ZIP_FILE_DATA = Buffer.from(fs.readFileSync(datasetsToLoad["falseExt"]).toString("base64"));
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.p(`sent`, "R");
                    expect.fail();
                })
                .catch(function (err) {
                    Log.p(`${err}`);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.p(`init fail`, "R");
        }
    });

    it("DEL test for courses dataset", function () {
        const ENDPOINT_URL = "/dataset/x";
        try {
            return chai.request(SERVER_URL)
                .del(ENDPOINT_URL)
                .then(function (res: Response) {
                    Log.p(`sent`, "R");
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.p(`${err}`);
                    expect.fail();
                });
        } catch (err) {
            Log.p(`init fail`, "R");
        }
    });

    it("DEL test for courses dataset, notFound", function () {
        const ENDPOINT_URL = "/dataset/y";
        try {
            return chai.request(SERVER_URL)
                .del(ENDPOINT_URL)
                .then(function (res: Response) {
                    Log.p(`sent`, "R");
                    expect.fail();
                })
                .catch(function (err) {
                    Log.p(`${err}`);
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.p(`init fail`, "R");
        }
    });

    // todo: insight error
    it("DEL test for courses dataset, insightError", function () {
        const ENDPOINT_URL = "/dataset/";
        try {
            return chai.request(SERVER_URL)
                .del(ENDPOINT_URL)
                .then(function (res: Response) {
                    Log.p(`sent`, "R");
                    expect.fail();
                })
                .catch(function (err) {
                    Log.p(`${err}`);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.p(`init fail`, "R");
        }
    });

    // it("POST test for courses dataset", function () {
    //     const ENDPOINT_URL_PUT = "/dataset/courses/courses";
    //     const ENDPOINT_URL_POST = "/query";
    //     const ZIP_FILE_DATA = Buffer.from(fs.readFileSync(datasetsToLoad["coursesOne"]).toString("base64"));
    //     return chai.request(SERVER_URL)
    //         .put(ENDPOINT_URL_PUT)
    //         .send(ZIP_FILE_DATA)
    //         .set("Content-Type", "application/x-zip-compressed")
    //         .then(function (res: Response) {
    //             expect(res.status).to.equal(200);
    //             let simple = {
    //                 WHERE: {
    //                     GT: { courses_avg: 70 }
    //                 },
    //                 OPTIONS: {
    //                     COLUMNS: ["courses_title", "overallAvg"]
    //                 },
    //                 TRANSFORMATIONS: {
    //                     GROUP: ["courses_title"],
    //                     APPLY: [{
    //                         overallAvg: {
    //                             AVG: "courses_avg"
    //                         }
    //                     }]
    //                 }
    //             };
    //             return chai.request(SERVER_URL)
    //                 .post(ENDPOINT_URL_POST)
    //                 .send(simple)
    //                 .then(function (res2: Response) {
    //                     expect(res2.status).to.equal(200);
    //                 })
    //                 .catch(function (err) {
    //                     expect.fail();
    //                 });
    //         })
    //         .catch(function (err) {
    //             expect.fail();
    //         });
    // });

    it("POST test for courses dataset", function () {
        const ENDPOINT_URL_POST = "/query";
        let simple = {
            WHERE: {
                GT: { courses_avg: 70 }
            },
            OPTIONS: {
                COLUMNS: ["courses_title", "overallAvg"]
            },
            TRANSFORMATIONS: {
                GROUP: ["courses_title"],
                APPLY: [{
                    overallAvg: {
                        AVG: "courses_avg"
                    }
                }]
            }
        };
        return chai.request(SERVER_URL)
            .post(ENDPOINT_URL_POST)
            .send(simple)
            .then(function (res2: Response) {
                expect(res2.status).to.equal(200);
                Log.p(res2.body);
            })
            .catch(function (err) {
                expect.fail();
            });
    });

    it("POST test for courses dataset - 3", function () {
        const ENDPOINT_URL_POST = "/query";
        let simple = {
            WHERE: {
                GT: { courses_avg: 70 }
            },
            OPTIONS: {
                COLUMNS: ["courses_title", "overallAvg"]
            },
            TRANSFORMATIONS: {
                GROUP: ["courses_title"],
                APPLY: [{
                    overallAvg: {
                        AVG: "courses_avg"
                    }
                }]
            }
        };
        return chai.request(SERVER_URL)
            .post(ENDPOINT_URL_POST)
            .send(simple)
            .then(function (res2: Response) {
                expect(res2.status).to.equal(200);
                Log.p(res2.body);
            })
            .catch(function (err) {
                expect.fail();
            });
    });

    it("POST test for courses dataset - 2", function () {
        const ENDPOINT_URL_POST = "/query";
        let simple = {
            WHERE: {
                HAHA: { courses_avg: 70 }
            },
            OPTIONS: {
                COLUMNS: ["courses_title", "overallAvg"]
            },
            TRANSFORMATIONS: {
                GROUP: ["courses_title"],
                APPLY: [{
                    overallAvg: {
                        AVG: "courses_avg"
                    }
                }]
            }
        };
        return chai.request(SERVER_URL)
            .post(ENDPOINT_URL_POST)
            .send(simple)
            .then(function (res2: Response) {
                expect.fail();
            })
            .catch(function (err2) {
                expect(err2.status).to.equal(400);
            });
    });

    it("GET test for courses dataset", function () {
        const ENDPOINT_URL = "/datasets";
        try {
            return chai.request(SERVER_URL)
                .get(ENDPOINT_URL)
                .then(function (res: Response) {
                    Log.p(`sent`);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.p(`${err}`, "R");
                    expect.fail();
                });
        } catch (err) {
            Log.p(`init fail`, "R");
        }
    });

    it("ECHO test for courses dataset", function () {
        const ENDPOINT_URL = "/echo/hello";
        try {
            return chai.request(SERVER_URL)
                .get(ENDPOINT_URL)
                .then(function (res: Response) {
                    Log.p(`sent ${JSON.stringify(res)}`);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.p(`${err}`, "R");
                    expect.fail();
                });
        } catch (err) {
            Log.p(`init fail`, "R");
        }
    });

    it("ECHO test for courses dataset, failed", function () {
        const ENDPOINT_URL = "/echo/undefined";
        try {
            return chai.request(SERVER_URL)
                .get(ENDPOINT_URL)
                .then(function (res: Response) {
                    Log.p(`sent ${JSON.stringify(res)}`);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.p(`${err}`, "R");
                    expect.fail();
                });
        } catch (err) {
            Log.p(`init fail`, "R");
        }
    });

    it("get test for courses dataset, end", function () {
        const ENDPOINT_URL = "/lol";
        try {
            return chai.request(SERVER_URL)
                .get(ENDPOINT_URL)
                .then(function (res: Response) {
                    //
                })
                .catch(function (err) {
                    Log.p(`${err}`, "R");
                    expect.fail();
                });
        } catch (err) {
            Log.p(`init fail`, "R");
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
