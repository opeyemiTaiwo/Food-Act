import { useState } from 'react'
import './App.css'

const services = [
  {
    title: 'Market Expansion',
    description:
      'Identify and enter new markets with data-driven strategies tailored to your growth stage.',
  },
  {
    title: 'Strategic Partnerships',
    description:
      'Build alliances that open doors, share risk, and accelerate your path to scale.',
  },
  {
    title: 'Sales Growth',
    description:
      'Optimize your pipeline and sales process to convert more opportunities into revenue.',
  },
  {
    title: 'Business Consulting',
    description:
      'Get hands-on guidance on positioning, pricing, and operations from experienced advisors.',
  },
]

const caseStudies = [
  {
    client: 'Northwind Retail Group',
    result: '+38% Revenue in 12 Months',
    description:
      'Repositioned a regional retailer for national expansion through new distribution partnerships.',
  },
  {
    client: 'Bluepeak Logistics',
    result: '3 New Markets Entered',
    description:
      'Guided market-entry strategy and local partnerships across three new regions in under a year.',
  },
  {
    client: 'Solace Health Tech',
    result: '2x Sales Pipeline',
    description:
      'Rebuilt the sales process and outreach strategy, doubling qualified pipeline in two quarters.',
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
            Vantage Growth Partners
          </a>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#services" onClick={closeMenu}>Services</a>
            <a href="#case-studies" onClick={closeMenu}>Case Studies</a>
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
          <h1>Grow Your Business With Confidence</h1>
          <p>
            We help ambitious companies unlock new markets, forge strategic
            partnerships, and scale revenue sustainably.
          </p>
          <a href="#contact" className="cta-button">Get in Touch</a>
        </section>

        <section id="about" className="section about">
          <h2>About Us</h2>
          <p>
            We're a business development consultancy focused on helping
            growth-stage companies expand into new markets, build lasting
            partnerships, and turn strategy into measurable revenue.
          </p>
          <div className="stats">
            <div className="stat">
              <span className="stat-number">120+</span>
              <span className="stat-label">Clients Served</span>
            </div>
            <div className="stat">
              <span className="stat-number">15</span>
              <span className="stat-label">Years Experience</span>
            </div>
            <div className="stat">
              <span className="stat-number">$50M+</span>
              <span className="stat-label">Revenue Generated</span>
            </div>
          </div>
        </section>

        <section id="services" className="section services">
          <h2>Our Services</h2>
          <div className="grid">
            {services.map((service) => (
              <div className="card" key={service.title}>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="case-studies" className="section case-studies">
          <h2>Case Studies</h2>
          <div className="grid">
            {caseStudies.map((study) => (
              <div className="card" key={study.client}>
                <h3>{study.client}</h3>
                <p className="result">{study.result}</p>
                <p>{study.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="section contact">
          <h2>Let's Talk</h2>
          <p>
            Ready to take the next step? Reach out and we'll get back to you
            within one business day.
          </p>
          <div className="contact-links">
            <a href="mailto:hello@vantagegrowth.com">hello@vantagegrowth.com</a>
            <a href="tel:+10000000000">+1 (000) 000-0000</a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Vantage Growth Partners. All rights reserved.</p>
      </footer>
    </>
  )
}

export default App
