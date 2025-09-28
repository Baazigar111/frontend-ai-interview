import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  candidates: [],
};

const candidateSlice = createSlice({
  name: 'candidate',
  initialState,
  reducers: {
    addCandidate(state, action) {
      state.candidates.push({
        id: action.payload.id,
        profile: action.payload.profile,
        chats: [],
        answers: {},
        questions: [], // Store questions here
        status: 'new', // new, waitingInfo, in-progress, completed
        finalScore: null,
        summary: null,
      });
    },
    addChatMessage(state, action) {
      const { candidateId, message } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate) {
        candidate.chats.push(message);
      }
    },
    saveAnswer(state, action) {
      const { candidateId, questionId, answer, score } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate) {
        candidate.answers[questionId] = { answer, score };
      }
    },
    updateCandidateProfile(state, action) {
      const { id, profile } = action.payload;
      const candidate = state.candidates.find(c => c.id === id);
      if (candidate) {
        candidate.profile = { ...candidate.profile, ...profile };
      }
    },
    updateCandidateStatus(state, action) {
      const { id, status } = action.payload;
      const candidate = state.candidates.find(c => c.id === id);
      if (candidate) {
        candidate.status = status;
      }
    },
    setCandidateQuestions(state, action) {
      const { candidateId, questions } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate) {
        candidate.questions = questions;
      }
    },
    finishInterview(state, action) {
      const { candidateId, score, summary } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate) {
        candidate.status = 'completed';
        candidate.finalScore = score;
        candidate.summary = summary;
      }
    },
    resetCandidates(state) {
      state.candidates = [];
    },
  },
});

export const {
  addCandidate,
  addChatMessage,
  saveAnswer,
  updateCandidateProfile,
  updateCandidateStatus,
  setCandidateQuestions,
  finishInterview,
  resetCandidates,
} = candidateSlice.actions;

export default candidateSlice.reducer;
