import { useState } from 'react'
import ModelPredictor from './components/ModelPredictor'
import './App.css'

const steps = [
  {
    title: 'Submit Your Contract',
    description:
      'Share your repository or contract files through our secure intake process.',
  },
  {
    title: 'Automated Scanning',
    description:
      'Static and dynamic analysis tools flag known vulnerability patterns and gas inefficiencies.',
  },
  {
    title: 'Manual Expert Review',
    description:
      'Senior auditors trace logic paths and economic assumptions the tools can miss.',
  },
  {
    title: 'Report & Remediation',
    description:
      'Receive a detailed findings report and work with us to verify every fix.',
  },
]

const features = [
  {
    title: 'Vulnerability Scanning',
    description:
      'Automated detection of reentrancy, overflow, access control, and other common exploit vectors.',
  },
  {
    title: 'Manual Code Review',
    description:
      'Line-by-line review from engineers who have audited protocols securing billions in TVL.',
  },
  {
    title: 'Gas Optimization',
    description:
      'Identify costly patterns and recommend optimizations without compromising safety.',
  },
  {
    title: 'Detailed Reporting',
    description:
      'Clear, actionable reports ranked by severity, with reproduction steps and fixes.',
  },
  {
    title: 'Multi-Chain Support',
    description:
      'Audits across EVM chains and beyond, tailored to each chain’s quirks and tooling.',
  },
  {
    title: 'Continuous Monitoring',
    description:
      'Ongoing on-chain monitoring to catch anomalies after deployment, not just before.',
  },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <a href="#home" className="logo" onClick={closeMenu}>
            Ironclad Audits
          </a>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
            <a href="#features" onClick={closeMenu}>Features</a>
            <a href="#live-demo" onClick={closeMenu}>Live Demo</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
          </nav>

          <button
            type="button"
            className={`hamburger ${menuOpen ? 'active' : ''}`}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <main>
        <section id="home" className="section hero">
          <h1>Smart Contract Security You Can Trust</h1>
          <p>
            We help protocols ship with confidence through rigorous audits,
            automated scanning, and continuous on-chain monitoring.
          </p>
          <a href="#contact" className="cta-button">Request an Audit</a>
        </section>

        <section id="about" className="section about">
          <h2>About Us</h2>
          <p>
            Ironclad Audits is a team of security engineers and smart
            contract developers dedicated to protecting Web3 protocols from
            exploits. We combine automated tooling with deep manual review to
            catch what others miss.
          </p>
          <div className="stats">
            <div className="stat">
              <span className="stat-number">200+</span>
              <span className="stat-label">Contracts Audited</span>
            </div>
            <div className="stat">
              <span className="stat-number">$2B+</span>
              <span className="stat-label">Value Secured</span>
            </div>
            <div className="stat">
              <span className="stat-number">0</span>
              <span className="stat-label">Missed Critical Bugs</span>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section how-it-works">
          <h2>How It Works</h2>
          <div className="steps">
            {steps.map((step, index) => (
              <div className="step" key={step.title}>
                <div className="step-number">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="section features">
          <h2>Features</h2>
          <div className="grid">
            {features.map((feature) => (
              <div className="card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <ModelPredictor />

        <section id="contact" className="section contact">
          <h2>Secure Your Protocol</h2>
          <p>
            Ready to get audited? Reach out and we'll schedule a scoping call
            within one business day.
          </p>
          <div className="contact-links">
            <a href="mailto:hello@ironcladaudits.io">hello@ironcladaudits.io</a>
            <a href="tel:+10000000000">+1 (000) 000-0000</a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Ironclad Audits. All rights reserved.</p>
      </footer>
    </>
  )
}

export default App
