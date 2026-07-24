const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'scratch');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Minimal valid 1x1 GIF / JPEG binary buffer
const sampleJpeg1 = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
const sampleJpeg2 = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');

const path1 = path.join(dir, 'sample-house-1.jpg');
const path2 = path.join(dir, 'sample-house-2.jpg');

fs.writeFileSync(path1, sampleJpeg1);
fs.writeFileSync(path2, sampleJpeg2);

console.log("Sample image 1 created:", path1, fs.statSync(path1).size, "bytes");
console.log("Sample image 2 created:", path2, fs.statSync(path2).size, "bytes");
