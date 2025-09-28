import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { resetCandidates } from "../store/candidateSlice";

export default function Interviewer() {
  const dispatch = useDispatch();
  const candidates = useSelector((state) => state.candidate.candidates || []);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let filtered = candidates;

    if (searchText.trim() !== "") {
      filtered = filtered.filter((c) =>
        c.profile.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (sortBy === "name") {
      filtered = filtered.slice().sort((a, b) =>
        a.profile.name.localeCompare(b.profile.name)
      );
    } else if (sortBy === "score") {
      filtered = filtered.slice().sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    }

    return filtered;
  }, [candidates, searchText, sortBy]);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  const clearAllCandidates = () => {
    if (window.confirm("Are you sure you want to delete ALL candidates? This action cannot be undone.")) {
      dispatch(resetCandidates());
      alert("All candidates data has been deleted.");
      setSelectedCandidateId(null);
      setSearchText("");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "600px", gap: 20 }}>
      <div style={{ flex: "0 0 350px", border: "1px solid #ccc", borderRadius: 8, padding: 10, overflowY: "auto" }}>
        <div style={{ marginBottom: 15 }}>
          <button
            onClick={clearAllCandidates}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 4,
              cursor: "pointer",
              width: "100%",
            }}
          >
            Clear All Candidates
          </button>
        </div>

        <h3>Candidates</h3>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by name..."
          style={{ width: "100%", padding: 6, marginBottom: 10, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <div style={{ marginBottom: 10 }}>
          <label>
            Sort by:{" "}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name (A-Z)</option>
              <option value="score">Final Score (High to Low)</option>
            </select>
          </label>
        </div>

        {filteredCandidates.length === 0 ? (
          <p>No candidates found.</p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
            {filteredCandidates.map((candidate) => (
              <li
                key={candidate.id}
                onClick={() => setSelectedCandidateId(candidate.id)}
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  backgroundColor: candidate.id === selectedCandidateId ? "#007bff22" : "transparent",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{candidate.profile.name}</div>
                <div>Score: {candidate.finalScore ?? "N/A"}</div>
                
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: 8, padding: 10, overflowY: "auto" }}>
        {!selectedCandidate ? (
          <p>Select a candidate to view details.</p>
        ) : (
          <>
            <h3>{selectedCandidate.profile.name}'s Interview Details</h3>

            <div style={{ marginBottom: 15 }}>
              <strong>Email:</strong> {selectedCandidate.profile.email || "N/A"}
              <br />
              <strong>Phone:</strong> {selectedCandidate.profile.phone || "N/A"}
              <br />
              <strong>Status:</strong> {selectedCandidate.status}
              <br />
              <strong>Final Score:</strong> {selectedCandidate.finalScore ?? "N/A"}
            </div>

            <h4>Questions & Answers</h4>
            {selectedCandidate.answers && Object.keys(selectedCandidate.answers).length > 0 ? (
              <ol>
                {Object.entries(selectedCandidate.answers).map(([qId, ans]) => (
                  <li key={qId} style={{ marginBottom: 10 }}>
                    <strong>Q:</strong> {selectedCandidate.questions?.find((q) => `${q.id}` === qId)?.text || "Unknown Question"}
                    <br />
                    <strong>A:</strong> {ans.answer}
                    <br />
                    <strong>Score:</strong> {ans.score ?? "N/A"}
                  </li>
                ))}
              </ol>
            ) : (
              <p>No answers submitted yet.</p>
            )}

            
          </>
        )}
      </div>
    </div>
  );
}
