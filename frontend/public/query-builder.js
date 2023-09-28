/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

function iterateChecks(arr, property, fn){
    for (let ele of arr.children) {
        ele = ele.children[0];
        if (ele[property]) {
            fn(ele);
        }
    }
}

function getSelVal(sel) {
    return sel[sel.selectedIndex].value;
}

function getTrans(trans) {
    let row = {};
    row.name = trans.children[0].children[0].value;
    row.rule = getSelVal(trans.children[1].children[0]);
    row.field = getSelVal(trans.children[2].children[0]);
    return row;
}

function getCond(cond) {
    let row = {};
    row.not = cond.children[0].children[0].checked;
    row.field = getSelVal(cond.children[1].children[0]);
    row.comp = getSelVal(cond.children[2].children[0]);
    row.input = cond.children[3].children[0].value;
    return row;
}

function getList(container, fn) {
    let ret = [];
    for (let row of container.children) {
        ret.push(fn(row));
    }
    return ret;
}

const nums = [
    "lat", "lon", "seats",
    "avg", "pass", "fail", "audit", "year"
];

function handleNums(f, x) {
    for (let n of nums) {
        if (n === f) {
            return x.indexOf(".") > 0 ? parseFloat(x) : parseInt(x, 10);
        }
    }
    return x;
}

function getSelections(container) {
    let ret = {cond: {}, cols: [], ord: [], grp: []};

    let cond = container[0].children[1];
    let logs = {all: "AND", any: "OR", none: "NOT"};
    iterateChecks(cond,  "checked", (ele) => {
        ret.cond.log = logs[ele.value];
    });
    ret.cond.filters = getList(container[0].children[2], getCond);

    let cols = container[1].children[1];
    iterateChecks(cols,  "checked",(ele) => {
        ret.cols.push(ele.value);
    });

    let order = container[2].children[1].children[0];
    for (let ele of order.children[0].children) {
        if (ele.selected) {
            ret.ord.push(ele.value)
        }
    }
    ret.desc = container[2].children[1].children[1].children[0].checked;

    let grp = container[3].children[1];
    iterateChecks(grp,  "checked",(ele) => {
        ret.grp.push(ele.value);
    });

    ret.trans = getList(container[4].children[1], getTrans);
    return ret;
}

function parseCond(cond, id) {
    let ret = {};
    let w;
    if (cond.not) {
        ret.NOT = {};
        w = ret.NOT;
    } else {
        w = ret;
    }
    w[cond.comp] = {};
    w[cond.comp][`${id}_${cond.field}`] = handleNums(cond.field, cond.input);
    return ret;
}

function parseWhere(sel, id) {
    let ret;
    switch (sel.cond.filters.length) {
        case 0:
            ret = {};
            break;
        case 1:
            ret = parseCond(sel.cond.filters[0], id);
            break;
        default:
            ret = {};
            let w = [];
            if (sel.cond.log === "NOT") {
                ret[sel.cond.log] = {};
                ret[sel.cond.log]["OR"] = w;
            } else {
                ret[sel.cond.log] = w;
            }
            for (let c of sel.cond.filters) {
                w.push(parseCond(c, id));
            }
    }
    return ret;
}

function parseOpt(sel, id) {
    let o = {};
    o.COLUMNS = [];
    for (let c of sel.cols) {
        let addID = sel.grp.length === 0;
        for (let g of sel.grp) {
            if (c === g) {
                addID = true;
            }
        }

        if(addID) {
            o.COLUMNS.push(`${id}_${c}`);
        } else {
            o.COLUMNS.push(`${c}`);
        }
    }

    if (sel.ord.length > 1) {
        let d = sel.desc ? "DOWN" : "UP";
        o.ORDER = {dir: d, keys: []};
        for (let k of sel.ord) {
            let addID = sel.grp.length === 0;
            for (let g of sel.grp) {
                if (k === g) {
                    addID = true;
                }
            }

            if(addID) {
                o.ORDER.keys.push(`${id}_${k}`);
            } else {
                o.ORDER.keys.push(`${k}`);
            }
        }
    } else if (sel.ord.length === 1) {
        o.ORDER = `${id}_${sel.ord[0]}`;
    }

    return o;
}

function parseTrans(sel, id) {
    let t = {};
    t.GROUP = [];
    for (let g of sel.grp) {
        t.GROUP.push(`${id}_${g}`);
    }

    t.APPLY = [];
    for (let a of sel.trans) {
        let apply = {};
        apply[a.name] = {};
        apply[a.name][a.rule] = `${id}_${a.field}`;
        t.APPLY.push(apply);
    }

    return t.GROUP.length === 0 && t.APPLY.length === 0? false : t;
}

function parseSel(sel, id) {
    let q = {};
    q.WHERE = parseWhere(sel, id);
    q.OPTIONS = parseOpt(sel, id);
    let t = parseTrans(sel, id);
    if (t) {
        q.TRANSFORMATIONS = t;
    }
    return q;
}

CampusExplorer.buildQuery = function () {
    /** mock not reflective? can't find active tab???
     **/
    let setID;
    let container;
    let forms = document.getElementById("form-container").children;
    for (let f of forms) {
        let t = f.nextElementSibling;
        let active = t.classList["value"].indexOf("active") > -1;
        if (active) {
            setID = t.id.substring(4);
            container = t;
            break;
        }
    }
    let sel = getSelections(container.children[0].children);
    return parseSel(sel, setID);
};
