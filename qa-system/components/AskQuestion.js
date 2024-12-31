"use client";
import { useState } from "react";
import axios from "axios";

export default function AskQuestion() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    try {
      // Add the user's question to the chat history
      setChatHistory((prev) => [...prev, { type: "user", text: question }]);

      // Send the question to the backend
      const response = await axios.post("http://127.0.0.1:8000/ask", { question });
      if (response.data) {
        // Add the bot's answer to the chat history
        setChatHistory((prev) => [
          ...prev,
          {
            type: "bot",
            text: response.data.answer,
            citations: response.data.citations,
          },
        ]);
      }
      setError("");
    } catch (error) {
      console.error(error);
      setError("Failed to fetch answers. Please try again.");
      setChatHistory((prev) => [
        ...prev,
        { type: "bot", text: "An error occurred. Please try again later." },
      ]);
    } finally {
      setLoading(false);
      setQuestion(""); // Clear the input field
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
      <div
        style={{
          height: "400px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: "1rem",
          marginBottom: "1rem",
          backgroundColor: "#f9f9f9",
        }}
      >
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: chat.type === "user" ? "flex-end" : "flex-start",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                backgroundColor: chat.type === "user" ? "#007bff" : "#e9ecef",
                color: chat.type === "user" ? "white" : "black",
                maxWidth: "70%",
              }}
            >
              <p>{chat.text}</p>
              {chat.type === "bot" && chat.citations && (
                <div style={{ fontSize: "0.8rem", marginTop: "0.5rem", color: "#666" }}>
                  <strong>Sources:</strong>
                  <ul>
                    {chat.citations.map((citation, i) => (
                      <li key={i}>
                        <strong>Page:</strong> {citation.page}, <strong>File:</strong> {citation.file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskQuestion();
        }}
        style={{ display: "flex", gap: "1rem" }}
      >
        <input
          type="text"
          placeholder="Ask a question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            padding: "0.5rem",
            flex: 1,
            borderRadius: "4px",
            border: "1px solid #ddd",
            backgroundColor: "white",
            color: "black",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading ? "Loading..." : "Ask"}
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </div>
  );
}