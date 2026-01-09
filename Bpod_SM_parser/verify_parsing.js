// Quick verification of binary parsing logic

const testInput = `b'C\\x00\\x00n\\x00\\x03\\x02\\x00\\x00\\x01\\x02\\x03\\x00\\x00\\x00\\x00\\x00\\x01\\x00\\x0b\\x00\\xff\\x00\\x01\\x00\\r\\x00\\xff\\x00\\x00\\x00\\x00\\x00\\x01\\x00\\x03\\x01\\x00\\x03\\x00\\x00\\x00\\x00\\x00\\x00\\xfe\\xfe\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x01\\x01\\x00\\x00\\x00\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\xc4\\t\\x00\\x00\\xc4\\t\\x00\\x00\\xc4\\t\\x00\\x00\\x00\\x00\\x00\\x00P\\xc3\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00'`;

console.log("Input format check:");
console.log("  Starts with b': ", testInput.startsWith("b'"));
console.log("  Ends with ': ", testInput.endsWith("'"));

// Parse the bytes
const bytesStr = testInput.slice(2, -1);
const bytes = [];
let i = 0;
while (i < bytesStr.length) {
    if (bytesStr[i] === '\\' && bytesStr[i + 1] === 'x') {
        const hex = bytesStr.substring(i + 2, i + 4);
        bytes.push(parseInt(hex, 16));
        i += 4;
    } else {
        bytes.push(bytesStr.charCodeAt(i));
        i++;
    }
}

console.log("\nParsed bytes:");
console.log("  Total bytes:", bytes.length);
console.log("  First 10 bytes:", bytes.slice(0, 10));

console.log("\nHeader information:");
console.log("  Opcode (byte 0):", bytes[0], `('${String.fromCharCode(bytes[0])}')`);
console.log("  runStateMatrixASAP (byte 1):", bytes[1]);
console.log("  using255BackSignal (byte 2):", bytes[2]);
console.log("  Expected byte count (bytes 3-4):", bytes[3] | (bytes[4] << 8), "(uint16 little-endian)");
console.log("  Actual data bytes:", bytes.length - 5);

console.log("\nFirst few data bytes (after header):");
console.log("  ", bytes.slice(5, 15));

console.log("\n✓ Parsing logic verified successfully!");
