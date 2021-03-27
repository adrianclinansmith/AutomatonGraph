/*
    Finite Automata Simulator
    Adrian Clinansmith
    November 2020

    ( Q, Σ, δ, q0, F )
    Q: States
    Σ: Alphabet
    δ: Q × Σ → Q
    q0: Start State
    F: Accept States (F ⊆ Q)

    FA Definition: Introduction to the Theory of Computation 3rd edition, by Michael Sipser
    page 35
*/

const fs = require('fs');

const lines = fs.readFileSync('transitionsFile.txt', 'utf-8').split('\n');

// Read transitions and accept states from file

const transitionFunction = {};
const acceptStates = [];
let currentState = null;

console.log(lines);

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineno = i + 1;
    if (line.startsWith('//') || line.length === 0) { // skip comment or blank line
        continue;
    }
    const tokens = line.split(/\s+/);
    if (tokens[0] === 'accept:') { // store accept states
        acceptStates.push(...tokens.slice(1));
    } else if (tokens.length === 4 && tokens[2] === '->') { // store transition
        const state = tokens[0];
        const symbol = tokens[1];
        const newState = tokens[3];
        transitionFunction[`${state} ${symbol}`] = newState;
        if (currentState == null) {
            currentState = state;
        }
    } else {
        console.log(`ERROR: Syntax error on line ${lineno}`);
        process.exit(0);
    }
}

console.log(acceptStates);
console.log(transitionFunction);

if (acceptStates.length === 0) {
    console.log('ERROR: Must specify one or more accept states ');
    process.exit(0);
}

// run machine with the given input

const input = 'bbafabb';

for (const c of input) {
    const nextState = transitionFunction[`${currentState} ${c}`];
    console.log(`${currentState} ${c} -> ${nextState}`);
    currentState = nextState;
    if (nextState == null) {
        break;
    }
}
if (acceptStates.includes(currentState)) {
    console.log('accept');
} else {
    console.log('reject');
}
