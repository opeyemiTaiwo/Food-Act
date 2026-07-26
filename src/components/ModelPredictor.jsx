import React, { useState } from "react";
import { Client } from "@gradio/client";

// Your deployed Space
const SPACE = "opethaiwoh/vun-smt";

const SEV = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#3b82f6" };

const SAMPLE = `pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint) public balances;
    function deposit() public payable { balances[msg.sender] += msg.value; }
    function withdraw(uint _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        (bool sent, ) = msg.sender.call{value: _amount}("");   // external call first
        require(sent, "Failed to send Ether");
        balances[msg.sender] -= _amount;                        // state change AFTER
    }
}`;

export default function ModelPredictor() {
  const [code, setCode] = useState(SAMPLE);
  const [status, setStatus] = useState("idle");   // idle | loading | warming | done | error
  const [data, setData] = useState(null);         // structured JSON
  const [rawHtml, setRawHtml] = useState(null);   // fallback HTML string
  const [error, setError] = useState("");

  async function runScan() {
    setStatus("loading"); setError(""); setData(null); setRawHtml(null);
    const warm = setTimeout(() => setStatus("warming"), 4000); // free Spaces cold-start
    try {
      const app = await Client.connect(SPACE);
      const res = await app.predict("/predict_reentrancy", [code]);
      clearTimeout(warm);
      // /predict_reentrancy returns [dashboard_html, structured_json]
      const arr = Array.isArray(res?.data) ? res.data : [res?.data];
      const structured = arr.find((x) => x && typeof x === "object" && "risk_score" in x);
      const htmlStr = arr.find((x) => typeof x === "string" && x.includes("<div"));
      if (structured) { setData(structured); setStatus("done"); }
      else if (htmlStr) { setRawHtml(htmlStr); setStatus("done"); }   // fallback
      else { setError("Unexpected response from the model."); setStatus("error"); }
    } catch (e) {
      clearTimeout(warm);
      setError(e?.message ? String(e.message) : String(e));
      setStatus("error");
    }
  }

  const riskColor = (lvl) => (lvl === "HIGH" ? "#ef4444" : lvl === "MEDIUM" ? "#f59e0b" : "#22c55e");

  return (
    <section id="live-demo" style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px", color: "#e5e7eb" }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Live Demo</h2>
      <p style={{ color: "#9ca3af", marginBottom: 16 }}>
        Paste a Solidity contract and run it against the AI model (Random Forest + rule checks).
      </p>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        style={{
          width: "100%", minHeight: 220, fontFamily: "ui-monospace,Menlo,monospace",
          fontSize: 13, background: "#0b1220", color: "#e5e7eb", border: "1px solid #334155",
          borderRadius: 10, padding: 14, resize: "vertical",
        }}
      />

      <button
        onClick={runScan}
        disabled={status === "loading" || status === "warming"}
        style={{
          marginTop: 12, padding: "12px 22px", borderRadius: 10, border: "none",
          fontWeight: 700, fontSize: 15, cursor: "pointer",
          background: "#a78bfa", color: "#1f1147",
          opacity: status === "loading" || status === "warming" ? 0.7 : 1,
        }}
      >
        {status === "loading" ? "Analyzing…" : status === "warming" ? "Waking the model… (~30–60s)" : "Run Security Scan"}
      </button>

      <h3 style={{ fontSize: 20, fontWeight: 700, margin: "24px 0 12px" }}>Analysis Result</h3>

      {status === "idle" && <p style={{ color: "#6b7280" }}>Run a scan to see results.</p>}
      {status === "error" && (
        <div style={{ background: "#3f1d1d", border: "1px solid #7f1d1d", borderRadius: 10, padding: 14, color: "#fca5a5" }}>
          ⚠️ {error}
        </div>
      )}
      {(status === "loading" || status === "warming") && (
        <div style={{ background: "#111827", border: "1px solid #374151", borderRadius: 10, padding: 14, color: "#9ca3af" }}>
          {status === "warming" ? "The Space was asleep and is starting up. This first run can take up to a minute…" : "Running the model…"}
        </div>
      )}

      {/* Preferred: render our own themed cards from the structured JSON */}
      {status === "done" && data && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>AI Security Analysis</div>
            <div style={{ background: riskColor(data.risk_level), color: "#0b1220", padding: "8px 16px", borderRadius: 10, fontWeight: 800 }}>
              Risk Score: {data.risk_score}/100 · {data.risk_level} RISK
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
            <Metric label="Critical" value={data.counts?.critical ?? 0} color="#ef4444" />
            <Metric label="High" value={data.counts?.high ?? 0} color="#f97316" />
            <Metric label="Medium" value={data.counts?.medium ?? 0} color="#eab308" />
            <Metric label="Model Confidence" value={`${data.model_confidence_pct ?? 0}%`} color="#3b82f6" />
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, margin: "8px 0" }}>🔍 Findings</div>
          {(data.findings || []).length === 0 && <p style={{ color: "#22c55e" }}>✅ No obvious vulnerability patterns detected.</p>}
          {(data.findings || []).map((f, i) => (
            <div key={i} style={{ background: "#111827", border: "1px solid #374151", borderLeft: `5px solid ${SEV[f.severity] || "#64748b"}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <b>{f.title}</b>
                <span style={{ background: SEV[f.severity], color: "#0b1220", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800 }}>{f.severity}</span>
              </div>
              <div style={{ color: "#9ca3af", fontSize: 14, marginTop: 6 }}>{f.detail}</div>
            </div>
          ))}

          <div style={{ fontSize: 16, fontWeight: 700, margin: "18px 0 8px" }}>💡 Recommendations</div>
          {(data.recommendations || []).map((r, i) => (
            <div key={i} style={{ background: "#0f1a13", border: "1px solid #14532d", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <b>{r.title}</b>
                <span style={{ background: SEV[r.priority] || "#3b82f6", color: "#0b1220", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800 }}>{r.priority}</span>
              </div>
              <div style={{ color: "#cbd5e1", fontSize: 14, margin: "6px 0 8px" }}>{r.description}</div>
              <pre style={{ background: "#0b1220", color: "#a7f3d0", padding: 12, borderRadius: 8, overflowX: "auto", fontSize: 13, margin: 0 }}><code>{r.code}</code></pre>
            </div>
          ))}
        </div>
      )}

      {/* Fallback: Space still returns only HTML -> render it (not as text) */}
      {status === "done" && !data && rawHtml && (
        <div style={{ background: "#fff", borderRadius: 10, padding: 14 }} dangerouslySetInnerHTML={{ __html: rawHtml }} />
      )}
    </section>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ background: "#111827", border: "1px solid #374151", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ color, fontWeight: 700, fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#f9fafb", marginTop: 2 }}>{value}</div>
    </div>
  );
}