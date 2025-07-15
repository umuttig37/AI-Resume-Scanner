import React, { useState } from 'react';
import './styles.css';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('error:', error);
      setResult({ error: "failed to analyze resume" });
    } finally {
      setLoading(false);
    }
  };

  const ScoreMeter = ({ score }) => (
    <div className="score-meter">
      <div className="score-bar" style={{ width: `${score}%` }}>
        {score}/100
      </div>
    </div>
  );

  return (
    <div className="app">
      <h1>Resume Scanner</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          accept=".pdf" 
          onChange={(e) => setFile(e.target.files[0])} 
        />
        <button type="submit" disabled={loading}>
          {loading ? 'analyzing..' : 'upload resume'}
        </button>
      </form>

      {result && (
        <div className="results">
          {result.error ? (
            <p className="error">{result.error}</p>
          ) : (
            <>
              <h2>Results for: {result.filename}</h2>
              <ScoreMeter score={result.ats_score} />
              <h3>Preview:</h3>
              <p>{result.preview}</p>
              <h3>Analysis:</h3>
              <pre>{result.analysis}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;