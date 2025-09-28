import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import mammoth from "mammoth";

export default function ResumeUpload({ onExtracted }) {
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  // Extract text from PDF using pdfjs
  async function extractPdfText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  }

  // Extract text from DOCX using mammoth
  async function extractDocxText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  // Extract fields from text: name, email, phone with simple regex
  function parseFields(text) {
    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
    const phoneRegex = /(\+?\d{1,4}[\s-])?(\(?\d{3}\)?[\s-]?)?[\d\s-]{7,}/;

    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);

    // Simplistic approach for name: assume first non-email/non-phone line with words
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    let name = "";
    for (let line of lines) {
      if (
        !emailRegex.test(line) &&
        !phoneRegex.test(line) &&
        line.length > 2 &&
        line.split(" ").length <= 4 // heuristic max words in name
      ) {
        name = line;
        break;
      }
    }

    return {
      name: name || "",
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0].trim() : "",
    };
  }

  const handleFileChange = async (e) => {
    setError("");
    setLoading(true);
    const file = e.target.files[0];
    if (!file) {
      setLoading(false);
      return;
    }
    setFileName(file.name);

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload PDF or DOCX.");
      setLoading(false);
      return;
    }

    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractPdfText(file);
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        text = await extractDocxText(file);
      }
      const extracted = parseFields(text);

      if (!extracted.name && !extracted.email && !extracted.phone) {
        setError("Failed to auto-extract resume data. Please enter manually.");
      }

      setLoading(false);
      onExtracted(extracted);
    } catch (err) {
      setLoading(false);
      setError("Failed to extract resume data. Please try another file.");
      onExtracted({ name: "", email: "", phone: "" });
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label>
        Upload Resume (PDF or DOCX):
        <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
      </label>

      {fileName && <div>File: {fileName}</div>}
      {loading && <div>Extracting data from resume...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}
