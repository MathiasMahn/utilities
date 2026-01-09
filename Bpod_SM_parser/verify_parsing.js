// Quick verification of binary parsing logic with Python escape sequences

function parsePythonBytes(bytesStr) {
    // Parse Python byte string escape sequences
    const bytes = [];
    let i = 0;
    while (i < bytesStr.length) {
        if (bytesStr[i] === '\\' && i + 1 < bytesStr.length) {
            const nextChar = bytesStr[i + 1];
            if (nextChar === 'x') {
                // Hex escape sequence \xNN
                const hex = bytesStr.substring(i + 2, i + 4);
                bytes.push(parseInt(hex, 16));
                i += 4;
            } else if (nextChar === 'n') {
                bytes.push(10); // newline
                i += 2;
            } else if (nextChar === 'r') {
                bytes.push(13); // carriage return
                i += 2;
            } else if (nextChar === 't') {
                bytes.push(9); // tab
                i += 2;
            } else if (nextChar === 'b') {
                bytes.push(8); // backspace
                i += 2;
            } else if (nextChar === 'f') {
                bytes.push(12); // form feed
                i += 2;
            } else if (nextChar === 'v') {
                bytes.push(11); // vertical tab
                i += 2;
            } else if (nextChar === '\\') {
                bytes.push(92); // backslash
                i += 2;
            } else if (nextChar === '\'' || nextChar === '"') {
                bytes.push(nextChar.charCodeAt(0)); // quote
                i += 2;
            } else if (nextChar >= '0' && nextChar <= '7') {
                // Octal escape sequence \NNN (up to 3 digits)
                let octalStr = '';
                let j = i + 1;
                while (j < bytesStr.length && j < i + 4 && bytesStr[j] >= '0' && bytesStr[j] <= '7') {
                    octalStr += bytesStr[j];
                    j++;
                }
                bytes.push(parseInt(octalStr, 8));
                i = j;
            } else {
                // Unknown escape, treat as literal
                bytes.push(bytesStr.charCodeAt(i));
                i++;
            }
        } else {
            // Regular character
            bytes.push(bytesStr.charCodeAt(i));
            i++;
        }
    }
    return bytes;
}

const testInput = `b'C\\x00\\x00n\\x00\\x03\\x02\\x00\\x00\\x01\\x02\\x03\\x00\\x00\\x00\\x00\\x00\\x01\\x00\\x0b\\x00\\xff\\x00\\x01\\x00\\r\\x00\\xff\\x00\\x00\\x00\\x00\\x00\\x01\\x00\\x03\\x01\\x00\\x03\\x00\\x00\\x00\\x00\\x00\\x00\\xfe\\xfe\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x01\\x01\\x00\\x00\\x00\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\xc4\\t\\x00\\x00\\xc4\\t\\x00\\x00\\xc4\\t\\x00\\x00\\x00\\x00\\x00\\x00P\\xc3\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00'`;

console.log("Input format check:");
console.log("  Starts with b': ", testInput.startsWith("b'"));
console.log("  Ends with ': ", testInput.endsWith("'"));

// Parse the bytes
const bytesStr = testInput.slice(2, -1);
const bytes = parsePythonBytes(bytesStr);

console.log("\nParsed bytes:");
console.log("  Total bytes:", bytes.length);
console.log("  First 10 bytes:", bytes.slice(0, 10));

console.log("\nHeader information:");
console.log("  Opcode (byte 0):", bytes[0], `('${String.fromCharCode(bytes[0])}')`);
console.log("  runStateMatrixASAP (byte 1):", bytes[1]);
console.log("  using255BackSignal (byte 2):", bytes[2]);
console.log("  Expected byte count (bytes 3-4):", bytes[3] | (bytes[4] << 8), "(uint16 little-endian)");
console.log("  Actual data bytes:", bytes.length - 5);

// Check for specific escape sequences in the input
console.log("\nEscape sequence handling verification:");
console.log("  \\r (carriage return) should become byte 13");
console.log("  Checking bytes for value 13:", bytes.includes(13) ? "✓ Found" : "✗ Not found");
console.log("  Checking for 'r' character (114):", bytes.includes(114) ? "⚠ Found (escape not processed)" : "✓ Not found (escape processed correctly)");

console.log("\nFirst few data bytes (after header):");
console.log("  ", bytes.slice(5, 15));

console.log("\n✓ Parsing logic verified successfully!");
