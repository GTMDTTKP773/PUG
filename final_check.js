const fs = require('fs');
const content = fs.readFileSync('d:/PUG/pursuit-of-glory/modules/systems/events.js', 'utf8');
let stack = [];
let lines = content.split('\n');
let inComment = false;
let inMultiComment = false;
let inString = false;
let stringChar = '';
let inTemplateExpr = 0;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let j = 0; j < line.length; j++) {
        let char = line[j];
        let next = line[j + 1];

        if (inMultiComment) {
            if (char === '*' && next === '/') { inMultiComment = false; j++; }
            continue;
        }
        if (inComment) break;
        
        if (inString) {
            if (char === '\\') { j++; continue; }
            if (stringChar === '`' && char === '$' && next === '{') {
                inTemplateExpr++;
                stack.push({ char: '${', line: i + 1, col: j + 1 });
                j++;
                inString = false;
                continue;
            }
            if (char === stringChar) { inString = false; }
            continue;
        }

        if (char === '/' && next === '*') { inMultiComment = true; j++; continue; }
        if (char === '/' && next === '/') { inComment = true; break; }
        if (char === "'" || char === '"' || char === '`') {
            inString = true;
            stringChar = char;
            continue;
        }

        if (char === '{') {
            stack.push({ char, line: i + 1, col: j + 1 });
        } else if (char === '}') {
            if (stack.length === 0) {
                console.log('Extra closing } at line ' + (i + 1) + ', col ' + (j + 1));
            } else {
                stack.pop();
            }
        }
    }
    inComment = false;
}

if (stack.length > 0) {
    console.log('Unclosed brackets:');
    stack.forEach(s => console.log(s.char + ' at line ' + s.line + ', col ' + s.col));
} else {
    console.log('All brackets closed correctly.');
}
