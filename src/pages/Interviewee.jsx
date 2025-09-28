import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import ResumeUpload from "../components/ResumeUpload";
import {
    addCandidate,
    addChatMessage,
    saveAnswer,
    finishInterview,
    updateCandidateProfile,
    updateCandidateStatus,
    setCandidateQuestions,
} from "../store/candidateSlice";

const REQUIRED_FIELDS = ["name", "email", "phone"];

// CRITICAL UPDATE: Define the backend URL using the environment variable
// It falls back to localhost for local development if the variable isn't set.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function Interviewee() {
    const dispatch = useDispatch();
    const candidates = useSelector((state) => state.candidate.candidates);
    const [candidateId, setCandidateId] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [missingFields, setMissingFields] = useState([]);
    const [awaitingInputFor, setAwaitingInputFor] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [timer, setTimer] = useState(0);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answerInput, setAnswerInput] = useState("");
    const timerRef = useRef(null);
    const [questions, setQuestions] = useState([]);
    const [dynamicLoading, setDynamicLoading] = useState(false);
    const [loadingAnswerScore, setLoadingAnswerScore] = useState(false);
    const [totalScore, setTotalScore] = useState(0);

    // Load candidate chat/messages and resume if candidateId changes
    useEffect(() => {
        if (!candidateId) return;
        const candidate = candidates.find((c) => c.id === candidateId);
        if (candidate) {
            setChatMessages(candidate.chats);
            if (candidate.status === "in-progress") {
                const answeredQuestionIds = Object.keys(candidate.answers).map((id) =>
                    parseInt(id, 10)
                );
                let lastAnsweredIndex = -1;
                for (let i = 0; i < candidate.questions.length; i++) {
                    if (answeredQuestionIds.includes(candidate.questions[i].id))
                        lastAnsweredIndex = i;
                    else break;
                }
                const nextQIndex = lastAnsweredIndex + 1;
                setCurrentQIndex(nextQIndex);
                setInterviewStarted(nextQIndex < candidate.questions.length);
                setTimer(nextQIndex < candidate.questions.length ? candidate.questions[nextQIndex].timer : 0);
                setTotalScore(
                    answeredQuestionIds.reduce(
                        (sum, qid) => sum + (candidate.answers[qid]?.score || 0),
                        0
                    )
                );
                setQuestions(candidate.questions);
            } else {
                setQuestions(candidate.questions || []);
            }
        }
    }, [candidateId, candidates]);

    // Resume interview timer effect
    useEffect(() => {
        if (!interviewStarted) return;
        if (timer <= 0) {
            handleAnswerSubmit(true);
            return;
        }
        timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [timer, interviewStarted]);

    // On resume upload extracted
    const onExtracted = (data) => {
        let id = candidateId || uuidv4();
        setCandidateId(id);

        const profile = {
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
        };

        if (!candidates.find((c) => c.id === id)) {
            dispatch(addCandidate({ id, profile }));
        } else {
            dispatch(updateCandidateProfile({ id, profile }));
        }

        const missing = REQUIRED_FIELDS.filter((field) => !profile[field]);
        setMissingFields(missing);

        if (missing.length > 0) {
            setAwaitingInputFor(missing[0]);
            dispatch(
                addChatMessage({
                    candidateId: id,
                    message: { from: "bot", text: `Please provide your ${missing[0]}.` },
                })
            );
            setChatMessages((prev) => [
                ...prev,
                { from: "bot", text: `Please provide your ${missing[0]}.` },
            ]);
            setInterviewStarted(false);
            dispatch(updateCandidateStatus({ id, status: "waitingInfo" }));
        } else {
            setAwaitingInputFor(null);
            dispatch(
                addChatMessage({
                    candidateId: id,
                    message: { from: "bot", text: "All information extracted. Ready to start interview!" },
                })
            );
            setChatMessages((prev) => [
                ...prev,
                { from: "bot", text: "All information extracted. Ready to start interview!" },
            ]);
            dispatch(updateCandidateStatus({ id, status: "in-progress" }));
            startDynamicInterview(id);
        }
    };

    // User input handler
    const handleUserInput = () => {
        if (awaitingInputFor) {
            if (!inputValue.trim()) return;
            const field = awaitingInputFor;
            const value = inputValue.trim();

            dispatch(updateCandidateProfile({ id: candidateId, profile: { [field]: value } }));
            dispatch(addChatMessage({ candidateId, message: { from: "user", text: value } }));
            setChatMessages((prev) => [...prev, { from: "user", text: value }]);

            const nextMissing = missingFields.filter((f) => f !== field);
            setMissingFields(nextMissing);

            if (nextMissing.length > 0) {
                setAwaitingInputFor(nextMissing[0]);
                dispatch(
                    addChatMessage({
                        candidateId,
                        message: { from: "bot", text: `Please provide your ${nextMissing[0]}.` },
                    })
                );
                setChatMessages((prev) => [
                    ...prev,
                    { from: "bot", text: `Please provide your ${nextMissing[0]}.` },
                ]);
                setInterviewStarted(false);
                dispatch(updateCandidateStatus({ id: candidateId, status: "waitingInfo" }));
            } else {
                setAwaitingInputFor(null);
                dispatch(
                    addChatMessage({
                        candidateId,
                        message: { from: "bot", text: "Thank you! All information received. Ready to start interview!" },
                    })
                );
                setChatMessages((prev) => [
                    ...prev,
                    { from: "bot", text: "Thank you! All information received. Ready to start interview!" },
                ]);
                dispatch(updateCandidateStatus({ id: candidateId, status: "in-progress" }));
                startDynamicInterview(candidateId);
            }
            setInputValue("");
        } else {
            if (!answerInput.trim()) return;
            handleAnswerSubmit(false);
        }
    };

    // Start interview questions dynamically
    const startDynamicInterview = async (id = null, role = "full stack developer") => {
        setDynamicLoading(true);
        try {
            // UPDATED FETCH URL: Using the dynamic backend URL
            const response = await fetch(`${BACKEND_URL}/api/generateQuestions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to generate questions");
            }

            const generatedQuestions = (await response.json()).questions;
            setQuestions(generatedQuestions);

            if (id) {
                dispatch(setCandidateQuestions({ candidateId: id, questions: generatedQuestions }));
            }

            setCurrentQIndex(0);
            setInterviewStarted(true);
            setTimer(generatedQuestions[0]?.timer || 0);

            if (id) setCandidateId(id);

            dispatch(
                addChatMessage({ candidateId: id, message: { from: "bot", text: generatedQuestions[0].text } })
            );
            setChatMessages((prev) => [...prev, { from: "bot", text: generatedQuestions[0].text }]);
        } catch (error) {
            alert("Failed to generate interview questions: " + error.message);
            setInterviewStarted(false);
        } finally {
            setDynamicLoading(false);
        }
    };

    // Score answer - implement as per your environment (placeholder)
    const scoreCandidateAnswer = async (question, answer) => {
        // You will replace this with a call to your backend scoring API
        // Example: const response = await fetch(`${BACKEND_URL}/api/scoreAnswer`, { ... });
        
        // For now, return random score between 60-100 for demonstration
        return Math.floor(60 + Math.random() * 40);
    };

    // Handle answer submission
    const handleAnswerSubmit = async (autoSubmit = false) => {
        if (!answerInput.trim() && !autoSubmit) return;

        const q = questions[currentQIndex];
        const ans = autoSubmit ? answerInput.trim() || "[No answer]" : answerInput.trim();

        setLoadingAnswerScore(true);
        const ansScore = await scoreCandidateAnswer(q.text, ans);
        setLoadingAnswerScore(false);

        dispatch(saveAnswer({ candidateId, questionId: q.id, answer: ans, score: ansScore ?? 0 }));
        dispatch(addChatMessage({ candidateId, message: { from: "user", text: ans } }));
        setChatMessages((prev) => [...prev, { from: "user", text: ans }]);
        setAnswerInput("");
        setTotalScore((prev) => (prev ?? 0) + (ansScore ?? 0));
        clearTimeout(timerRef.current);

        if (currentQIndex + 1 < questions.length) {
            const nextIndex = currentQIndex + 1;
            const nextQuestion = questions[nextIndex];

            const alreadyShown = chatMessages.some(
                (msg) => msg.from === "bot" && msg.text === nextQuestion.text
            );

            if (!alreadyShown) {
                dispatch(addChatMessage({ candidateId, message: { from: "bot", text: nextQuestion.text } }));
                setChatMessages((prev) => [...prev, { from: "bot", text: nextQuestion.text }]);
            }

            setCurrentQIndex(nextIndex);
            setTimer(nextQuestion.timer);
        } else {
            setInterviewStarted(false);
            dispatch(addChatMessage({ candidateId, message: { from: "bot", text: "Interview complete!" } }));
            setChatMessages((prev) => [...prev, { from: "bot", text: "Interview complete!" }]);

            const allAnswers = questions.map((_, i) => {
                const candidate = candidates.find((c) => c.id === candidateId);
                return candidate?.answers[questions[i].id]?.answer || "";
            });

            // You must replace this with an actual API call to your backend
            // Example: const summary = await fetch(`${BACKEND_URL}/api/generateSummary`, { ... });
             

            dispatch(finishInterview({ candidateId, score: totalScore,  }));
            dispatch(updateCandidateStatus({ id: candidateId, status: "completed" }));

            dispatch(addChatMessage({ candidateId, message: { from: "bot", text: `Final Score: ${totalScore}.\n` } }));
            setChatMessages((prev) => [...prev, { from: "bot", text: `Final Score: ${totalScore}.\n` }]);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
            <h2>Interviewee Chat</h2>

            {!interviewStarted && !awaitingInputFor && chatMessages.length === 0 && (
                <ResumeUpload onExtracted={onExtracted} />
            )}

            <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 300, marginBottom: 10, overflowY: "auto" }}>
                {chatMessages.map((msg, idx) => (
                    <div key={idx} style={{ textAlign: msg.from === "bot" ? "left" : "right", margin: "8px 0" }}>
                        <b>{msg.from === "bot" ? "Bot" : "You"}: </b>
                        {msg.text}
                    </div>
                ))}
            </div>

            {(awaitingInputFor || interviewStarted) && (
                <div>
                    {interviewStarted && !awaitingInputFor && (
                        <div style={{ marginBottom: 5 }}>
                            Time Remaining: {timer} second{timer !== 1 ? "s" : ""}
                        </div>
                    )}
                    <textarea
                        rows={awaitingInputFor ? 1 : 4}
                        style={{ width: "100%" }}
                        value={awaitingInputFor ? inputValue : answerInput}
                        onChange={(e) => (awaitingInputFor ? setInputValue(e.target.value) : setAnswerInput(e.target.value))}
                        placeholder={awaitingInputFor ? `Enter your ${awaitingInputFor}` : "Type your answer here..."}
                        autoFocus
                    />
                    <button
                        onClick={handleUserInput}
                        disabled={awaitingInputFor ? !inputValue.trim() : !answerInput.trim() || loadingAnswerScore}
                    >
                        {awaitingInputFor ? "Submit" : loadingAnswerScore ? "Submitting..." : "Submit Answer"}
                    </button>
                    {dynamicLoading && <p>Loading questions...</p>}
                </div>
            )}
        </div>
    );
}