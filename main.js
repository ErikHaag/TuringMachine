let tape = ["_"];
let head = 0;
let state = "start";
let program = new Map();
let assembled = false;

const tapeUI = document.getElementById("tape");
const startState = document.getElementById("initState");
const startTape = document.getElementById("initTape");
const codeArea = document.getElementById("program");

const resetButton = document.getElementById("reset");
const stepButton = document.getElementById("step");
const stateDisp = document.getElementById("stateDisp");

resetButton.addEventListener("click", reset);
stepButton.addEventListener("click", step);

function reset() {
    assembled = false;
    let ste = startState.value;
    let tpe = insertTape();
    let prgm = compileProgram();
    let validState = (ste.length > 0);
    let validTpe = tpe instanceof Array;
    let validPrgm = prgm instanceof Map;
    startState.className = validState ? "" : "error";
    startTape.className = validTpe ? "" : "error";
    codeArea.className = validPrgm ? "" : "error";
    if (validPrgm) {
        program = prgm;
        if (validTpe && validState) {
            head = tpe[0];
            tape = tpe.slice(1);
            state = ste;
            assembled = true;
            drawTape();
        }
    } else {
        let p = codeArea.value.split("\n");
        for (let i = prgm.length - 1; i >= 0; i--) {
            p.splice(prgm[i], 0, ";↓↓↓");
        }
        codeArea.value = p.join("\n");

    }
}

function step() {
    if (!assembled) {
        return 0;
    }
    action = [];
    let headVal = tape[head];
    if (program.has(state)) {
        if (program.get(state).has(headVal)) {
            action = program.get(state).get(headVal);
        } else if (program.get(state).has("???")) {
            action = program.get(state).get("???");
        }
    }
    if (action.length <= 2) {
        return 1;
    }
    if (action[0] !== "???") {
        tape.splice(head, 1, action[0]);
    }
    switch (action[1]) {
        case "l":
            head--;
            break;
        //h doesn't need to be considered
        case "r":
            head++;
            break;
        case "il":
            tape.splice(head + 1, 0, headVal);
            head++;
            break;
        case "ir":
            tape.splice(head, 0, headVal);
            break;
        case "dl":
            tape.splice(head, 1);
            head--;
            break;
        case "dr":
            tape.splice(head, 1);
            break;
        default:
            break;
    }
    if (head == tape.length) {
        tape.push("_");
    } else if (head == -1) {
        tape.unshift("_");
        head++;
    }
    state = action[2];
    drawTape();
    if (state.startsWith("halt")) {
        assembled = false;
        return -1
    }
}

function drawTape() {
    tapeUI.innerText = tape.slice(0, head).join(" ") + "»" + tape[head] + "«" + tape.slice(head + 1).join(" ");
    stateDisp.innerHTML = "State: "+ state;
}

function compileProgram() {
    let prgm = new Map();
    let errors = [];
    let commands = false;
    //split into commands
    let P = codeArea.value.split("\n");
    P = P.filter((cmd) => !(cmd === ";↓↓↓"));
    P = P.map((cmd) => cmd.trim());
    P = P.filter((cmd) => !(cmd === ""));
    codeArea.value = P.join("\n");
    for (let i = 0; i < P.length; i++) {
        let cmd = P[i];
        //ignore comments
        if (cmd.startsWith(";")) continue;
        cmd = cmd.split(" ");
        //report incomplete or bad commands
        if (cmd.length < 5) {
            errors.push(i);
            continue;
        }
        cmd = cmd.splice(0, 5);
        if (cmd.includes("")) {
            errors.push(i);
            continue;
        }
        if (cmd[2] === "???" ? !["l", "h", "r", "dl", "dr"].includes(cmd[3]) : !["l", "h", "r", "il", "ir"].includes(cmd[3])) {
            errors.push(i);
            continue;
        }
        if (cmd[2].startsWith("][")) {
            errors.push(i);
            continue;
        }
        //add command to program
        let state = prgm.has(cmd[0]) ? prgm.get(cmd[0]) : new Map();
        state.set(cmd[1], cmd.slice(2, 5));
        prgm.set(cmd[0], state);
        commands = true
    }
    if (!commands) {
        return [0];
    }
    return errors.length == 0 ? prgm : errors;
}

function insertTape() {
    let T = startTape.value.trim().split(" ");
    let h = -1;
    for (let i = 0; i < T.length; i++) {
        if (T[i].startsWith("][")) {
            if (h == -1) {
                h = i;
            } else {
                return 0;
            }
            T[i] = T[i].substring(2);
        }
        if (T[i] === "") {
            return 0;
        }
    }
    if (h == -1) {
        return 0;
    }
    T.unshift(h);
    return T
}
//saving and loading
const saveButton = document.getElementById("save");
const loadButton = document.getElementById("load");
const fileInput = document.getElementById("file");
let loadPromise = null;

saveButton.addEventListener("click", save);
loadButton.addEventListener("click", () => {loadPromise = fileInput.files[0].text(); loadPromise.then(load)});

function save() {
    let P = codeArea.value.split("\n");
    P = P.filter((cmd) => !(cmd === ";↓↓↓"));
    P = P.map((cmd) => cmd.trim());
    P = P.filter((cmd) => !(cmd === ""));
    let T = startTape.value.trim();
    let S = startState.value.trim();
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        program: P,
        tape: T,
        state: S
    }));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
     dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "turing.json");
    dlAnchorElem.click();
}

function load(fileText) {
    data = JSON.parse(fileText);
    codeArea.value = data.program.join('\n');
    startTape.value = data.tape;
    startState.value = data.state;x
}