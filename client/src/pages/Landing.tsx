import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ShieldAlert, BookOpen, Edit3, ArrowRight, Check, ChevronDown, Instagram, Facebook, Linkedin, ArrowUpRight } from 'lucide-react'
import s from './Landing.module.css'

const faqData = [
  {
    question: 'What types of contracts are supported?',
    answer: 'We support PDF, DOCX, and scanned document formats for ingestion and analysis across MSAs, NDAs, SOWs, and custom agreements.'
  },
  {
    question: 'How secure is my contract data?',
    answer: 'All data is encrypted in transit and at rest. We run on private SOC 2 compliant database instances with zero external LLM training usage.'
  },
  {
    question: 'Can I customize audit guidelines?',
    answer: 'Yes, you can upload your corporate legal playbook to define custom compliance rules, severity triggers, and preferred fallback clauses.'
  },
  {
    question: 'How are milestones and dates tracked?',
    answer: 'Our AI automatically extracts expiration dates, renewals, and payment milestones, syncing them directly with automated email and Slack alerts.'
  },
  {
    question: 'Does it integrate with other CLMs?',
    answer: 'Yes, ClauseGuard integrates via secure REST APIs with popular platforms like Salesforce, HubSpot, DocuSign, and corporate email clients.'
  }
]

export default function Landing() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const [activeTab, setActiveTab] = useState('in-house legal')
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    goal: '',
    notes: ''
  })

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Demo requested successfully for ${formState.name} (${formState.email}) under the ${activeTab} track!`)
    setFormState({
      name: '',
      email: '',
      goal: '',
      notes: ''
    })
  }

  const [activePillar, setActivePillar] = useState('audit')
  const [activeStep, setActiveStep] = useState(0)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const handlePillarChange = (pillarId: string) => {
    setActivePillar(pillarId)
    setActiveStep(0)
  }

  const pillarsData = [
    {
      id: 'audit',
      label: 'Risk Audit',
      title: 'Audit Process',
      subtitle: 'Identify and resolve liabilities instantly',
      steps: [
        {
          num: '01',
          title: 'Document Intake',
          description: 'Upload your contract PDF or Word documents directly into our secure ingestion workspace.',
          image: '/images/audit_step1.jpg'
        },
        {
          num: '02',
          title: 'AI Semantic Chunking',
          description: 'Our engine extracts the text and runs deep semantic searches to index sections without token window loss.',
          image: '/images/audit_step2.jpg'
        },
        {
          num: '03',
          title: 'Risk Evaluation & Scoring',
          description: 'Evaluate provisions against standardized severity metrics, classifying flags as high, medium, or low risk.',
          image: '/images/audit_step3.jpg'
        },
        {
          num: '04',
          title: 'Obligation Logging',
          description: 'Sync important milestones, deadlines, and tracking obligations automatically into the Scheduler Service.',
          image: '/images/audit_step4.jpg'
        }
      ]
    },
    {
      id: 'playbooks',
      label: 'Playbooks',
      title: 'Compliance Audits',
      subtitle: 'Enforce corporate guidelines systematically',
      steps: [
        {
          num: '01',
          title: 'Guideline Definition',
          description: 'Upload your custom legal handbook guidelines and set playbook compliance rules.',
          image: '/images/playbook_step1.jpg'
        },
        {
          num: '02',
          title: 'Repository Matching',
          description: 'Scan contract indexes to match current agreements against historical liability exclusions.',
          image: '/images/playbook_step2.jpg'
        },
        {
          num: '03',
          title: 'Stripe Plan Upgrades',
          description: 'Select subscription levels to increase limits, unlocking deep cross-document vector query contexts.',
          image: '/images/playbook_step3.jpg'
        },
        {
          num: '04',
          title: 'Analytics Dashboard',
          description: 'Track aggregate risk trends and review system evaluation accuracy benchmarks in real-time.',
          image: '/images/playbook_step4.jpg'
        }
      ]
    },
    {
      id: 'redlining',
      label: 'Redlining',
      title: 'Redlining & Suggestions',
      subtitle: 'Generate context-aware AI alternatives',
      steps: [
        {
          num: '01',
          title: 'MSA & SOW Cross-Check',
          description: 'Index multiple contract streams to cross-reference conflicting obligations or overlapping terms.',
          image: '/images/redline_step1.jpg'
        },
        {
          num: '02',
          title: 'Conflict Localization',
          description: 'Isolate mismatched timelines or contradictory provisions side-by-side on the page.',
          image: '/images/redline_step2.jpg'
        },
        {
          num: '03',
          title: 'AI Suggester Redlines',
          description: 'Generate legally sound clause alternatives instantly, redlining text with full contextual groundings.',
          image: '/images/redline_step3.jpg'
        },
        {
          num: '04',
          title: 'Final Document Sync',
          description: 'Export clean Word or PDF files containing the approved redline revisions to your team.',
          image: '/images/redline_step4.jpg'
        }
      ]
    }
  ]

  const currentPillar = pillarsData.find(p => p.id === activePillar) || pillarsData[0]
  const currentStep = currentPillar.steps[activeStep]

  const panels = [
    {
      id: 0,
      title: 'Risk Audit',
      subtitle: 'AI-POWERED ANALYSIS',
      description: 'Automatically scan and identify liabilities, indemnities, and high-risk terms within any agreement.',
      bgImage: '/risk_audit.jpg',
      icon: <ShieldAlert className={s.panelIcon} />,
      link: isAuthenticated ? '/dashboard' : '/register'
    },
    {
      id: 1,
      title: 'Playbooks',
      subtitle: 'COMPLIANCE AUDITS',
      description: 'Instantly cross-check clause compliance against your custom playbook rules and corporate guidelines.',
      bgImage: '/playbooks.jpg',
      icon: <BookOpen className={s.panelIcon} />,
      link: isAuthenticated ? '/dashboard' : '/register'
    },
    {
      id: 2,
      title: 'Redlining',
      subtitle: 'BESPOKE ALTERNATIVES',
      description: 'Draft precise clause modifications and generate legal alternative options in seconds with context-aware AI.',
      bgImage: '/redlining.jpg',
      icon: <Edit3 className={s.panelIcon} />,
      link: isAuthenticated ? '/dashboard' : '/register'
    }
  ]

  return (
    <div className={s.wrapper}>
      {/* 1. TRANSLUCENT PREMIUM HEADER */}
      <header className={s.header}>
        <div className={s.logo} onClick={() => navigate('/')}>
          <div className={s.logoMain}>
            <span className={s.logoClause}>clause</span>
            <span className={s.logoGuard}>guard</span>
          </div>
          <span className={s.logoTagline}>Risk Audit &nbsp;|&nbsp; Compliance &nbsp;|&nbsp; Redlining</span>
        </div>
        <div className={s.authActions}>
          {isAuthenticated ? (
            <button className={s.btnPrimary} onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className={s.linkSignIn}>Sign In</Link>
              <Link to="/register" className={s.btnPrimary}>Request Access</Link>
            </>
          )}
        </div>
      </header>

      {/* 2. SPLIT HORIZONTAL EXPANDING PANELS */}
      <main className={s.splitContainer}>
        {panels.map((panel, index) => {
          const isHovered = hoveredIndex === index
          return (
            <div
              key={panel.id}
              className={`${s.panel} ${isHovered ? s.panelActive : ''} ${hoveredIndex !== null && !isHovered ? s.panelInactive : ''}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => navigate(panel.link)}
            >
              {/* Background Image Layer */}
              <div 
                className={s.panelBg}
                style={{ backgroundImage: `url(${import.meta.env.BASE_URL}${panel.bgImage.startsWith('/') ? panel.bgImage.slice(1) : panel.bgImage})` }}
              />
              
              {/* Overlay Layer for Vignette and Dimming */}
              <div className={s.panelOverlay} />

              {/* Panel Content */}
              <div className={s.panelContent}>
                <div className={s.iconCircle}>
                  {panel.icon}
                </div>
                
                <span className={s.panelSubtitle}>{panel.subtitle}</span>
                <h2 className={s.panelTitle}>{panel.title}</h2>
                
                <p className={s.panelDescription}>
                  {panel.description}
                </p>

                <div className={s.panelCTA}>
                  <span>Explore Feature</span>
                  <ArrowRight className={s.ctaArrow} />
                </div>
              </div>
            </div>
          )
        })}
      </main>

      {/* 3. ENTERPRISE LEAD CAPTURE & DEMO REQUEST */}
      <section className={s.leadSection}>
        <div className={s.leadGrid}>
          {/* Left Column: Value Pitch & Trust Markers */}
          <div className={s.pitchColumn}>
            <h2 className={s.pitchTitle}>
              Ready to secure your <br />
              <span className={s.pitchSerif}>contract ecosystem?</span>
            </h2>
            <p className={s.pitchText}>
              From initial intake to post-signature compliance auditing, ClauseGuard streamlines your entire legal workflow. Try the sandbox now or book a custom pilot program with our legal engineers.
            </p>
            <div className={s.markersGrid}>
              <div className={s.markerItem}>
                <Check className={s.checkIcon} />
                <span className={s.markerText}>99.8% Compliance Accuracy</span>
              </div>
              <div className={s.markerItem}>
                <Check className={s.checkIcon} />
                <span className={s.markerText}>SOC-2 Type II Certified</span>
              </div>
              <div className={s.markerItem}>
                <Check className={s.checkIcon} />
                <span className={s.markerText}>Custom Playbook Training</span>
              </div>
              <div className={s.markerItem}>
                <Check className={s.checkIcon} />
                <span className={s.markerText}>Real-Time AI Redlining</span>
              </div>
            </div>
          </div>

          {/* Right Column: The Interactive Request Card */}
          <div className={s.formColumn}>
            <div className={s.formCard}>
              {/* Segmented Tabs */}
              <div className={s.formTabs}>
                {['in-house legal', 'law firms', 'enterprise'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`${s.tabButton} ${activeTab === tab ? s.tabActive : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className={s.formBody}>
                <h3 className={s.formTitle}>Request Custom Pilot</h3>
                <p className={s.formSubtitle}>Book a legal engineer consultation.</p>

                <form onSubmit={handleFormSubmit} className={s.formFields}>
                  <div className={s.inputGroup}>
                    <label htmlFor="lead-name" className={s.fieldLabel}>Full Name *</label>
                    <input
                      id="lead-name"
                      type="text"
                      required
                      placeholder="Your Name"
                      className={s.formInput}
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    />
                  </div>

                  <div className={s.inputGroup}>
                    <label htmlFor="lead-email" className={s.fieldLabel}>Work Email *</label>
                    <input
                      id="lead-email"
                      type="email"
                      required
                      placeholder="you@company.com"
                      className={s.formInput}
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    />
                  </div>

                  <div className={s.inputGroup}>
                    <label htmlFor="lead-goal" className={s.fieldLabel}>Primary Goal *</label>
                    <select
                      id="lead-goal"
                      required
                      className={s.formSelect}
                      value={formState.goal}
                      onChange={(e) => setFormState({ ...formState, goal: e.target.value })}
                    >
                      <option value="">Select Primary Goal</option>
                      <option value="contract-auditing">Contract Auditing</option>
                      <option value="playbook-alignment">Playbook Alignment</option>
                      <option value="ai-redlining">AI Redlining</option>
                      <option value="api-integration">API Integration</option>
                    </select>
                  </div>

                  <div className={s.inputGroup}>
                    <label htmlFor="lead-notes" className={s.fieldLabel}>Message (Optional)</label>
                    <textarea
                      id="lead-notes"
                      placeholder="Any specific regulatory requirements..."
                      className={s.formTextarea}
                      value={formState.notes}
                      onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    />
                  </div>

                  <button type="submit" className={s.formSubmitBtn}>
                    Request Sandbox Access
                  </button>
                </form>

                <p className={s.formPrivacy}>
                  By submitting, you agree to our privacy policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INFINITE SLIDING TICKER MARQUEE */}
      <div className={s.tickerContainer}>
        <div className={s.tickerTrack}>
          {/* First copy */}
          <div className={s.tickerGroup}>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> 99.8% Compliance Audit Accuracy</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> SOC-2 Type II Certified Enterprise Security</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> Trusted by 5,000+ In-House Corporate Counsels</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> Real-Time Generative AI Clause Redlining</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> GDPR & CCPA Regulatory Compliance Safeguards</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> 24/7 Enterprise Service-Level Agreements (SLA)</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> Automated Custom Playbook Evaluations</span>
          </div>
          {/* Second copy for seamless wrapping */}
          <div className={s.tickerGroup}>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> 99.8% Compliance Audit Accuracy</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> SOC-2 Type II Certified Enterprise Security</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> Trusted by 5,000+ In-House Corporate Counsels</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> Real-Time Generative AI Clause Redlining</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> GDPR & CCPA Regulatory Compliance Safeguards</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> 24/7 Enterprise Service-Level Agreements (SLA)</span>
            <span className={s.tickerItemText}><span className={s.tickerBullet}>&bull;</span> Automated Custom Playbook Evaluations</span>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE PROCESS SHOWCASE SECTION */}
      <section className={s.processSection}>
        <div className={s.processHeader}>
          <span className={s.processTag}>how it works</span>
          <h2 className={s.processTitle}>One Platform. Three Pillars.</h2>
          
          {/* Pillar Selector Tabs */}
          <div className={s.pillarSelector}>
            {pillarsData.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${s.pillarBtn} ${activePillar === p.id ? s.pillarBtnActive : ''}`}
                onClick={() => handlePillarChange(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className={s.processGrid}>
          {/* Left Column: Interactive Product Screenshot */}
          <div className={s.processVisual}>
            <div className={s.screenshotContainer}>
              <img
                src={`${import.meta.env.BASE_URL}${currentStep.image.startsWith('/') ? currentStep.image.slice(1) : currentStep.image}`}
                alt={currentStep.title}
                className={s.screenshotImg}
                key={`${activePillar}-${activeStep}`} // forces transition on update
              />
              <div className={s.screenshotLabel}>
                <span className={s.labelNum}>{currentStep.num}</span>
                <span className={s.labelTitle}>{currentStep.title}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Step Accordion List */}
          <div className={s.processSteps}>
            <div className={s.stepsList}>
              {currentPillar.steps.map((step, idx) => {
                const isActive = activeStep === idx
                return (
                  <div
                    key={step.num}
                    className={`${s.processStepItem} ${isActive ? s.stepItemActive : ''}`}
                    onClick={() => setActiveStep(idx)}
                  >
                    <div className={s.stepHeader}>
                      <span className={s.stepNum}>{step.num}</span>
                      <h4 className={s.stepTitle}>{step.title}</h4>
                    </div>
                    
                    {/* Collapsible details */}
                    <div className={s.stepDetails}>
                      <p className={s.stepDescription}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Explore Button */}
            <div className={s.processAction}>
              <Link 
                to={isAuthenticated ? '/dashboard' : '/register'}
                className={s.processCTA}
              >
                Explore Pilot Environment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION SECTION */}
      <section className={s.faqSection}>
        <div className={s.faqHeaderContainer}>
          <span className={s.faqTag}>faq</span>
          <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
        </div>

        <div className={s.faqList}>
          {faqData.map((item, idx) => {
            const isExpanded = expandedFaq === idx
            return (
              <div 
                key={idx} 
                className={`${s.faqItem} ${isExpanded ? s.faqItemActive : ''}`}
                onClick={() => setExpandedFaq(isExpanded ? null : idx)}
              >
                <div className={s.faqRow}>
                  <h4 className={s.faqQuestion}>{item.question}</h4>
                  <ChevronDown className={`${s.faqChevron} ${isExpanded ? s.faqChevronExpanded : ''}`} />
                </div>
                
                <div className={s.faqAnswerContainer}>
                  <p className={s.faqAnswer}>
                    {item.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 7. BOTTOM CTA BANNER */}
      <section className={s.ctaBanner}>
        <h2 className={s.bannerTitle}>Ready to secure your contract ecosystem?</h2>
        <div className={s.bannerActions}>
          <Link to={isAuthenticated ? '/dashboard' : '/register'} className={s.bannerBtnPrimary}>
            Get Started Now
          </Link>
          <a href="#demo" className={s.bannerBtnSecondary}>
            Schedule Consultation
          </a>
        </div>
      </section>

      {/* 8. MULTI-COLUMN FOOTER */}
      <footer className={s.footerContainer}>
        <div className={s.footerGrid}>
          {/* Column 1: Logo & Tagline */}
          <div className={s.footerCol}>
            <div className={s.footerLogo}>
              <span className={s.logoBold}>clause</span>
              <span className={s.logoThin}>guard</span>
              <div className={s.footerTagline}>Risk Audit &bull; Compliance &bull; Redlining</div>
            </div>
            <p className={s.footerDesc}>
              We secure B2B contract ecosystems to mitigate operational risk. From document intake to execution, we are your partners in securing the future.
            </p>
            <div className={s.footerSocials}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={s.socialIcon}>
                <Instagram size={18} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={s.socialIcon}>
                <Facebook size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={s.socialIcon}>
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Services */}
          <div className={s.footerCol}>
            <h4 className={s.footerColTitle}>Services</h4>
            <div className={s.footerLinksList}>
              <a href="#services" className={s.footerLink}>Risk Audit</a>
              <a href="#services" className={s.footerLink}>Compliance Playbooks</a>
              <a href="#services" className={s.footerLink}>Clause Redlining</a>
              <a href="#services" className={s.footerLink}>Milestone Scheduling</a>
            </div>
          </div>

          {/* Column 3: Company */}
          <div className={s.footerCol}>
            <h4 className={s.footerColTitle}>Company</h4>
            <div className={s.footerLinksList}>
              <a href="#company" className={s.footerLink}>About Us</a>
              <a href="#company" className={s.footerLink}>Features</a>
              <a href="#company" className={s.footerLink}>Process Workflow</a>
              <a href="#company" className={s.footerLink}>Pricing Tiers</a>
              <a href="#company" className={s.footerLink}>Contact Sales</a>
            </div>
          </div>

          {/* Column 4: Contact & Access */}
          <div className={s.footerCol}>
            <h4 className={s.footerColTitle}>Contact</h4>
            <div className={s.footerLinksList}>
              <span className={s.contactInfo}>
                ClauseGuard HQ, 44 Wall Street, 12th Floor, New York, NY 10005
              </span>
              <a href="mailto:contact@clauseguard.ai" className={s.footerContactLink}>
                contact@clauseguard.ai
              </a>
              <span className={s.contactInfo}>
                +1 (800) 555-0199
              </span>
            </div>
            
            <div className={s.footerActionBtn}>
              <button className={s.apiAccessBtn}>
                Request API Access
              </button>
            </div>
            
            <div className={s.footerUnderlineLink}>
              <Link to={isAuthenticated ? '/dashboard' : '/register'} className={s.underlineLink}>
                Explore Pilot Environment <ArrowUpRight size={14} className={s.arrowUpRight} />
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright Row */}
        <div className={s.footerBottom}>
          <span className={s.footerCopyrightText}>&copy; 2026 ClauseGuard. All rights reserved.</span>
          <div className={s.footerLegalLinks}>
            <a href="#privacy" className={s.legalLink}>Privacy Policy</a>
            <a href="#terms" className={s.legalLink}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

