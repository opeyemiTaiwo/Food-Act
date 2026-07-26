import { useEffect, useRef, useState } from 'react'
import { Client } from '@gradio/client'
import './ModelPredictor.css'

const SPACE_URL = 'https://opethaiwoh-vun-smt.hf.space'
const ENDPOINT = '/predict_reentrancy'
const WARMUP_DELAY_MS = 4000
const SEVERITY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

const SAMPLE_CONTRACT = `pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        // VULNERABILITY: External call before state update
        (bool sent, ) = msg.sender.call{value: _amount}("");
        require(sent, "Failed to send Ether");

        // State change AFTER external call - allows reentrancy!
        balances[msg.sender] -= _amount;
    }
}`

// Cached across calls so a second scan reuses the same connection
// instead of re-handshaking with the Space.
let clientPromise = null
function getClient() {
  if (!clientPromise) {
    clientPromise = Client.connect(SPACE_URL)
  }
  return clientPromise
}

function severityClass(value) {
  const normalized = String(value || '').trim().toUpperCase()
  return SEVERITY_LEVELS.includes(normalized) ? normalized.toLowerCase() : 'default'
}

function ModelPredictor() {
  const [sourceCode, setSourceCode] = useState(SAMPLE_CONTRACT)
  const [status, setStatus] = useState('idle') // idle | connecting | warming | success | error
  const [error, setError] = useState(null)
  const [resultData, setResultData] = useState(null) // full response.data array
  const warmupTimer = useRef(null)

  useEffect(() => () => clearTimeout(warmupTimer.current), [])

  const runScan = async () => {
    clearTimeout(warmupTimer.current)
    setStatus('connecting')
    setError(null)
    setResultData(null)

    warmupTimer.current = setTimeout(() => {
      setStatus((current) => (current === 'connecting' ? 'warming' : current))
    }, WARMUP_DELAY_MS)

    try {
      const client = await getClient()
      const response = await client.predict(ENDPOINT, { source_code: sourceCode })
      clearTimeout(warmupTimer.current)
      setResultData(response.data)
      setStatus('success')
    } catch (err) {
      clearTimeout(warmupTimer.current)
      // Drop the cached connection so the next attempt reconnects fresh.
      clientPromise = null
      setError(err?.message || 'Something went wrong while contacting the model.')
      setStatus('error')
    }
  }

  const isLoading = status === 'connecting' || status === 'warming'

  const htmlFallback = Array.isArray(resultData) ? resultData[0] : undefined
  const structured = Array.isArray(resultData) ? resultData[1] : undefined
  const hasStructured =
    structured !== null && typeof structured === 'object' && !Array.isArray(structured)

  return (
    <section id="live-demo" className="section model-predictor">
      <h2>Try the Model</h2>
      <p>
        Paste Solidity source code below and run it through our live
        reentrancy-detection model, hosted on Hugging Face Spaces.
      </p>

      <div className="predictor-panel">
        <textarea
          className="code-input"
          value={sourceCode}
          onChange={(event) => setSourceCode(event.target.value)}
          spellCheck={false}
          rows={14}
          aria-label="Solidity source code"
        />

        <div className="predictor-controls">
          <button
            type="button"
            className="cta-button"
            onClick={runScan}
            disabled={isLoading}
          >
            {isLoading ? 'Scanning…' : 'Run Security Scan'}
          </button>

          {status === 'connecting' && (
            <p className="predictor-status">Connecting to the model…</p>
          )}
          {status === 'warming' && (
            <p className="predictor-status warming">
              This is a free Hugging Face Space, so it sleeps when idle — it
              can take 30-60s to wake up. Your scan is still running, hang
              tight.
            </p>
          )}
          {status === 'error' && (
            <p className="predictor-status error">
              {error} Please try again in a moment.
            </p>
          )}
        </div>

        {resultData !== null && (
          <div className="predictor-result">
            <h3>Analysis Result</h3>

            {hasStructured ? (
              <div className="analysis">
                <div className={`risk-card severity-${severityClass(structured.risk_level)}`}>
                  <div className="risk-score-block">
                    <span className="risk-score-number">{structured.risk_score}</span>
                    <span className="risk-score-max">/100</span>
                  </div>

                  <div className="risk-meta">
                    <span className={`badge badge-${severityClass(structured.risk_level)}`}>
                      {structured.risk_level} RISK
                    </span>
                    {typeof structured.model_confidence_pct === 'number' && (
                      <span className="risk-stat">
                        Model confidence: {structured.model_confidence_pct}%
                      </span>
                    )}
                    {typeof structured.reentrancy_probability_pct === 'number' && (
                      <span className="risk-stat">
                        Reentrancy probability: {structured.reentrancy_probability_pct}%
                      </span>
                    )}
                    {typeof structured.external_calls === 'number' && (
                      <span className="risk-stat">
                        External calls: {structured.external_calls}
                      </span>
                    )}
                    {typeof structured.reentrancy_guard_present === 'boolean' && (
                      <span className="risk-stat">
                        Reentrancy guard:{' '}
                        {structured.reentrancy_guard_present ? 'Present' : 'Not present'}
                      </span>
                    )}
                  </div>

                  {structured.counts && (
                    <div className="count-badges">
                      <span className="count-badge severity-critical">
                        {structured.counts.critical ?? 0} Critical
                      </span>
                      <span className="count-badge severity-high">
                        {structured.counts.high ?? 0} High
                      </span>
                      <span className="count-badge severity-medium">
                        {structured.counts.medium ?? 0} Medium
                      </span>
                    </div>
                  )}
                </div>

                {Array.isArray(structured.findings) && structured.findings.length > 0 && (
                  <div className="analysis-block">
                    <h4>Findings</h4>
                    <div className="card-list">
                      {structured.findings.map((finding, index) => (
                        <div
                          className={`finding-card severity-${severityClass(finding.severity)}`}
                          key={index}
                        >
                          <div className="card-header">
                            <span className={`badge badge-${severityClass(finding.severity)}`}>
                              {finding.severity}
                            </span>
                            <span className="card-title">{finding.title}</span>
                          </div>
                          <p className="card-detail">{finding.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(structured.recommendations) &&
                  structured.recommendations.length > 0 && (
                    <div className="analysis-block">
                      <h4>Recommendations</h4>
                      <div className="card-list">
                        {structured.recommendations.map((rec, index) => (
                          <div
                            className={`finding-card severity-${severityClass(rec.priority)}`}
                            key={index}
                          >
                            <div className="card-header">
                              <span className={`badge badge-${severityClass(rec.priority)}`}>
                                {rec.priority}
                              </span>
                              <span className="card-title">{rec.title}</span>
                            </div>
                            <p className="card-detail">{rec.description}</p>
                            {rec.code && (
                              <pre className="fix-code">
                                <code>{rec.code}</code>
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : htmlFallback ? (
              <div
                className="analysis-html-fallback"
                dangerouslySetInnerHTML={{ __html: String(htmlFallback) }}
              />
            ) : (
              <p className="predictor-status">No result data was returned.</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default ModelPredictor
