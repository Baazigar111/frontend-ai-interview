import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateCandidateStatus } from "../store/candidateSlice"; // Assuming this action exists

// We need a unique ID for the candidate being resumed/started
const RESUMABLE_STATUSES = ["in-progress", "waitingInfo"];

export default function Welcome() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const candidates = useSelector((state) => state.candidate.candidates);

    const [resumableCandidate, setResumableCandidate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Find the most recent candidate that is not completed
        const inProgressCandidate = candidates.find((c) =>
            RESUMABLE_STATUSES.includes(c.status)
        );

        if (inProgressCandidate) {
            setResumableCandidate(inProgressCandidate);
        }
        setIsLoading(false);
    }, [candidates]);

    const handleResume = () => {
        if (resumableCandidate) {
            // Navigate to the Interviewee page. The Interviewee component itself
            // will then load the persisted data based on its initial useEffect logic.
            navigate("/interviewee");
        }
    };

    const handleStartNew = () => {
        // OPTIONAL: You might want to explicitly mark the old session as abandoned/completed-failed
        // dispatch(updateCandidateStatus({ id: resumableCandidate.id, status: "abandoned" }));
        
        // Clear the resumable state and navigate to allow a fresh start
        setResumableCandidate(null); 
        navigate("/interviewee");
    };

    if (isLoading) {
        return <div style={styles.loading}>Checking for previous sessions...</div>;
    }

    // --- RENDER WELCOME BACK MODAL ---
    if (resumableCandidate) {
        const statusText = resumableCandidate.status === "waitingInfo" 
            ? "unfinished profile setup" 
            : "in-progress interview";

        return (
            <div style={styles.modalOverlay}>
                <div style={styles.modalContent}>
                    <h3 style={styles.modalTitle}>Welcome Back, {resumableCandidate.profile.name || "Candidate"}!</h3>
                    <p style={styles.modalText}>
                        It looks like you have an **{statusText}**.
                        Would you like to resume your session or start a new one?
                    </p>
                    <div style={styles.buttonGroup}>
                        <button onClick={handleResume} style={{ ...styles.button, ...styles.resumeButton }}>
                            Resume Session
                        </button>
                        <button onClick={handleStartNew} style={{ ...styles.button, ...styles.newButton }}>
                            Start New
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER DEFAULT WELCOME SCREEN ---
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Crisp: AI Interview Assistant 🤖</h1>
            <p style={styles.subtitle}>Your path to the Full Stack (React/Node) role starts here.</p>
            
            <div style={styles.steps}>
                <p>1. Upload your **Resume** (PDF/DOCX).</p>
                <p>2. Complete any missing profile fields.</p>
                <p>3. Answer **6 timed AI questions** (2 Easy, 2 Medium, 2 Hard).</p>
                <p>4. Get an instant **Final Score & Summary**.</p>
            </div>

            <button onClick={handleStartNew} style={{ ...styles.button, ...styles.startButton }}>
                Start New Interview
            </button>
            <p style={styles.persistenceNote}>
                * Your progress is automatically saved.
            </p>
        </div>
    );
}

const styles = {
    // Basic shared styles (replace with your chosen UI library for production)
    container: { maxWidth: 600, margin: "100px auto", padding: 20, textAlign: "center", border: "1px solid #eee", borderRadius: 10, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" },
    title: { color: "#2c3e50", marginBottom: 10 },
    subtitle: { color: "#34495e", marginBottom: 30 },
    steps: { textAlign: "left", margin: "30px 0", padding: "0 50px" },
    button: { padding: "12px 25px", borderRadius: 5, fontSize: "16px", cursor: "pointer", transition: "background-color 0.3s" },
    startButton: { backgroundColor: "#3498db", color: "white", border: "none" },
    persistenceNote: { marginTop: 20, fontSize: "0.8em", color: "#7f8c8d" },

    // Modal styles
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
    modalContent: { backgroundColor: "white", padding: 30, borderRadius: 8, maxWidth: 400, textAlign: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.2)" },
    modalTitle: { color: "#e67e22" },
    modalText: { marginBottom: 20 },
    buttonGroup: { display: "flex", justifyContent: "space-between" },
    resumeButton: { backgroundColor: "#2ecc71", color: "white", border: "none", flexGrow: 1, marginRight: 10 },
    newButton: { backgroundColor: "#e74c3c", color: "white", border: "none", flexGrow: 1 },
    loading: { textAlign: "center", marginTop: 100, fontSize: "1.2em", color: "#95a5a6" }
};