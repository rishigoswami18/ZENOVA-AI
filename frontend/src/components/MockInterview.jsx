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
      let nextTranscript = '';
      for (let index = 0; index < event.results.length; index += 1) {
        nextTranscript += event.results[index][0].transcript;
      }
      setTranscript(nextTranscript.trim());
    };

    recognition.onend = () => {
      setIsListening(false);
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
    if (videoSession?.intro_script && mode === 'video') {
      speakAsInterviewer(videoSession.intro_script);
    }
  }, [videoSession, mode]);

  useEffect(() => {
    if (currentVideoQuestion && mode === 'video') {
      speakAsInterviewer(currentVideoQuestion.question);
    }
  }, [videoQuestionIndex, mode]);

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
    setTranscript('');
    setTimeLeft(timerSeconds);
    setIsAnswering(true);

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
        setIsListening(false);
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
    } catch (err) {
      setError(err.message || 'Virtual interview evaluation failed.');
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
    stopInterviewerSpeech();
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
                <button className="btn btn-primary" onClick={beginVideoSession} disabled={startingVideoSession}>
                  {startingVideoSession ? <Loader className="animate-spin" size={16} /> : <Video size={16} />}
                  {startingVideoSession ? 'Building Session...' : 'Start Session'}
                </button>
              </div>
            </div>

            <div className="video-panel-grid">
              <div className="video-preview-shell">
                <video ref={videoRef} autoPlay muted playsInline className="video-preview" />
                {!cameraEnabled && (
                  <div className="video-preview-placeholder">
                    <Camera size={28} />
                    <p>Enable your webcam to rehearse eye contact and posture.</p>
                  </div>
                )}
                <div className="video-status-bar">
                  <span className={`status-pill ${cameraEnabled ? 'live' : ''}`}>{cameraEnabled ? 'Camera Live' : 'Camera Off'}</span>
                  <span className={`status-pill ${isListening ? 'live' : ''}`}>{isListening ? 'Transcript Listening' : speechSupported ? 'Transcript Ready' : 'Transcript Manual'}</span>
                </div>
              </div>

              <div className="video-sidebar">
                <div className={`interviewer-avatar-card ${isInterviewerSpeaking ? 'speaking' : ''}`}>
                  <div className="avatar-stage video-avatar-stage">
                    <div className="video-avatar-backdrop">
                      <div className="backdrop-ring ring-one"></div>
                      <div className="backdrop-ring ring-two"></div>
                      <div className="backdrop-grid"></div>
                    </div>
                    <div className="avatar-halo"></div>
                    <div className="video-avatar-body">
                      <div className="avatar-head">
                        <div className="avatar-hair"></div>
                        <div className="avatar-face">
                          <div className="avatar-eyes">
                            <span></span>
                            <span></span>
                          </div>
                          <div className="avatar-brows">
                            <span></span>
                            <span></span>
                          </div>
                          <div className="avatar-nose"></div>
                          <div className={`avatar-mouth ${isInterviewerSpeaking ? 'talking' : ''}`}></div>
                        </div>
                      </div>
                      <div className="avatar-shoulders"></div>
                    </div>
                    <div className="avatar-lower-third">
                      <div>
                        <strong>{videoSession?.interviewer_name || 'Virtual Interviewer'}</strong>
                        <span>{videoSession?.interviewer_style || 'AI Interview Specialist'}</span>
                      </div>
                      <div className={`lower-third-live ${isInterviewerSpeaking ? 'active' : ''}`}>LIVE</div>
                    </div>
                  </div>
                  <div>
                    <p className="virtual-eyebrow">Animated Interviewer</p>
                    <h4 style={{ fontSize: '16px' }}>{videoSession?.interviewer_name || 'Virtual Interviewer'}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                      {isInterviewerSpeaking ? 'Speaking live' : 'Waiting for your answer'}
                    </p>
                  </div>
                  <div className="interviewer-subtitle">
                    {spokenLine || 'Start a session to hear your interviewer introduce the round.'}
                  </div>
                  <div className="interviewer-voice-actions">
                    <button className="btn btn-secondary" onClick={() => setVoiceEnabled((current) => !current)}>
                      {voiceEnabled ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                      {voiceEnabled ? 'Voice On' : 'Voice Off'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        if (currentVideoQuestion) {
                          speakAsInterviewer(currentVideoQuestion.question);
                        } else if (videoSession?.intro_script) {
                          speakAsInterviewer(videoSession.intro_script);
                        }
                      }}
                      disabled={!videoSession}
                    >
                      <PlayCircle size={16} /> Replay Prompt
                    </button>
                  </div>
                </div>

                <div className="video-control-card">
                  <label>Interview Type</label>
                  <select className="role-selector" value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
                    <option value="Technical">Technical</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Hiring Manager">Hiring Manager</option>
                    <option value="System Design">System Design</option>
                  </select>
                </div>

                <div className="video-control-card">
                  <label>Answer Timer</label>
                  <div className="timer-chip-row">
                    {[90, 120, 180].map((seconds) => (
                      <button
                        key={seconds}
                        className={`chip-btn ${timerSeconds === seconds ? 'active' : ''}`}
                        onClick={() => {
                          setTimerSeconds(seconds);
                          setTimeLeft(seconds);
                        }}
                      >
                        {seconds / 60 < 2 ? '90 sec' : `${seconds / 60} min`}
                      </button>
                    ))}
                  </div>
                  <div className="video-timer">{formattedTime}</div>
                </div>

                  <div className="video-control-card">
                  <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Delivery Cues</h4>
                  <div className="coach-checklist">
                    <div><CheckCircle2 size={14} /> Lead with the headline of your answer.</div>
                    <div><CheckCircle2 size={14} /> Use one concrete example with impact.</div>
                    <div><CheckCircle2 size={14} /> Pause briefly before your closing line.</div>
                  </div>
                </div>
              </div>
            </div>

            {videoSession ? (
              <>
                <div className="virtual-interviewer-card">
                  <div>
                    <p className="virtual-eyebrow">Interviewer</p>
                    <h3>{videoSession.interviewer_name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{videoSession.interviewer_style}</p>
                  </div>
                  <div>
                    <p style={{ color: '#dbe4ff', fontSize: '14px', lineHeight: '1.6' }}>{videoSession.intro_script}</p>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(Array.isArray(videoSession.delivery_focus) ? videoSession.delivery_focus : [videoSession.delivery_focus]).filter(Boolean).map((focus, index) => (
                        <span key={`${focus}-${index}`} className="meta-pill">{focus}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {currentVideoQuestion && (
                  <div className="question-panel">
                    <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MonitorPlay size={18} style={{ color: 'var(--secondary)' }} /> Live Prompt {videoQuestionIndex + 1}
                    </h3>
                    <p style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginTop: '12px' }}>
                      {currentVideoQuestion.question}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '10px' }}>
                      Interviewer intent: {currentVideoQuestion.intent}
                    </p>
                  </div>
                )}

                <div className="glass-card">
                  <div className="video-action-row">
                    <button className={`btn ${isAnswering ? 'btn-secondary' : 'btn-accent'}`} onClick={isAnswering ? stopAnswerSession : startAnswerSession}>
                      {isAnswering ? <Square size={16} /> : <Mic size={16} />}
                      {isAnswering ? 'Stop Answer' : 'Start Answer'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setTranscript('')}>
                      <RefreshCw size={16} /> Reset Transcript
                    </button>
                    <button className="btn btn-primary" onClick={evaluateVideoAnswer} disabled={grading || !transcript.trim()}>
                      {grading ? <Loader className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                      {grading ? 'Evaluating...' : 'Get AI Feedback'}
                    </button>
                  </div>

                  <div className="form-group" style={{ marginTop: '20px' }}>
                    <label>Answer Transcript</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '200px', lineHeight: '1.7' }}
                      placeholder={speechSupported ? 'Your transcript will appear here while you speak. You can also edit it manually before grading.' : 'Speech recognition is unavailable in this browser, so paste or type your spoken answer here.'}
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                    />
                  </div>

                  <div className="transcript-footnote">
                    {speechSupported ? (
                      <span>{isListening ? <Mic size={14} /> : <MicOff size={14} />} Live transcript works best in Chromium-based browsers with microphone access.</span>
                    ) : (
                      <span><AlertCircle size={14} /> Live transcript is not supported here, but manual practice still works well.</span>
                    )}
                  </div>
                </div>

                {videoReport && (
                  <div className="video-feedback-grid">
                    <div className="glass-card score-stack">
                      <h3 style={{ fontSize: '16px' }}>Virtual Interview Score</h3>
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
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {videoReport.is_real_ai ? 'Groq-backed live interview feedback' : 'Local fallback coaching feedback'}
                      </p>
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
                        <h4 className="feedback-title warning"><AlertCircle size={14} /> What To Tighten</h4>
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
                        <h4>Polished Answer Shape</h4>
                        <p>{videoReport.sample_polished_answer}</p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button className="btn btn-secondary" onClick={() => setVideoReport(null)}>
                          Review Again
                        </button>
                        <button className="btn btn-primary" onClick={nextVideoQuestion}>
                          Next Prompt <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="video-empty-state">
                <Video size={24} />
                <div>
                  <h3>Build a Realistic Mock Interview</h3>
                  <p>Start a session to generate a live interviewer persona, three role-specific prompts, and AI delivery feedback for your spoken answers.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
