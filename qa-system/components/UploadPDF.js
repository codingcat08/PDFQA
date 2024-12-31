"use client";
import React, { useState } from "react";

const UploadPDF = () => {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setMessage("Please select at least one PDF file.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage("Failed to upload PDFs: " + error.message);
    }
  };

  return (
    <div>
      <h2>Upload PDFs</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
        />
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
      {files.length > 0 && (
        <div>
          <h3>Selected Files:</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadPDF;