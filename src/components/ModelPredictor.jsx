import { useEffect, useRef, useState } from 'react'
import { Client } from '@gradio/client'
import './ModelPredictor.css'

const SPACE_URL = 'https://opethaiwoh-vun-smt.hf.space'
const ENDPOINT = '/predict_reentrancy'
const WARMUP_DELAY_MS = 4000

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

function ModelPredictor() {
  const [sourceCode, setSourceCode] = useState(SAMPLE_CONTRACT)
  const [status, setStatus] = useState('idle') // idle | connecting | warming | success | error
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const warmupTimer = useRef(null)

  useEffect(() => () => clearTimeout(warmupTimer.current), [])

  const runScan = async () => {
    clearTimeout(warmupTimer.current)
    setStatus('connecting')
    setError(null)
    setResult(null)

    warmupTimer.current = setTimeout(() => {
      setStatus((current) => (current === 'connecting' ? 'warming' : current))
    }, WARMUP_DELAY_MS)

    try {
      const client = await getClient()
      const response = await client.predict(ENDPOINT, { source_code: sourceCode })
      clearTimeout(warmupTimer.current)
      setResult(response.data[0])
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
  const isPlainObject =
    result !== null && typeof result === 'object' && !Array.isArray(result)

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

        {result !== null && (
          <div className="predictor-result">
            <h3>Analysis Result</h3>

            {isPlainObject ? (
              <div className="result-list">
                {Object.entries(result).map(([key, value], index) => {
                  const isDivider = value === ''
                  const isBlankKey = key.trim() === ''
                  if (isDivider && isBlankKey) return null
                  if (isDivider) {
                    return (
                      <p className="result-heading" key={index}>
                        {key}
                      </p>
                    )
                  }
                  return (
                    <div className="result-row" key={index}>
                      <span className="result-key">{key}</span>
                      <span className="result-value">{String(value)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <pre className="raw-json-fallback">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}

            {isPlainObject && (
              <details className="raw-json">
                <summary>View raw JSON</summary>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </details>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default ModelPredictor
