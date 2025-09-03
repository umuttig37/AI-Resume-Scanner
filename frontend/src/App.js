import React, { useState, useRef } from 'react';
import './styles.css';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showTips, setShowTips] = useState(false);
  const fileInputRef = useRef(null);

const API_URL =
  (typeof import.meta !== 'undefined' &&
   import.meta.env &&
   import.meta.env.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://ai-resume-scanner-backend-yv1x.onrender.com'
    : 'http://localhost:8000');


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    } catch (error) {
      setResult({
        error: error.message || "Failed to analyze resume. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);

      const url = URL.createObjectURL(selectedFile);
      setPdfUrl(url);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setShowTips(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStrengthLevel = (score) => {
    if (score >= 0.8) return 'strong';
    if (score >= 0.5) return 'medium';
    return 'weak';
  };

  const getImprovementTips = (section, score) => {
    const tips = {
      'technical skills': {
        strong: 'Excellent technical skills coverage. Keep it updated with latest technologies.',
        medium: 'Consider adding 2-3 more relevant technologies and specify proficiency levels.',
        weak: 'Expand technical skills section. Include programming languages, tools, and frameworks.'
      },
      'work experience': {
        strong: 'Strong work history with good use of action verbs and quantifiable results.',
        medium: 'Add metrics to quantify achievements (e.g., "increased efficiency by 30%").',
        weak: 'Include more detailed work experience with specific accomplishments and timelines.'
      },
      'education': {
        strong: 'Education section is comprehensive and well-structured.',
        medium: 'Include relevant coursework and academic achievements if applicable.',
        weak: 'Expand education details with dates, institution names, and relevant coursework.'
      },
      'projects': {
        strong: 'Projects effectively showcase your skills with good descriptions.',
        medium: 'Add project links, technologies used, and specific contributions.',
        weak: 'Include more projects with detailed descriptions and outcomes.'
      },
      'quantified achievements': {
        strong: 'Effective use of numbers and metrics to demonstrate impact.',
        medium: 'Include more quantifiable results using percentages and timeframes.',
        weak: 'Focus on adding measurable achievements with specific numbers and results.'
      }
    };

    const strength = getStrengthLevel(score);
    return tips[section]?.[strength] || `This section needs ${strength === 'weak' ? 'significant ' : ''}improvement.`;
  };

  const getOverallFeedback = (score) => {
    if (score >= 80) return 'Excellent resume. Ready to send to employers.';
    if (score >= 60) return 'Good resume. Some improvements needed.';
    if (score >= 40) return 'Needs significant improvements.';
    return 'Major revisions required.';
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Resume Analyzer</h1>
        <p>Get detailed feedback to optimize your resume for applicant tracking systems</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="upload-container">
          {file ? (
            <div className="file-info">
              <div>
                <p className="file-name">{file.name}</p>
                <p className="file-size">{Math.round(file.size / 1024)} KB</p>
              </div>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3498db" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y1="15"></line>
                </svg>
              </div>
              <p className="upload-text">Drag & drop your resume PDF here</p>
              <p className="upload-subtext">or click below to browse files</p>
            </>
          )}

          <label className="upload-btn">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            {file ? 'Change File' : 'Browse Files'}
          </label>

          {file && (
            <button
              type="button"
              className="upload-btn cancel-btn"
              onClick={resetForm}
            >
              Clear
            </button>
          )}
        </div>

        {file && (
          <button
            type="submit"
            className="analyze-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing Resume...
              </>
            ) : (
              'Get Detailed Analysis'
            )}
          </button>
        )}
      </form>

      {!file && (
        <div className="tips-section">
          <button
            className="tips-toggle"
            onClick={() => setShowTips(!showTips)}
          >
            {showTips ? 'Hide Tips' : 'Show Resume Tips'}
          </button>

          {showTips && (
            <div className="tips-content">
              <h3>Resume Best Practices:</h3>
              <ul>
                <li>Use clear section headings (Experience, Education, Skills)</li>
                <li>Include quantifiable achievements with numbers</li>
                <li>Use relevant keywords from job descriptions</li>
                <li>Keep it to 1-2 pages maximum</li>
                <li>Use clean, professional formatting</li>
                <li>Include both technical and soft skills</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="results">
          {result.error ? (
            <div className="error-message">
              <h3>Error</h3>
              <p>{result.error}</p>
              <button
                className="upload-btn"
                onClick={resetForm}
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="score-header">
                <div>
                  <h2>Analysis Report</h2>
                  <p className="filename">For: {result.filename}</p>
                </div>
                <div className="score-container">
                  <div className="score-value">{result.ats_score}</div>
                  <div className="score-label">ATS Score /100</div>
                  <div className="score-feedback">
                    {getOverallFeedback(result.ats_score)}
                  </div>
                </div>
              </div>

              <div className="analysis-grid">
                {result.section_scores && Object.entries(result.section_scores).map(([section, score]) => (
                  <div
                    key={section}
                    className={`analysis-card ${getStrengthLevel(score)}`}
                  >
                    <h3>{section.replace(/-/g, ' ')}</h3>

                    <div className="strength-meter">
                      <div
                        className="strength-bar"
                        style={{ width: `${score * 100}%` }}
                      ></div>
                    </div>

                    <div className="score-display">
                      <span className="percentage">{Math.round(score * 100)}%</span>
                      <span className={`strength-label ${getStrengthLevel(score)}`}>
                        {getStrengthLevel(score).toUpperCase()}
                      </span>
                    </div>

                    <div className="improvement-tips">
                      <p>{getImprovementTips(section, score)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="action-buttons">
                <button className="action-btn primary">
                  Save Report
                </button>
                <button className="action-btn secondary">
                  Export Results
                </button>
                <button className="action-btn" onClick={resetForm}>
                  Analyze Another
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {pdfUrl && (
        <div className="preview-box">
          <div className="preview-header">
            <h3>Resume Preview</h3>
            <a href={pdfUrl} download="resume.pdf" className="download-btn">
              Download
            </a>
          </div>
          <iframe
            src={pdfUrl}
            title="Resume Preview"
            width="100%"
            height="500px"
            className="pdf-viewer"
          />
          <p className="preview-note">
            Some browsers may not display PDF previews perfectly.
            Use the download button if needed.
          </p>
        </div>
      )}

      <footer className="app-footer">
        <p>Resume Analysis Tool • Built by Umut Efe Uygur</p>
      </footer>
    </div>
  );
}

export default App;