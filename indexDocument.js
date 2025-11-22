import { indexTheDocument } from "./prepare.js";

const filePath = "./Internship ENgagement Letter.pdf";

await indexTheDocument(filePath);

console.log("PDF indexed successfully!");
