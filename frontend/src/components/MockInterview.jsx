import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  HelpCircle,
  Loader,
  Mic,
  MicOff,
  MonitorPlay,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Square,
  Video
} from 'lucide-react';
import { api } from '../utils/api';

const DEFAULT_TIMER_SECONDS = 120;

export default function MockInterview({ targetRole, onInterviewScoreUpdate }) {
  const [mode, setMode] = useState('written');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('Medium');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [grading, setGrading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const [interviewType, setInterviewType] = useState('Technical');
  const [videoSession, setVideoSession] = useState(null);
  const [videoQuestionIndex, setVideoQuestionIndex] = useState(0);
  const [startingVideoSession, setStartingVideoSession] = useState(false);
  const [videoReport, setVideoReport] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER_SECONDS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER_SECONDS);
  const [isAnswering, setIsAnswering] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [spokenLine, setSpokenLine] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isFollowUpActive, setIsFollowUpActive] = useState(false);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const intervalRef = useRef(null);
  const interviewerVoiceRef = useRef(null);

  const currentVideoQuestion = videoSession?.questions?.[videoQuestionIndex] || null;

  const formattedTime = useMemo(() => {
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const seconds = String(timeLeft % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [timeLeft]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getInterviewQuestions(targetRole);
      setQuestions(data);
      if (data.length > 0) {
        setSelectedQuestion(data[0]);
      }
    } catch (_err) {
      setError('Failed to fetch mock interview questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    setReport(null);
    setUserAnswer('');
    setVideoSession(null);
    setTranscript('');
    setVideoReport(null);
    setVideoQuestionIndex(0);
    setTimeLeft(DEFAULT_TIMER_SECONDS);
  }, [targetRole]);

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      return;
    }

    setSpeechSupported(true);
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => {
          const base = prev.replace(/ \[transcribing\.\.\.\]$/, '');
          return (base ? base + ' ' + finalTranscript.trim() : finalTranscript.trim());
        });
      } else if (interimTranscript) {
        setTranscript((prev) => {
          const base = prev.replace(/ \[transcribing\.\.\.\]$/, '');
          return base + ' [transcribing...]';
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please enable mic permissions.');
      }
    };

    recognition.onend = () => {
      // Auto-restart if we are still 'answering'
      if (isAnswering && speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.start();
        } catch (_err) {
          // already started or failed
        }
      } else {
        setIsListening(false);
      }
    };

    speechRecognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
      setAvailableVoices(voices);
      interviewerVoiceRef.current =
        voices.find((voice) => /en/i.test(voice.lang) && /female|samantha|zira|aria|ava|jenny|susan|google us english/i.test(voice.name)) ||
        voices.find((voice) => /en/i.test(voice.lang)) ||
        null;
    };

    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => () => {
    stopCamera();
    stopAnswerSession();
    stopInterviewerSpeech();
  }, []);

  useEffect(() => {
    if (currentVideoQuestion && mode === 'video') {
      if (videoQuestionIndex === 0 && videoSession?.intro_script) {
        speakAsInterviewer(videoSession.intro_script + " Here is your first question: " + currentVideoQuestion.question);
      } else {
        speakAsInterviewer(currentVideoQuestion.question);
      }
    }
  }, [videoQuestionIndex, videoSession, mode]);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      setError('Please type an answer to submit.');
      return;
    }
    setGrading(true);
    setError('');
    try {
      const result = await api.gradeInterviewAnswer(
        selectedQuestion.question,
        userAnswer,
        targetRole,
        difficulty
      );
      setReport(result.report);
      onInterviewScoreUpdate(result.report.score);
    } catch (err) {
      setError(err.message || 'Evaluation service encountered an error.');
    } finally {
      setGrading(false);
    }
  };

  const handleNext = () => {
    setReport(null);
    setUserAnswer('');
    setError('');
    const currentIdx = questions.findIndex((q) => q.id === selectedQuestion.id);
    const nextIdx = (currentIdx + 1) % questions.length;
    setSelectedQuestion(questions[nextIdx]);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraEnabled(true);
      setError('');
    } catch (_err) {
      setError('Camera access was blocked. Allow webcam permission to practice with the live preview.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
  };

  const toggleCamera = async () => {
    if (cameraEnabled) {
      stopCamera();
      return;
    }
    await startCamera();
  };

  const stopAnswerSession = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsListening(false);
    setIsAnswering(false);
  };

  const stopInterviewerSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsInterviewerSpeaking(false);
  };

  const speakAsInterviewer = (text) => {
    setSpokenLine(text);
    if (!voiceEnabled || !window.speechSynthesis || !text) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (interviewerVoiceRef.current) {
      utterance.voice = interviewerVoiceRef.current;
    }
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    utterance.onstart = () => setIsInterviewerSpeaking(true);
    utterance.onend = () => setIsInterviewerSpeaking(false);
    utterance.onerror = () => setIsInterviewerSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const startAnswerSession = () => {
    setVideoReport(null);
    setError('');
    // Only clear transcript if we are NOT in a follow-up flow
    if (!isFollowUpActive) {
      setTranscript('');
    }
    setTimeLeft(timerSeconds);
    setIsAnswering(true);
    setIsFollowUpActive(false);

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          stopAnswerSession();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
      } catch (_err) {
        setIsListening(true); // maybe already listening
      }
    }
  };

  const beginVideoSession = async () => {
    try {
      setStartingVideoSession(true);
      setError('');
      const session = await api.createVideoInterviewSession(targetRole, interviewType, difficulty);
      setVideoSession(session);
      setVideoQuestionIndex(0);
      setVideoReport(null);
      setTranscript('');
      setTimeLeft(timerSeconds);
    } catch (err) {
      setError(err.message || 'Unable to generate a virtual interview session.');
    } finally {
      setStartingVideoSession(false);
    }
  };

  const evaluateVideoAnswer = async () => {
    if (!currentVideoQuestion || !transcript.trim()) {
      setError('Record or type your answer transcript before asking for feedback.');
      return;
    }

    stopAnswerSession();
    setGrading(true);
    setError('');
    try {
      const durationSeconds = Math.max(timerSeconds - timeLeft, 0);
      const result = await api.gradeVideoInterviewAnswer(
        currentVideoQuestion.question,
        transcript,
        targetRole,
        interviewType,
        difficulty,
        durationSeconds
      );
      setVideoReport(result.report);
      onInterviewScoreUpdate(result.report.overall_score);

      if (result.report && result.report.follow_up_question) {
        speakAsInterviewer("Good points. " + result.report.follow_up_question);
        setIsFollowUpActive(true);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      setError(err.message || 'Virtual interview evaluation failed. Verify your internet connection.');
    } finally {
      setGrading(false);
    }
  };

  const nextVideoQuestion = () => {
    setVideoReport(null);
    setTranscript('');
    setTimeLeft(timerSeconds);
    setError('');
    stopAnswerSession();
    setVideoQuestionIndex((current) => {
      if (!videoSession?.questions?.length) {
        return current;
      }
      return (current + 1) % videoSession.questions.length;
    });
  };

  return (
    <div className="mock-interview-view animate-fadeIn">
      <div className="glass-card" style={{ marginBottom: '30px' }}>
        <div className="interview-header-row">
          <div>
            <h2 style={{ fontSize: '20px' }}>Interview Preparation Studio</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Switch between written drills and a realistic virtual video interview for <strong>{targetRole}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>DIFFICULTY:</span>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', padding: '4px', borderRadius: '8px' }}>
              {['Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  className="btn"
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    backgroundColor: difficulty === diff ? 'var(--primary-light)' : 'transparent',
                    color: difficulty === diff ? '#ffffff' : 'var(--text-muted)',
                    borderColor: 'transparent'
                  }}
                  onClick={() => setDifficulty(diff)}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="interview-mode-tabs">
          <button className={`mode-tab ${mode === 'written' ? 'active' : ''}`} onClick={() => setMode('written')}>
            <HelpCircle size={16} /> Written Practice
          </button>
          <button className={`mode-tab ${mode === 'video' ? 'active' : ''}`} onClick={() => setMode('video')}>
            <MonitorPlay size={16} /> Virtual Video Interview
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-box error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {mode === 'written' && (
        <>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <Loader className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
            </div>
          ) : (
            <div className="interview-box">
              {selectedQuestion && (
                <div className="question-panel">
                  <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HelpCircle size={18} style={{ color: 'var(--primary)' }} /> Question
                  </h3>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginTop: '12px' }}>
                    {selectedQuestion.question}
                  </p>
                </div>
              )}

              {!report ? (
                <div className="glass-card">
                  <div className="form-group">
                    <label>Draft Your Solution</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '180px', fontFamily: 'Courier New, monospace', fontSize: '14px', lineHeight: '1.6' }}
                      placeholder="Provide a detailed explanation. Outline core algorithms, trade-offs, architecture patterns, and space/time complexity details where applicable..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={grading || !userAnswer.trim()}>
                      {grading ? (
                        <>
                          <Loader className="animate-spin" size={18} /> Submitting for AI Evaluation...
                        </>
                      ) : (
                        <>
                          Submit Answer <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="eval-results-panel">
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '16px' }}>AI Match Rating</h3>
                    <div style={{ display: 'inline-flex', width: '110px', height: '110px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <span style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: report.score >= 80 ? 'var(--success)' : report.score >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                        {report.score}
                      </span>
                      <span style={{ position: 'absolute', bottom: '12px', fontSize: '8px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>SCORE</span>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {report.is_real_ai ? 'High Fidelity AI Analysis' : 'NLP Jargon Scored'}
                    </div>
                  </div>

                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <h4 style={{ fontSize: '13px', color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <Award size={14} /> Strong Elements
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>{report.strengths}</p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '13px', color: 'var(--warning)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <AlertCircle size={14} /> Key Omissions & Gaps
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>{report.omissions}</p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                      <h4 style={{ fontSize: '13px', color: '#ffffff', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Model Candidate Answer
                      </h4>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '12px', fontSize: '12px', fontFamily: 'Courier New, monospace', color: '#cbd5e1', lineHeight: '1.6', overflowX: 'auto' }}>
                        {report.model_answer}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                      <button className="btn btn-secondary" onClick={() => { setReport(null); setUserAnswer(''); }}>
                        Try Again
                      </button>
                      <button className="btn btn-primary" onClick={handleNext}>
                        Next Question <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {mode === 'video' && (
        <div className="video-prep-grid">
          <div className="glass-card video-stage-card">
            <div className="video-stage-header">
              <div>
                <h3 style={{ fontSize: '18px' }}>Virtual Interview Stage</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Practice with a live mirror, timer, and AI delivery feedback.
                </p>
              </div>
              <div className="video-stage-actions">
                <button className={`btn ${cameraEnabled ? 'btn-secondary' : 'btn-accent'}`} onClick={toggleCamera}>
                  <Camera size={16} /> {cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="role-selector compact" value={interviewType} onChange={(e) => setInterviewType(e.target.value)} style={{ padding: '8px 12px', height: 'auto' }}>
                    <option value="Technical">Technical</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Hiring Manager">Hiring Manager</option>
                  </select>
                  <button className="btn btn-primary" onClick={beginVideoSession} disabled={startingVideoSession}>
                    {startingVideoSession ? <Loader className="animate-spin" size={16} /> : <Video size={16} />}
                    {startingVideoSession ? 'Building...' : 'Start Session'}
                  </button>
                </div>
              </div>
            </div>

            {videoSession ? (
              <>
                <div className="video-panel-grid">
                  <div className="video-preview-shell">
                    <video ref={videoRef} autoPlay muted playsInline className="video-preview" />
                    {cameraEnabled && (
                      <div className="camera-hud-overlay">
                        <div className="hud-corner top-left"></div>
                        <div className="hud-corner top-right"></div>
                        <div className="hud-corner bottom-left"></div>
                        <div className="hud-corner bottom-right"></div>
                        <div className="hud-grid-lines"></div>
                        {isAnswering && (
                          <div className="hud-recording-dot">
                            <span className="dot-blink"></span> REC
                          </div>
                        )}
                      </div>
                    )}
                    {!cameraEnabled && (
                      <div className="video-preview-placeholder">
                        <Camera size={28} />
                        <p>Enable your webcam to rehearse eye contact and posture.</p>
                      </div>
                    )}

                    {/* Overlay Prompt on Video */}
                    {currentVideoQuestion && (
                      <div className="video-prompt-overlay animate-slideUp">
                        <div className="prompt-content">
                          <div className="prompt-header">
                            <MonitorPlay size={14} />
                            <span>{isFollowUpActive ? 'FOLLOW-UP QUESTION' : `LIVE PROMPT #${videoQuestionIndex + 1}`}</span>
                          </div>
                          <h3>{isFollowUpActive ? videoReport?.follow_up_question : currentVideoQuestion.question}</h3>
                          {isFollowUpActive && <div className="follow-up-hint">Answering follow-up will update your cumulative evaluation.</div>}
                        </div>
                      </div>
                    )}

                    <div className="video-status-bar">
                      <span className={`status-pill ${cameraEnabled ? 'live' : ''}`}>{cameraEnabled ? 'Camera Live' : 'Camera Off'}</span>
                      <span className={`status-pill ${isListening ? 'live' : ''}`}>{isListening ? 'Transcript Listening' : speechSupported ? 'Transcript Ready' : 'Transcript Manual'}</span>
                    </div>
                  </div>

                  <div className="video-sidebar">
                    {/* Interviewer Profile Mini Card (compact) */}
                    <div className={`interviewer-profile-card ${isInterviewerSpeaking ? 'active' : ''}`}>
                      <div className="avatar-mini-stage">
                        <div className={`hologram-orb-mini ${isInterviewerSpeaking ? 'speaking' : ''}`}></div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{videoSession.interviewer_name}</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{videoSession.interviewer_style}</p>
                      </div>
                      <div className={`live-pulse ${isInterviewerSpeaking ? 'active' : ''}`}></div>
                    </div>

                    <div className={`interviewer-avatar-card ${isInterviewerSpeaking ? 'speaking' : ''}`}>
                      <div className="avatar-stage video-avatar-stage">
                        <div className="video-avatar-backdrop">
                          <div className="backdrop-ring ring-one"></div>
                          <div className="backdrop-ring ring-two"></div>
                          <div className="backdrop-grid"></div>
                        </div>
                        <div className="avatar-halo"></div>
                        <div className={`hologram-container ${isInterviewerSpeaking ? 'speaking' : ''}`}>
                          <div className="hologram-orb"></div>
                          <div className="hologram-wave wave-1"></div>
                          <div className="hologram-wave wave-2"></div>
                          <div className="hologram-wave wave-3"></div>
                          <div className="hologram-ring ring-inner"></div>
                          <div className="hologram-ring ring-outer"></div>
                          <div className="hologram-scanner"></div>
                        </div>
                        {/* Compact lower third */}
                        <div className="avatar-caption">
                          {spokenLine || 'Waiting...'}
                        </div>
                      </div>

                      <div className="interviewer-voice-actions">
                        <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => setVoiceEnabled((current) => !current)}>
                          {voiceEnabled ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                          {voiceEnabled ? 'Voice On' : 'Voice Off'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '12px' }}
                          onClick={() => {
                            if (currentVideoQuestion) {
                              speakAsInterviewer(currentVideoQuestion.question);
                            } else if (videoSession?.intro_script) {
                              speakAsInterviewer(videoSession.intro_script);
                            }
                          }}
                          disabled={!videoSession}
                        >
                          <RefreshCw size={14} /> Replay
                        </button>
                      </div>
                    </div>

                    <div className="video-control-card compact">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ margin: 0 }}>Timer</label>
                        <div className="video-timer-mini">{formattedTime}</div>
                      </div>
                      <div className="timer-chip-row" style={{ marginTop: '10px' }}>
                        {[90, 120, 180].map((seconds) => (
                          <button
                            key={seconds}
                            className={`chip-btn ${timerSeconds === seconds ? 'active' : ''}`}
                            style={{ padding: '4px 8px', fontSize: '10px' }}
                            onClick={() => {
                              setTimerSeconds(seconds);
                              setTimeLeft(seconds);
                            }}
                          >
                            {seconds / 60 < 2 ? '90s' : `${seconds / 60}m`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="video-control-card compact">
                      <label>Intent</label>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{currentVideoQuestion?.intent || "Standard evaluation"}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card video-action-bar">
                  <div className="video-action-row">
                    <button className={`btn ${isAnswering ? 'btn-secondary' : 'btn-accent'}`} onClick={isAnswering ? stopAnswerSession : startAnswerSession}>
                      {isAnswering ? <Square size={16} /> : <Mic size={16} />}
                      {isAnswering ? 'Stop' : 'Start Recording'}
                    </button>

                    <div className="action-divider"></div>

                    <button className="btn btn-primary" onClick={evaluateVideoAnswer} disabled={grading || !transcript.trim()}>
                      {grading ? <Loader className="animate-spin" size={16} /> : <Sparkles size={16} />}
                      {grading ? 'Analyzing...' : 'Get AI Evaluation'}
                    </button>

                    <button className="btn btn-secondary" onClick={nextVideoQuestion} title="Skip to next">
                      <ArrowRight size={16} />
                    </button>
                  </div>

                  <div className="transcript-overlay-area">
                    <textarea
                      className="transcript-textarea"
                      placeholder={speechSupported ? 'Transcribing live...' : 'Type your answer here...'}
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                    />
                    <button className="btn-icon-sm" onClick={() => setTranscript('')} title="Clear">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>

                <div className="transcript-footnote">
                  {speechSupported ? (
                    <span>{isListening ? <Mic size={14} /> : <MicOff size={14} />} Live transcript works best in Chromium-based browsers with microphone access.</span>
                  ) : (
                    <span><AlertCircle size={14} /> Live transcript is not supported here, but manual practice still works well.</span>
                  )}
                </div>

                {videoReport && (
                  <div className="video-feedback-grid animate-fadeIn">
                    <div className="glass-card score-stack">
                      <h3 style={{ fontSize: '16px' }}>Interview Score</h3>
                      <div className="score-orb">{videoReport.overall_score}</div>
                      <div className="score-mini-grid">
                        <div>
                          <span>Content</span>
                          <strong>{videoReport.content_score}</strong>
                        </div>
                        <div>
                          <span>Delivery</span>
                          <strong>{videoReport.delivery_score}</strong>
                        </div>
                        <div>
                          <span>Confidence</span>
                          <strong>{videoReport.confidence_score}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
                        <h4 className="feedback-title success"><Award size={14} /> What Landed Well</h4>
                        <div className="feedback-list">
                          {videoReport.strengths.map((item, index) => (
                            <div key={`${item}-${index}`}>{item}</div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="feedback-title warning"><AlertCircle size={14} /> Critical Feedback</h4>
                        <div className="feedback-list">
                          {videoReport.improvements.map((item, index) => (
                            <div key={`${item}-${index}`}>{item}</div>
                          ))}
                        </div>
                      </div>

                      <div className="follow-up-panel">
                        <h4>Likely Follow-up</h4>
                        <p>{videoReport.follow_up_question}</p>
                      </div>

                      <div className="follow-up-panel">
                        <h4>Polished Answer</h4>
                        <p>{videoReport.sample_polished_answer}</p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button className="btn btn-secondary" onClick={() => setVideoReport(null)}>
                          Review
                        </button>
                        <button className="btn btn-primary" onClick={nextVideoQuestion}>
                          Next <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="video-empty-state">
                <Video size={48} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                <h3>Ready to Practice?</h3>
                <p>Select your interview type and start a session to practice with a real-time AI interviewer.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
