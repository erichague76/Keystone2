//-------------------------------------------------------------
// Keystone / SpellFinder – Browser Version
//-------------------------------------------------------------

// Word list file (must be in your repo)
const WORDLIST_FILE = "SpellFinder.txt";

// Plate image file (must be uploaded to your repo)
const PLATE_IMAGE_FILE = "Plate.png";

// Global state
let WORDS = [];
let CURRENT_LETTERS = "";
let SUBMITTED = [];
let POSSIBLE = [];

//-------------------------------------------------------------
// Utility functions
//-------------------------------------------------------------
function normalize(word) {
    return word.toLowerCase().replace(/[^a-z]/g, "");
}

function orderedMatch(word, letters) {
    let pos = 0;
    for (let ch of letters) {
        pos = word.indexOf(ch, pos);
        if (pos === -1) return false;
        pos++;
    }
    return true;
}

async function loadWords() {
    try {
        const resp = await fetch(WORDLIST_FILE);
        const text = await resp.text();
        const lines = text.split(/\r?\n/);

        const cleaned = [...new Set(
            lines.map(w => normalize(w)).filter(w => w)
        )];

        WORDS = cleaned.sort();
        updateStatus();
    } catch (err) {
        console.error("Could not load word list:", err);
    }
}

function generateRandomLetters() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return Array.from({ length: 3 }, () =>
        letters[Math.floor(Math.random() * 26)]
    ).join("");
}

//-------------------------------------------------------------
// Plate Rendering
//-------------------------------------------------------------
async function renderPlate(letters) {
    const canvas = document.getElementById("plateCanvas");
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.src = PLATE_IMAGE_FILE;
    await img.decode();

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    // Left-side text area (auto-calc)
    const x1 = img.width * 0.10;
    const y1 = img.height * 0.18;
    const x2 = img.width * 0.46;
    const y2 = img.height * 0.82;

    const boxW = x2 - x1;
    const boxH = y2 - y1;

    const fontSize = Math.min(225, Math.max(70, img.height * 0.48));
    ctx.font = `${fontSize}px Arial Black`;
    ctx.fillStyle = "rgb(20,55,125)";

    const chars = letters.split("");
    const widths = chars.map(ch => ctx.measureText(ch).width);
    const spacing = -4;

    const totalWidth =
        widths.reduce((a, b) => a + b, 0) +
        spacing * (chars.length - 1);

    const startX = x1 + (boxW - totalWidth) / 2 - 25;
    const startY = y1 + (boxH + fontSize) / 2 - 30;

    let cx = startX;
    chars.forEach((ch, i) => {
        ctx.fillText(ch, cx, startY);
        cx += widths[i] + spacing;
    });

    document.getElementById("currentLetters").textContent = letters;
}

//-------------------------------------------------------------
// Word Logic
//-------------------------------------------------------------
function getPossibleWords(letters) {
    letters = normalize(letters);
    if (letters.length !== 3) return [];
    return WORDS.filter(w => orderedMatch(w, letters));
}

function loadPlateLetters(letters) {
    CURRENT_LETTERS = letters.toUpperCase();
    renderPlate(CURRENT_LETTERS);
    POSSIBLE = getPossibleWords(CURRENT_LETTERS);
    updateStatus();
}

//-------------------------------------------------------------
// UI Actions
//-------------------------------------------------------------
function submitWord() {
    const input = document.getElementById("wordInput");
    const w = normalize(input.value);
    input.value = "";

    if (!w) return;

    if (!WORDS.includes(w)) {
        alert("Not in dictionary.");
        return;
    }

    if (!orderedMatch(w, CURRENT_LETTERS.toLowerCase())) {
        alert("Word does not match plate order.");
        return;
    }

    if (!SUBMITTED.includes(w)) {
        SUBMITTED.push(w);
        updateSubmittedList();
    }

    updateStatus();
}

function updateSubmittedList() {
    const ul = document.getElementById("submittedList");
    ul.innerHTML = "";
    SUBMITTED.sort().forEach(w => {
        const li = document.createElement("li");
        li.textContent = w;
        ul.appendChild(li);
    });
}

function showAnswers() {
    const div = document.getElementById("results");
    div.textContent = POSSIBLE.join("\n");
}

function lookupPlate() {
    const inp = document.getElementById("lookupInput");
    const letters = inp.value.toUpperCase().replace(/[^A-Z]/g, "");
    if (letters.length !== 3) {
        alert("Enter exactly 3 letters.");
        return;
    }
    loadPlateLetters(letters);
}

function updateStatus() {
    const div = document.getElementById("status");
    div.textContent =
        `Words loaded: ${WORDS.length} | ` +
        `Plate: ${CURRENT_LETTERS} | ` +
        `Possible: ${POSSIBLE.length} | ` +
        `Submitted: ${SUBMITTED.length}`;
}

//-------------------------------------------------------------
// Startup
//-------------------------------------------------------------
window.onload = () => {
    loadWords();
    loadPlateLetters(generateRandomLetters());
};
