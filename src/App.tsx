import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { searchHimalayasJobs } from './services/himalayasJobs'
import type {
  HimalayasJob,
  HimalayasSearchOptions,
} from './services/himalayasJobs'
import { extractResumeText } from './services/resumeText'
import { compareResumeWithJob } from './services/resumeMatcher'
import './App.css'

type IconName =
  | 'dashboard'
  | 'search'
  | 'resume'
  | 'tracker'
  | 'briefcase'
  | 'bookmark'
  | 'send'
  | 'calendar'
  | 'upload'
  | 'location'
  | 'chevron'
  | 'bell'
  | 'spark'
  | 'filter'
  | 'compass'
  | 'menu'

const skillTerms = [
  // Product Management
  'product management',
  'product analysis',
  'product strategy',
  'product development',
  'product roadmap',
  'product discovery',
  'user stories',
  'acceptance criteria',
  'requirements gathering',
  'stakeholder management',
  'backlog management',
  'agile',
  'scrum',

  // Business Analysis
  'business analysis',
  'business analyst',
  'gap analysis',
  'process improvement',
  'workflow analysis',
  'functional requirements',
  'documentation',
  'use cases',

  // Design and collaboration
  'Figma',
  'wireframing',
  'prototyping',
  'UI/UX',
  'user experience',
  'user research',
  'Jira',
  'Confluence',

  // Data and technical skills
  'SQL',
  'Excel',
  'Power BI',
  'Tableau',
  'Python',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'AWS',
  'Docker',
  'Git',
  'GitHub',
  'API',
  'REST API',
  'Postman',
  'JSON',

  // AI skills
  'artificial intelligence',
  'AI',
  'generative AI',
  'prompt engineering',
  'large language models',
  'LLM',
  'machine learning',
  'natural language processing',
  'RAG',

  // Testing and tools
  'software testing',
  'manual testing',
  'test cases',
  'bug reporting',
  'Playwright',
  'Selenium',
  'Azure DevOps',

  // Business and communication
  'communication',
  'project management',
  'data analysis',
  'problem solving',
  'customer relationship management',
  'sales',

]

