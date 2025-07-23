import React, { useState, useRef } from 'react';
import './styles.css';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
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
        error: error.message || "failed to analyze resume"
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

      // preview url
      const url = URL.createObjectURL(selectedFile);
      setPdfUrl(url);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStrengthLevel = (score) => {
    if (score >= 0.8) return 'strong';
    if (score >= 0.5) return 'medium';
    return 'weak';
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Resume Analyzer</h1>
        <p>Upload your resume to get instant feedback</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="upload-container">
          {file ? (
            <p>Selected: <strong>{file.name}</strong></p>
          ) : (
            <>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3498db" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y1="15"></line>
              </svg>
              <p>Select your resume PDF file</p>
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
            {loading ? 'Analyzing...' : 'Get Analysis'}
          </button>
        )}
      </form>

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
                <h2>Analysis Report</h2>
                <div className="score-container">
                  <div className="score-value">{result.ats_score}</div>
                  <div className="score-label">ATS Score /100</div>
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
                    <p>Score: {Math.round(score * 100)}%</p>
                    <p className="strength-label">
                      {getStrengthLevel(score).toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {pdfUrl && (
        <div className="preview-box">
          <h3>Resume Preview</h3>
          <iframe
            src={pdfUrl}
            title="Resume Preview"
            width="100%"
            height="500px"
            style={{ border: '1px solid #ddd', borderRadius: '8px' }}
          />
          <p className="preview-note">
            Note: preview might not display properly in some browsers
            <a href={pdfUrl} download="resume.pdf" className="download-link">
              Download instead
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;