function findSkills(text: string): string[] {
  return skillTerms.filter((skill) => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z0-9])${escapedSkill}($|[^a-z0-9])`, 'i').test(text)
  })
}

const relevanceStopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in',
  'into', 'is', 'it', 'of', 'on', 'or', 'our', 'the', 'their', 'this',
  'to', 'was', 'were', 'with', 'you', 'your', 'we', 'will', 'have', 'has',
  'had', 'that', 'which', 'who', 'what', 'when', 'where', 'while', 'how',
  'can', 'may', 'must', 'should', 'would', 'ability', 'communication',
  'experience', 'experienced', 'skill', 'skills', 'team', 'work', 'working',
  'role', 'position', 'candidate', 'strong', 'excellent', 'including',
  'required', 'requirements', 'responsibilities',
  'collaborate', 'collaboration', 'collaborative', 'collaborating', 'teamwork',
  'communication', 'communicate', 'communicating', 'communicated',
])

const relatedTerms: Record<string, string> = {
  analysis: 'analyz',
  analyze: 'analyz',
  analyzed: 'analyz',
  analysing: 'analyz',
  analytical: 'analyz',
  analyse: 'analyz',
  assistance: 'assist',
  assisted: 'assist',
  assisting: 'assist',
  built: 'build',
  building: 'build',
  client: 'customer',
  clients: 'customer',
  customers: 'customer',
  customer: 'customer',
  coordination: 'coordinate',
  coordinated: 'coordinate',
  coordinating: 'coordinate',
  created: 'create',
  creating: 'create',
  development: 'develop',
  developed: 'develop',
  developing: 'develop',
  led: 'lead',
  leader: 'lead',
  leadership: 'lead',
  leading: 'lead',
  managed: 'manage',
  management: 'manage',
  manager: 'manage',
  managing: 'manage',
  optimization: 'optimize',
  optimized: 'optimize',
  optimizing: 'optimize',
  sales: 'sell',
  selling: 'sell',
  support: 'support',
  supported: 'support',
  supporting: 'support',
}

function normalizeRelevanceTerm(term: string): string {
  const lowerTerm = term.toLowerCase()
  const relatedTerm = relatedTerms[lowerTerm]
  if (relatedTerm) return relatedTerm
  if (lowerTerm.length > 5 && lowerTerm.endsWith('ing')) {
    return lowerTerm.slice(0, -3).replace(/(.)\1$/, '$1')
  }
  if (lowerTerm.length > 4 && lowerTerm.endsWith('ed')) {
    return lowerTerm.slice(0, -2)
  }
  if (lowerTerm.length > 4 && lowerTerm.endsWith('ies')) {
    return `${lowerTerm.slice(0, -3)}y`
  }
  if (lowerTerm.length > 3 && lowerTerm.endsWith('s') && !lowerTerm.endsWith('ss')) {
    return lowerTerm.slice(0, -1)
  }
  return lowerTerm
}

function getRelevanceTerms(text: string): string[] {
  return (text.match(/[a-z0-9]+(?:[.+#-][a-z0-9+#.-]+)*/gi) ?? [])
    .map(normalizeRelevanceTerm)
    .filter((term) => term.length > 2 && !relevanceStopWords.has(term))
}

function splitResumeSentences(text: string): string[] {
  return [...new Set(text
    .split(/(?<=[.!?])\s+|\r?\n+|[•●▪◦]\s*/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => {
      const words = sentence.match(/\b[\w+#.-]+\b/g) ?? []
      const hasSentencePunctuation = /[.!?]$/.test(sentence)
      const commaCount = (sentence.match(/,/g) ?? []).length
      const hasExperienceVerb = /\b(built|created|designed|developed|implemented|improved|led|managed|supported|delivered|analyzed|analysed|collaborated|maintained|automated|launched|reduced|increased|responsible|worked|used|provided|coordinated|handled|organized|processed|prepared|planned|executed|resolved|assisted|conducted|performed|produced)\b/i.test(sentence)
      const isHeading = /^[A-Z\d\s&/|:-]+$/.test(sentence)
        || /^(skills?|experience|education|summary|certifications?|professional experience)\b/i.test(sentence)

      return sentence.length <= 280
        && words.length >= 6
        && getRelevanceTerms(sentence).length >= 2
        && !isHeading
        && ((hasSentencePunctuation && commaCount <= 2)
          || (commaCount <= 1 && hasExperienceVerb))
    })
  )]
}

type RelevantEvidence = {
  sentence: string
  matchedTerms: string[]
  jobContext: string
}

function findRelevantSentences(
  resumeText: string,
  jobDescription: string,
): RelevantEvidence[] {
  const jobSegments = jobDescription
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map((text) => ({ text: text.trim(), terms: getRelevanceTerms(text) }))
    .filter((segment) => segment.terms.length > 0)
  if (!jobSegments.length) return []

  const documentFrequency = new Map<string, number>()
  for (const segment of jobSegments) {
    for (const term of new Set(segment.terms)) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
    }
  }

  const sentenceCount = jobSegments.length
  const jobPhrases = new Set(
    jobSegments.flatMap((segment) => segment.terms.slice(1).map(
      (term, index) => `${segment.terms[index]} ${term}`,
    )),
  )
  const rankedSentences = splitResumeSentences(resumeText)
    .map((sentence) => {
      const terms = getRelevanceTerms(sentence)
      const termSet = new Set(terms)
      const matchedTerms = [...termSet].filter((term) => documentFrequency.has(term))
      const rareMatchedTerms = matchedTerms.filter(
        (term) => (documentFrequency.get(term) ?? sentenceCount) <= 2,
      )
      const weights = matchedTerms.map((term) => (
        1 + Math.log((sentenceCount + 1) / ((documentFrequency.get(term) ?? 1) + 1))
      ))
      let phraseMatches = 0
      for (let index = 1; index < terms.length; index += 1) {
        if (jobPhrases.has(`${terms[index - 1]} ${terms[index]}`)) phraseMatches += 1
      }

      const hasExperienceVerb = /\b(built|created|designed|developed|implemented|improved|led|managed|supported|delivered|analyzed|analysed|collaborated|maintained|automated|launched|reduced|increased|worked|used|provided|coordinated|handled|organized|processed|prepared|planned|executed|resolved|assisted|conducted|performed|produced)\b/i.test(sentence)
      const sufficientEvidence = matchedTerms.length >= 2
        || (rareMatchedTerms.length >= 1 && hasExperienceVerb)
      const score = (
        weights.reduce((sum, weight) => sum + weight, 0) + phraseMatches * 1.5
      ) / Math.sqrt(Math.max(terms.length, 1))

      const bestContext = jobSegments
        .map((segment) => {
          const contextTerms = [...new Set(segment.terms)]
            .filter((term) => termSet.has(term))
          const contextScore = contextTerms.reduce(
            (sum, term) => sum + 1 + Math.log(
              (sentenceCount + 1) / ((documentFrequency.get(term) ?? 1) + 1),
            ),
            0,
          )
          return { text: segment.text, terms: contextTerms, score: contextScore }
        })
        .filter((segment) => segment.terms.length > 0)
        .sort((left, right) => right.score - left.score)[0]

      return {
        sentence,
        score,
        sufficientEvidence,
        matchedTerms: bestContext?.terms ?? [],
        jobContext: bestContext?.text ?? '',
      }
    })
    .filter((item) => item.sufficientEvidence && item.score >= 0.4)
    .sort((left, right) => right.score - left.score)

  return rankedSentences.slice(0, 2).map((item) => ({
    sentence: item.sentence,
    matchedTerms: item.matchedTerms,
    jobContext: item.jobContext,
  }))
}

function getImprovementRecommendation(
  resumeText: string,
  jobDescription: string,
): string {
  let section: 'requirements' | 'responsibilities' | null = null
  const jobSegments: string[] = []
  const headingPattern = /^(requirements?|required skills?|preferred qualifications?|qualifications?|what you(?:'|’)ll need|what we(?:'|’)re looking for|must[- ]haves?|responsibilities|what you(?:'|’)ll do|what you will do|role responsibilities|job duties)\s*:?\s*(.*)$/i
  const excludedHeadingPattern = /^(about\b|company\b|who we are\b|our (?:company|mission|values|culture|story)\b|benefits\b|perks\b|why join us\b|what we offer\b|life at\b|culture\b|the opportunity\b)/i

  for (const rawLine of jobDescription.split(/\r?\n+/)) {
    const line = rawLine.replace(/^[\s•●▪◦*-]+/, '').trim()
    if (!line) continue

    const heading = line.match(headingPattern)
    if (heading) {
      section = /^(requirements?|required skills?|preferred qualifications?|qualifications?|what you(?:'|’)ll need|what we(?:'|’)re looking for|must[- ]haves?)/i.test(line)
        ? 'requirements'
        : 'responsibilities'
      if (heading[2]) jobSegments.push(...heading[2].split(/(?<=[.!?])\s+/).map((text) => text.trim()))
      continue
    }

    if (excludedHeadingPattern.test(line)) {
      section = null
      continue
    }
    if (section) {
      jobSegments.push(...line.split(/(?<=[.!?])\s+/).map((text) => text.trim()))
    }
  }

  const requirements = [...new Set(jobSegments)]
    .map((text) => ({ text, terms: [...new Set(getRelevanceTerms(text))] }))
    .filter((segment) => (
      segment.terms.length >= 3
      && segment.text.length <= 320
      && (
        findSkills(segment.text).length > 0
        || /\b(build|create|design|develop|implement|improve|lead|manage|support|deliver|analy[sz]|collaborate|maintain|automate|launch|reduce|increase|work|use|provide|coordinate|handle|organize|process|prepare|plan|execute|resolve|assist|conduct|perform|produce|schedule|negotiate|sell|serve|own|drive|oversee|administer|operate|review|evaluate|monitor|ensure|identify|report|document|communicate)\w*\b/i.test(segment.text)
        || /\b(proficient|proficiency|knowledge|expertise|certification|certified|years? of experience|ability to)\b/i.test(segment.text)
      )
    ))

  if (!requirements.length) {
    return 'Not enough resume evidence to suggest a specific improvement for this job.'
  }

  const documentFrequency = new Map<string, number>()
  for (const segment of requirements) {
    for (const term of segment.terms) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
    }
  }

  const resumeSentences = splitResumeSentences(resumeText)
  const resumeTerms = new Set(getRelevanceTerms(resumeText))
  const requirementEvidence = requirements
    .map((segment) => {
      const distinctiveTerms = segment.terms.filter((term) => documentFrequency.has(term))
      const importance = distinctiveTerms.reduce(
        (sum, term) => sum + 1 + Math.log(
          (requirements.length + 1) / ((documentFrequency.get(term) ?? 1) + 1),
        ),
        0,
      )
      const supportingSentences = resumeSentences
        .map((sentence) => {
          const sentenceTerms = new Set(getRelevanceTerms(sentence))
          const matchedTerms = distinctiveTerms.filter((term) => sentenceTerms.has(term))
          const score = matchedTerms.reduce(
            (sum, term) => sum + 1 + Math.log(
              (requirements.length + 1) / ((documentFrequency.get(term) ?? 1) + 1),
            ),
            0,
          )
          return { sentence, matchedTerms, score }
        })
        .filter((item) => item.matchedTerms.length >= 2)
        .sort((left, right) => right.score - left.score)

      const termsPresentInResume = distinctiveTerms.filter((term) => resumeTerms.has(term))
      return {
        ...segment,
        importance,
        termsPresentInResume,
        supportingSentences,
      }
    })
    .sort((left, right) => right.importance - left.importance)

  const supportedRequirement = requirementEvidence.find(
    (segment) => segment.supportingSentences.length > 0,
  )
  if (supportedRequirement) {
    const support = supportedRequirement.supportingSentences[0]
    return `Highlight “${support.sentence}” for the job requirement “${supportedRequirement.text}”; it shares specific terms (${support.matchedTerms.join(', ')}). Clarify your contribution using only details already supported by your experience.`
  }

  const unsupportedRequirement = requirementEvidence.find(
    (segment) => segment.termsPresentInResume.length === 0,
  )
  if (unsupportedRequirement) {
    return `The requirement “${unsupportedRequirement.text}” is not clearly evidenced in the extracted resume. If you genuinely have relevant experience, add a specific example; otherwise, do not claim it.`
  }

  return 'Not enough resume evidence to suggest a specific improvement for this job.'
}

function getJobSkillContext(text: string, skill: string): string {
  let section: 'requirements' | 'responsibilities' | 'other' = 'other'
  let foundIn: 'requirements' | 'responsibilities' | 'other' = 'other'
  const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const skillPattern = new RegExp(`(^|[^a-z0-9])${escapedSkill}($|[^a-z0-9])`, 'i')

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^[\s•●▪◦*-]+/, '').trim()
    if (!line) continue

    const heading = line.match(/^(requirements?|qualifications?|what you(?:'|’)ll need|what we(?:'|’)re looking for|must[- ]haves?)\s*:?\s*(.*)$/i)
      ?? line.match(/^(responsibilities|what you(?:'|’)ll do|what you will do|role responsibilities|job duties)\s*:?\s*(.*)$/i)
    if (heading) {
      section = /^(requirements?|qualifications?|what you(?:'|’)ll need|what we(?:'|’)re looking for|must[- ]haves?)/i.test(line)
        ? 'requirements'
        : 'responsibilities'
      if (heading[2] && skillPattern.test(heading[2])) foundIn = section
      continue
    }

    if (skillPattern.test(line)) {
      if (section === 'requirements') return 'In requirements'
      if (section === 'responsibilities') foundIn = section
    }
  }

  return foundIn === 'responsibilities'
    ? 'In responsibilities'
    : foundIn === 'requirements'
      ? 'In requirements'
      : 'Worth checking'
}

function Icon({
  name,
  size = 20,
}: {
  name: IconName
  size?: number
}) {
  const paths: Record<IconName, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    resume: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    tracker: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4m8-4v4M3 10h18m-13 5 2 2 4-4" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 5h18m-11 0v2h4v-2" /></>,
    bookmark: <><path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4z" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 15 2 2 4-4" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5m5-5v12" /></>,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h4" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>,
    filter: <><path d="M4 7h16M7 12h10m-7 5h4" /><circle cx="8" cy="7" r="1.5" /><circle cx="15" cy="12" r="1.5" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

const navigation: { label: string; icon: IconName }[] = [
  { label: 'Dashboard', icon: 'dashboard' },
  { label: 'Find Jobs', icon: 'search' },
  { label: 'Resume Analysis', icon: 'resume' },
  { label: 'Application Tracker', icon: 'tracker' },
]

const metrics: { label: string; icon: IconName; tone: string }[] = [
  { label: 'Jobs Found', icon: 'briefcase', tone: 'orange' },
  { label: 'Jobs Saved', icon: 'bookmark', tone: 'purple' },
  { label: 'Applications Sent', icon: 'send', tone: 'blue' },
  
]

function MetricCard({
  label,
  icon,
  tone,
  value,
  footnote = 'Your journey starts here',
}: {
  label: string
  icon: IconName
  tone: string
  value: number
  footnote?: string
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon name={icon} size={19} /></div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span className="metric-footnote">{footnote}</span>
    </article>
  )
}

function JobCard({
  job,
  selected,
  onCompare,
  resume,
  resumeError,
  jobSkills,
  foundSkills,
  missingSkills,
  matchPercentage,
  saved,
  onToggleSave,
  applied,
  onToggleApplied,
}: {
  job: HimalayasJob
  selected: boolean
  onCompare: (job: HimalayasJob) => void
  resume: { file: File; text: string } | null
  resumeError: string | null
  jobSkills: string[]
  foundSkills: string[]
  missingSkills: string[]
  matchPercentage: number | null
   saved: boolean
  onToggleSave: (job: HimalayasJob) => void
  applied: boolean
onToggleApplied: (job: HimalayasJob) => void
}) {
  const [semanticScore, setSemanticScore] = useState<number | null>(null)
const [semanticLoading, setSemanticLoading] = useState(false)
const [semanticError, setSemanticError] = useState<string | null>(null)
  const locationRestrictions = job.locationRestrictions?.filter(Boolean) ?? []
  const description = job.excerpt || job.description
  console.log('JOB DESCRIPTION:', job.description)
  const jobDescription = job.description || job.excerpt || ''
  const relevantSentences = resume
    ? findRelevantSentences(resume.text, jobDescription)
    : []
  const improvementRecommendation = resume?.text.trim()
    ? getImprovementRecommendation(resume.text, jobDescription)
    : 'Upload a readable resume to get an evidence-based recommendation for this job.'
const handleCompare = async () => {
  onCompare(job)
  setSemanticScore(null)
  setSemanticError(null)

  if (!resume?.text.trim() || !jobDescription.trim()) {
    return
  }

  setSemanticLoading(true)

  try {
    const result = await compareResumeWithJob(resume.text, jobDescription)
    setSemanticScore(result.similarity_score)
  } catch (error) {
    setSemanticError(
      error instanceof Error ? error.message : 'Could not compare resume with job.'
    )
  } finally {
    setSemanticLoading(false)
  }
}
  return (
    <article className="job-card">
      <div className="job-card-heading">
        <div className="job-card-title">
          <h3>{job.title}</h3>
          <p>{job.companyName}</p>
        </div>
        <span className="remote-badge">Remote</span>
      </div>
      {locationRestrictions.length > 0 && (
  <p className="job-location">
    <Icon name="location" size={14} />
    {locationRestrictions.length > 30
      ? 'Worldwide · Remote'
      : `Available in ${locationRestrictions.join(', ')}`}
  </p>
)}
      {description
        ? <p className="job-excerpt">{description}</p>
        : <p className="job-excerpt unavailable-description">Description not provided by Himalayas.</p>}
      {job.description && job.excerpt && job.description !== job.excerpt && (
        <details className="job-full-description">
            <summary>Full description</summary>
            <p>{job.description}</p>
          </details>
        )}
        <div className="job-card-actions">
        <button
          type="button"
          className="compare-job-button"
          onClick={() => onToggleSave(job)}
        >
          {saved ? 'Saved ✓' : 'Save Job ☆'}
        </button>

        <button
          type="button"
          className="compare-job-button"
          onClick={() => onToggleApplied(job)}
        >
          {applied ? 'Applied ✓' : 'Mark as Applied'}
        </button>

        <button
          className={`compare-job-button ${selected ? 'selected' : ''}`}
          type="button"
          aria-pressed={selected}
          onClick={() => void handleCompare()}
        >
          Compare with Resume
          </button>
        </div>
        {selected && (
          <section className="resume-comparison" aria-labelledby="resume-comparison-title">
            <div className="resume-comparison-heading">
              <span className="section-kicker">LOCAL SKILL CHECK</span>
              <h2 id="resume-comparison-title">Resume-to-job comparison</h2>
            </div>
            {!resume ? (
            <p role="status">Upload a PDF or DOCX resume to compare skills with this job.</p>
          ) : !resume.text.trim() ? (
            <p role="status">
              {resumeError
                ? `Resume text could not be read: ${resumeError}`
                : 'Your resume is still being read. The comparison will be available when text extraction finishes.'}
            </p>
          ) : !jobDescription.trim() ? (
            <p role="status">This job does not include a description or excerpt to compare.</p>
          ) : matchPercentage === null ? (
            <p role="status">No skills from the comparison list were identified in this job description, so no match percentage is available.</p>
          ) : (
            <>
              <p className="comparison-context">Comparing {resume.file.name} with this job.</p>
              {semanticLoading && (
  <p role="status">AI is comparing your resume with this job...</p>
)}

{semanticError && (
  <p role="alert">AI comparison error: {semanticError}</p>
)}

{semanticScore !== null && (
  <div className="comparison-advice">
    <h3>AI Semantic Similarity</h3>
    <p className="comparison-score">{semanticScore}%</p>
    <p className="comparison-caveat">
      This score measures text similarity, not your overall suitability for the job.
    </p>
  </div>
)}
              <p className="comparison-score">
                Match: {matchPercentage}% ({foundSkills.length} of {jobSkills.length} identified job skills found in resume)
              </p>
              <div className="comparison-skill-columns">
                <div>
                  <h3>Skills found in both</h3>
                  {foundSkills.length ? (
                    <ul className="comparison-skill-tags" aria-label="Skills found in both">
                      {foundSkills.map((skill) => <li key={skill}>{skill}</li>)}
                    </ul>
                  ) : <p>No listed skills were found in both texts.</p>}
                </div>
                {missingSkills.length > 0 && (
                  <div>
                    <h3>Skills to review</h3>
                    <p className="comparison-caveat">Not found in resume. Add relevant experience only if you genuinely have it.</p>
                    <ul className="comparison-skill-tags" aria-label="Skills to review">
                      {missingSkills.map((skill) => (
                        <li key={skill}>
                          <span>{skill}</span>
                          <small>{getJobSkillContext(jobDescription, skill)}</small>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="comparison-advice">
                <h3>Relevant experience</h3>
                {relevantSentences.length ? (
                  <ul>
                  {relevantSentences.map((evidence) => (
                    <li key={evidence.sentence}>{evidence.sentence}</li>
                  ))}
                  </ul>
                ) : (
                  <p>No relevant, complete resume sentences containing matched skills could be identified.</p>
                )}
              </div>
              <div className="comparison-advice">
                <h3>Suggested resume improvement</h3>
                <p>{improvementRecommendation}</p>
              </div>
            </>
          )}
        </section>
      )}
      <div className="job-card-links">
        {job.guid && (
          <a href={job.guid} target="_blank" rel="noreferrer">
            View on Himalayas <Icon name="chevron" size={14} />
          </a>
        )}
        {job.applicationLink && (
          <a className="apply-link" href={job.applicationLink} target="_blank" rel="noreferrer">
            Original application link <Icon name="chevron" size={14} />
          </a>
        )}
        {!job.applicationLink && <span className="unavailable-link">Application link unavailable</span>}
      </div>
    </article>
  )
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [searchSummary, setSearchSummary] = useState('')
  const [jobs, setJobs] = useState<HimalayasJob[]>([])
  const [savedJobs, setSavedJobs] = useState<HimalayasJob[]>(() => {
  try {
    return JSON.parse(
      localStorage.getItem('careermatch-saved-jobs') || '[]'
    ) as HimalayasJob[]
  } catch {
    return []
  }
})
const [appliedJobs, setAppliedJobs] = useState<HimalayasJob[]>(() => {
  try {
    return JSON.parse(
      localStorage.getItem('careermatch-applied-jobs') || '[]'
    ) as HimalayasJob[]
  } catch {
    return []
  }
})
const handleToggleSave = (job: HimalayasJob) => {
  setSavedJobs((current) => {
    const alreadySaved = current.some(
      (savedJob) => savedJob.guid === job.guid
    )

    const updated = alreadySaved
      ? current.filter((savedJob) => savedJob.guid !== job.guid)
      : [...current, job]

    localStorage.setItem('careermatch-saved-jobs', JSON.stringify(updated))
    return updated
  })
}
const handleToggleApplied = (job: HimalayasJob) => {
  setAppliedJobs((current) => {
    const alreadyApplied = current.some(
      (appliedJob) => appliedJob.guid === job.guid
    )

    const updated = alreadyApplied
      ? current.filter((appliedJob) => appliedJob.guid !== job.guid)
      : [...current, job]

    localStorage.setItem(
      'careermatch-applied-jobs',
      JSON.stringify(updated)
    )

    return updated
  })
}
  const [selectedJob, setSelectedJob] = useState<HimalayasJob | null>(null)
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobsError, setJobsError] = useState<string | null>(null)
  const [resume, setResume] = useState<{ file: File; text: string } | null>(null)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const resumeParseIdRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const requestControllerRef = useRef<AbortController | null>(null)
  const searchOptionsRef = useRef<HimalayasSearchOptions>({})

  const performSearch = useCallback(async (options: HimalayasSearchOptions) => {
    requestControllerRef.current?.abort()
    setSelectedJob(null)
    const controller = new AbortController()
    requestControllerRef.current = controller
    searchOptionsRef.current = options

    const criteria = [
      options.keyword?.trim() && `“${options.keyword.trim()}”`,
      options.country?.trim() && `in ${options.country.trim()}`,
      options.worldwide && 'worldwide-friendly',
    ].filter(Boolean)
    setSearchSummary(criteria.length ? criteria.join(' · ') : 'remote jobs')
    setActivePage('Find Jobs')

    setJobsLoading(true)
    setJobsError(null)
    try {
      const results = await searchHimalayasJobs(options, controller.signal)
      if (!controller.signal.aborted) setJobs(results)
    } catch (error) {
      if (!controller.signal.aborted) {
        setJobsError(
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while loading jobs.',
        )
      }
    } finally {
      if (!controller.signal.aborted) setJobsLoading(false)
    }
  }, [])

  useEffect(() => {
    const requestId = window.setTimeout(() => {
      void performSearch({})
    }, 0)
    return () => {
      window.clearTimeout(requestId)
      requestControllerRef.current?.abort()
    }
  }, [performSearch])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void performSearch({
      keyword: title,
      country: location,
      worldwide: remoteOnly,
    })
  }

  async function handleResumeChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    if (!file) return

    const parseId = ++resumeParseIdRef.current
    setResume({ file, text: '' })
    setResumeError(null)

    try {
      const text = await extractResumeText(file)
      if (parseId === resumeParseIdRef.current) setResume({ file, text })
    } catch (error) {
      if (parseId === resumeParseIdRef.current) {
        setResumeError(
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while reading the resume.',
        )
      }
    }
  }
 function generateResumeSummary(text: string): string {
  const cleanedText = text.replace(/\s+/g, ' ').trim()

  if (!cleanedText) {
    return 'No resume text is available to analyse.'
  }

  const headingMatch = /(?:PROFESSIONAL SUMMARY|PROFILE SUMMARY|CAREER SUMMARY)\s*[:\-]?\s*/i.exec(cleanedText)

  if (headingMatch) {
    const start = headingMatch.index + headingMatch[0].length
    const remainingText = cleanedText.slice(start)

    const nextHeading = /\s+(?:EXPERIENCE|CORE QUALIFICATIONS|CORE SKILLS|CONTACT|EDUCATION|TOOLS)\b/g.exec(remainingText)

    const summary = (
      nextHeading
        ? remainingText.slice(0, nextHeading.index)
        : remainingText
    ).trim()

    if (summary) {
      return summary.replace(/^[\s|•\-]+|[\s|•\-]+$/g, '').trim()
    }
  }

  return 'A separate professional summary could not be identified in your resume. Please review the extracted resume text.'
}
 function calculateResumeHealth(text: string) {
  const checks = [
    {
      name: 'Professional Summary',
      passed: /professional summary|profile summary|career summary/i.test(text),
      advice: 'Add a professional summary describing your background and strengths.',
    },
    {
      name: 'Work Experience',
      passed: /professional experience|work experience|employment history/i.test(text),
      advice: 'Add a clearly labelled Work Experience section.',
    },
    {
      name: 'Education',
      passed: /\beducation\b/i.test(text),
      advice: 'Add an Education section with your relevant qualifications.',
    },
    {
  name: 'Contact Information',
  passed:
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) &&
    /(?:\+?\d[\d\s().-]{7,}\d)/.test(text),
  advice: 'Check that your email address and phone number are included.',
},
    {
      name: 'Measurable Achievements',
      passed: /\b(increased|improved|reduced|achieved|delivered|saved)\b|\b\d+%|\b\d+\+?\s*(years|clients|customers|projects|sales)\b/i.test(text),
      advice: 'Where accurate, include measurable results or specific achievements.',
    },
  ]

  const passedChecks = checks.filter((check) => check.passed).length

  return {
    score: Math.round((passedChecks / checks.length) * 100),
    checks,
  }
}
  const resumeSkills = new Set(findSkills(resume?.text ?? ''))
  const jobDescription = selectedJob?.description || selectedJob?.excerpt || ''
  const jobSkills = findSkills(jobDescription)
  const foundSkills = jobSkills.filter((skill) => resumeSkills.has(skill))
  const missingSkills = jobSkills.filter((skill) => !resumeSkills.has(skill))
  const matchPercentage = jobSkills.length
    ? Math.round((foundSkills.length / jobSkills.length) * 100)
    : null

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setActivePage('Dashboard')} aria-label="CareerMatch home">
          <span className="brand-mark"><Icon name="spark" size={21} /></span>
          <span>career<span className="brand-highlight">match</span><small>AI CAREER COMPANION</small></span>
        </a>

        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              className={`nav-item ${activePage === item.label ? 'active' : ''}`}
              key={item.label}
              onClick={() => setActivePage(item.label)}
              type="button"
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.label === 'Application Tracker' && (
  <span className="nav-count">{appliedJobs.length}</span>
)}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon"><Icon name="spark" size={17} /></span>
            <strong>Your next chapter starts here.</strong>
            <p>Build a profile that helps great opportunities find you.</p>
            <button type="button" onClick={() => fileInputRef.current?.click()}>Complete your profile <Icon name="chevron" size={15} /></button>
          </div>
          <button className="profile-button" type="button" aria-label="Your profile">
            <span className="avatar">CM</span>
            <span className="profile-copy"><strong>Your profile</strong><small>Job seeker</small></span>
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-brand" type="button" onClick={() => setActivePage('Dashboard')}>
            <span className="brand-mark"><Icon name="spark" size={19} /></span>
            <span>career<span className="brand-highlight">match</span></span>
          </button>
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{activePage}</strong></div>
          <div className="topbar-actions">
            <span className="greeting">Good morning <span aria-hidden="true">☀</span></span>
            <button className="icon-button notifications" type="button" aria-label="Notifications">
              <Icon name="bell" size={19} /><i />
            </button>
            <span className="avatar top-avatar">CM</span>
          </div>
        </header>

        <div className="dashboard">
          {activePage === 'Resume Analysis' && (
  <section className="search-section">
    <h1>Resume Analysis</h1>
    {resume?.text && (() => {
  const health = calculateResumeHealth(resume.text)

  return (
    <div className="resume-health-card">
      <h2>Resume Health Score</h2>
      <p className="resume-health-score">{health.score}/100</p>
      <p>
        {health.checks.filter((check) => check.passed).length} of{' '}
        {health.checks.length} resume checks passed
      </p>
          <h3>Strengths</h3>
      {health.checks.filter((check) => check.passed).length > 0 ? (
        <ul>
          {health.checks
            .filter((check) => check.passed)
            .map((check) => (
              <li key={check.name}>{check.name} check passed.</li>
            ))}
        </ul>
      ) : (
        <p>No strengths identified by these checks yet.</p>
      )}

      <h3>Areas to Improve</h3>
      {health.checks.filter((check) => !check.passed).length > 0 ? (
        <ul>
          {health.checks
            .filter((check) => !check.passed)
            .map((check) => (
              <li key={check.name}>
                <strong>{check.name}:</strong> {check.advice}
              </li>
            ))}
        </ul>
      ) : (
        <p>All five structural checks passed.</p>
      )}  
      
    </div>
  )
})()}
    <p>Upload your resume to review its content and compare it with job requirements.</p>

    <button
      className="primary-button"
      type="button"
      onClick={() => fileInputRef.current?.click()}
    >
      Upload Resume
    </button>

    {resumeError && <p role="alert">{resumeError}</p>}

    {resume?.file && (
      <div>
        <h3>Uploaded Resume</h3>
        <p>{resume?.file?.name}</p>
      </div>
    )}

    {resume?.text && (
      <div>
        <h3>Professional Summary</h3>
{resume.text && (
  <p>{generateResumeSummary(resume.text)}</p>
)}

<h3>Key Skills</h3>
{findSkills(resume.text).length > 0 ? (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
    {findSkills(resume.text).map((skill) => (
      <span className="skill-tag" key={skill}>
        {skill}
      </span>
    ))}
  </div>
) : (
  <p>No skills from the current skill list were detected in your resume.</p>
)}
        <details style={{ marginTop: '24px' }}>
  <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '18px' }}>
    View Extracted Resume Text
  </summary>
        <pre
  style={{
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    maxHeight: '260px',
    overflowY: 'auto',
    padding: '18px',
    background: '#faf8f6',
    border: '1px solid #eee5de',
    borderRadius: '10px',
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: 1.7,
    color: '#4b4540',
  }}
>
  {resume.text}
</pre>
    </details>
  </div>
  )}
  </section>
)}
{activePage === 'Application Tracker' && (
  <section className="page-section">
    <div className="page-heading">
      <div>
        <h1>Application Tracker</h1>
        <p>Keep track of your job applications and every opportunity.</p>
      </div>
    </div>

    <div className="tracker-summary">
      <div className="tracker-stat-card">
        <span>Total Applications</span>
        <strong>{appliedJobs.length}</strong>
      </div>

      <div className="tracker-stat-card">
        <span>Applications Submitted</span>
        <strong>{appliedJobs.length}</strong>
      </div>

      <div className="tracker-stat-card">
        <span>Interviews</span>
        <strong>0</strong>
      </div>

      <div className="tracker-stat-card">
        <span>Offers</span>
        <strong>0</strong>
      </div>
    </div>

    <div className="tracker-content">
      <h2>Your Applications</h2>

      {appliedJobs.length === 0 ? (
        <div className="tracker-empty">
          <h3>Your application journey starts here.</h3>
          <p>
            Jobs you mark as applied will appear here.
            Your application history will be organised in one place.
          </p>
        </div>
      ) : (
        <div className="tracker-list">
          {appliedJobs.map((job) => (
            <div className="tracker-job-card" key={job.guid}>
              <div>
                <h3>{job.title}</h3>
                <p>{job.companyName}</p>
              </div>

              <span className="tracker-status">Applied</span>

              <a
                href={job.applicationLink}
                target="_blank"
                rel="noreferrer"
              >
                View Job ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="tracker-info">
      <h3>Automatic Application Tracking</h3>
      <p>
        Connect your Gmail account to automatically identify
        application confirmations, interview invitations and offers.
      </p>
      <button type="button" disabled>
        Gmail Integration — Coming Soon
      </button>
    </div>
  </section>
)}
          {activePage === 'Dashboard' && (
  <section className="welcome-panel">
            <div className="welcome-copy">
              <div className="eyebrow"><span className="eyebrow-dot" /> YOUR CAREER, IN GOOD COMPANY</div>
              <h1>Find the right job<br />for <span>you.</span></h1>
              <p>Make your next move with confidence. Discover opportunities that fit your goals and your life.</p>
              <button className="primary-button" type="button" onClick={() => document.getElementById('job-search')?.scrollIntoView({ behavior: 'smooth' })}>
                <Icon name="search" size={17} /> Explore jobs <Icon name="chevron" size={16} />
              </button>
            </div>
            <div className="welcome-art" aria-hidden="true">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-sun" />
              <div className="art-card">
                <div className="art-card-top"><span /><span /><span /></div>
                <div className="art-card-content">
                  <span className="art-avatar"><Icon name="spark" size={20} /></span>
                  <div><i /><i /><i /></div>
                </div>
                <div className="art-card-lines"><i /><i /></div>
              </div>
              <div className="art-star star-one">✦</div>
              <div className="art-star star-two">✧</div>
              <div className="art-plant"><i /><i /><i /><b /></div>
            </div>
            <div className="welcome-note"><span><Icon name="spark" size={14} /></span> One good match can change everything.</div>
          </section>
          )}

          {activePage === 'Dashboard' && (
  <section className="metrics-section" aria-label="Your job search at a glance">
            <div className="section-heading">
              <div><span className="section-kicker">A LITTLE MOMENTUM</span><h2>Your job search at a glance</h2></div>
              <span className="updated-label"><span /> Updated just now</span>
            </div>
            <div className="metric-grid">
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.label}
                  {...metric}
                  value={
  metric.label === 'Jobs Found'
    ? jobs.length
    : metric.label === 'Jobs Saved'
      ? savedJobs.length
      : metric.label === 'Applications Sent'
        ? appliedJobs.length
        : 0
}
                  footnote={metric.label === 'Jobs Found' ? 'Current results page' : undefined}
                />
              ))}
            </div>
          </section>
          )}

          {activePage === 'Find Jobs' && (
  <section className="search-section" id="job-search">
            <div className="section-heading search-heading">
              <div><span className="section-kicker">LET’S GET SPECIFIC</span><h2>Search for your next role</h2></div>
              <span className="search-step"><Icon name="filter" size={16} /> Tailor your search</span>
            </div>
            <form className="search-form" onSubmit={handleSearch}>
              <label className="field-group">
                <span>Job title or keyword</span>
                <div className="input-wrap"><Icon name="search" size={18} /><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Product designer" /></div>
              </label>
              <label className="field-group location-field">
                <span>Country or location</span>
                <div className="input-wrap"><Icon name="location" size={18} /><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Country, e.g. Canada or CA" /></div>
              </label>
              <label className="remote-toggle">
                <input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} />
                <span className="toggle-track"><i /></span>
                <span>Worldwide only</span>
              </label>
              <button className="search-button" type="submit"><Icon name="search" size={17} /> Find jobs</button>
            </form>
          </section>
          )}

          {activePage === 'Find Jobs' && (
  <section className="recommended-section">
            <div className="recommended-heading">
              <div>
                <span className="section-kicker">REAL-TIME REMOTE LISTINGS</span>
                <h2>Remote jobs from Himalayas <span className="recommend-spark"><Icon name="spark" size={15} /></span></h2>
              </div>
              <a className="himalayas-credit" href="https://himalayas.app/" target="_blank" rel="noreferrer">
                Job data by Himalayas <Icon name="chevron" size={14} />
              </a>
            </div>
            <p className="himalayas-search-note">Search location uses country names or codes supported by Himalayas. All listings are remote roles.</p>
            {jobsLoading ? (
              <div className="job-state" role="status"><span className="loading-spinner" /> Loading real job listings from Himalayas…</div>
            ) : jobsError ? (
              <div className="job-state error-state" role="alert">
                <div><strong>We couldn’t load jobs.</strong><p>{jobsError}</p></div>
                <button type="button" className="retry-button" onClick={() => void performSearch(searchOptionsRef.current)}>Try again</button>
              </div>
            ) : jobs.length === 0 ? (
              <div className="jobs-empty">
                <div className="empty-illustration" aria-hidden="true">
                  <div className="empty-ring"><Icon name="compass" size={28} /></div>
                  <span className="empty-dot dot-a" /><span className="empty-dot dot-b" /><span className="empty-dot dot-c" />
                </div>
                <div className="empty-copy">
                  <span className="empty-label"><Icon name="spark" size={14} /> NO LISTINGS FOUND</span>
                  <h3>No jobs found for {searchSummary}.</h3>
                  <p>Try a different job title or country. New remote listings are provided by Himalayas.</p>
                </div>
              </div>
            ) : (
              <div className="jobs-results" aria-live="polite">
                {jobs.map((job, index) => {
                  const key = job.guid ?? `${job.companyName}-${job.title}-${index}`
                  return (
                    <JobCard
                      key={key}
                      job={job}
                      selected={selectedJob === job}
                      onCompare={setSelectedJob}
                      saved={savedJobs.some((savedJob) => savedJob.guid === job.guid)}
onToggleSave={handleToggleSave}
applied={appliedJobs.some((appliedJob) => appliedJob.guid === job.guid)}
onToggleApplied={handleToggleApplied}
                      resume={resume}
                      resumeError={resumeError}
                      jobSkills={selectedJob === job ? jobSkills : []}
                      foundSkills={selectedJob === job ? foundSkills : []}
                      missingSkills={selectedJob === job ? missingSkills : []}
                      matchPercentage={selectedJob === job ? matchPercentage : null}
                    />
                  )
                })}
              </div>
            )}
                    </section>
)}

          <footer className="dashboard-footer">
            <span>Made for your next chapter <span className="footer-heart">♥</span></span>
            <button className="upload-link" type="button" onClick={() => fileInputRef.current?.click()}><Icon name="upload" size={15} /> Upload resume</button>
            <input ref={fileInputRef} className="file-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleResumeChange} aria-label="Upload resume" />
            {resume && <span className="resume-status" role="status">Selected: {resume.file.name}</span>}
            {resumeError && <span className="resume-status" role="alert">{resumeError}</span>}
          </footer>
                </div>
      </main>
    </div>
  )
}

export default App
