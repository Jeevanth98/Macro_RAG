import React, { useState } from 'react';
import { 
  Lightbulb, 
  Bug, 
  CheckCircle2, 
  Clock, 
  Award, 
  Search, 
  Filter, 
  ChevronRight, 
  ThumbsUp, 
  Calendar, 
  Map, 
  User, 
  TrendingUp, 
  Timer, 
  Sparkles,
  X 
} from 'lucide-react';
import './InnovationExchangePage.css';

// Mock initial data
const initialIdeas = [
  {
    id: 1,
    title: 'Interactive Macro-Economic Indicator Comparison Tool',
    description: 'Add a side-by-side charting interface that allows comparing GDP growth, inflation, and interest rates across multiple selected countries simultaneously.',
    category: 'Feature Request',
    type: 'Feature Request',
    status: 'Released',
    stage: 'Reward Granted',
    votes: 48,
    hasVoted: false,
    rewardStatus: '1,000 Credits Awarded',
    reward: '1,000 Credits',
    date: '2026-05-10',
    lastUpdated: '2026-06-20',
    submittedBy: 'Monish',
    history: [
      { status: 'Submitted', timestamp: '2026-05-10 09:30 AM', note: 'Idea logged successfully.' },
      { status: 'Assigned', timestamp: '2026-05-12 02:15 PM', note: 'Assigned to the Macro-Analytics Engineering team.' },
      { status: 'Under Review', timestamp: '2026-05-15 11:00 AM', note: 'Product team is assessing feasibility and value.' },
      { status: 'Approved', timestamp: '2026-05-18 04:30 PM', note: 'Approved for Q3 roadmap.' },
      { status: 'In Development', timestamp: '2026-06-01 09:00 AM', note: 'Frontend layouts and data query layer are in development.' },
      { status: 'Released', timestamp: '2026-06-20 10:00 AM', note: 'Deployed in Version 2.4 release.' },
      { status: 'Reward Granted', timestamp: '2026-06-20 11:30 AM', note: '1,000 Credits added to contributor balance.' }
    ],
    review: {
      decision: 'Approved',
      reviewer: 'Dev Lead',
      notes: 'This comparison tool aligns perfectly with our visualization enhancements and was prioritized for the 2.4 release due to high demand.'
    }
  },
  {
    id: 2,
    title: 'Incorrect Inflation Rate Decimal Precision for India (Q1 2026)',
    description: 'The Q1 2026 inflation rate for India shows 5.2% instead of the official RBI release of 5.24% in the main dashboard view.',
    category: 'Bug Report',
    type: 'Bug Report',
    status: 'Released',
    stage: 'Reward Granted',
    votes: 12,
    hasVoted: false,
    rewardStatus: '250 Credits Awarded',
    reward: '250 Credits',
    date: '2026-06-01',
    lastUpdated: '2026-06-05',
    submittedBy: 'Monish',
    history: [
      { status: 'Submitted', timestamp: '2026-06-01 08:00 AM', note: 'Bug reported.' },
      { status: 'Assigned', timestamp: '2026-06-01 10:30 AM', note: 'Assigned to Database sync team.' },
      { status: 'Under Review', timestamp: '2026-06-02 02:00 PM', note: 'Verifying with official RBI data source.' },
      { status: 'Approved', timestamp: '2026-06-03 10:00 AM', note: 'Confirmed discrepancy; pipeline fix scheduled.' },
      { status: 'In Development', timestamp: '2026-06-04 09:00 AM', note: 'Data ingest script updated for Q1 precision.' },
      { status: 'Released', timestamp: '2026-06-05 04:00 PM', note: 'Hotfix applied to live database.' },
      { status: 'Reward Granted', timestamp: '2026-06-05 05:00 PM', note: '250 Credits awarded for reporting discrepancy.' }
    ],
    review: {
      decision: 'Approved',
      reviewer: 'Data Engineer',
      notes: 'Discrepancy confirmed. The data source ingestion script was parsing floats to 1 decimal place. Updated decimal parser to maintain full precision.'
    }
  },
  {
    id: 3,
    title: 'Add RAG Faithfulness Analytics Dashboard',
    description: 'Add a persistent view in the AI Quality Center that tracks the evolution of the faithfulness score over multiple evaluations so we can monitor performance drifts.',
    category: 'Feature Request',
    type: 'Feature Request',
    status: 'In Development',
    stage: 'In Development',
    votes: 35,
    hasVoted: false,
    rewardStatus: 'Under Review',
    reward: 'Pending Approval',
    date: '2026-06-12',
    lastUpdated: '2026-06-22',
    submittedBy: 'Sarah K.',
    history: [
      { status: 'Submitted', timestamp: '2026-06-12 11:20 AM', note: 'Proposal submitted.' },
      { status: 'Assigned', timestamp: '2026-06-15 03:00 PM', note: 'Assigned to RAG Observability team.' },
      { status: 'Under Review', timestamp: '2026-06-18 01:10 PM', note: 'Reviewing database schema changes needed for historic evaluations.' },
      { status: 'Approved', timestamp: '2026-06-20 04:00 PM', note: 'Design approved.' },
      { status: 'In Development', timestamp: '2026-06-22 09:00 AM', note: 'Beginning backend database migrations and charting components.' }
    ],
    review: {
      decision: 'Approved',
      reviewer: 'Product Manager',
      notes: 'Great addition. Tracking evaluation history is essential for production RAG systems. This will be scheduled for Version 2.5.'
    }
  },
  {
    id: 4,
    title: 'Export Data Library to CSV/Excel Format',
    description: 'Provide an export button in the Data Library page allowing users to download query tables directly as formatted CSV or Excel files.',
    category: 'Feature Request',
    type: 'Feature Request',
    status: 'Planned',
    stage: 'Approved',
    votes: 27,
    hasVoted: false,
    rewardStatus: 'Under Review',
    reward: 'Pending Approval',
    date: '2026-06-15',
    lastUpdated: '2026-06-24',
    submittedBy: 'David L.',
    history: [
      { status: 'Submitted', timestamp: '2026-06-15 02:40 PM', note: 'Proposal submitted.' },
      { status: 'Assigned', timestamp: '2026-06-17 10:00 AM', note: 'Assigned to frontend table utilities team.' },
      { status: 'Under Review', timestamp: '2026-06-22 03:20 PM', note: 'Assessing file format limitations and export volume sizes.' },
      { status: 'Approved', timestamp: '2026-06-24 11:15 AM', note: 'Approved. Export option to be added directly to Table headers.' }
    ],
    review: {
      decision: 'Approved',
      reviewer: 'Engineering Lead',
      notes: 'Approved. We will implement client-side CSV generation for standard queries and backend-supported Excel generation for larger datasets.'
    }
  },
  {
    id: 5,
    title: 'Copilot Chat Container Scrolls to Top unexpectedly',
    description: 'When the Copilot AI response is fully rendered, the chat container occasionally auto-scrolls to the top rather than locking to the bottom of the conversation.',
    category: 'Bug Report',
    type: 'Bug Report',
    status: 'Under Review',
    stage: 'Under Review',
    votes: 9,
    hasVoted: false,
    rewardStatus: 'None',
    reward: 'None',
    date: '2026-06-20',
    lastUpdated: '2026-06-25',
    submittedBy: 'Monish',
    history: [
      { status: 'Submitted', timestamp: '2026-06-20 04:55 PM', note: 'Bug submitted.' },
      { status: 'Assigned', timestamp: '2026-06-23 09:00 AM', note: 'Assigned to Chat UX team.' },
      { status: 'Under Review', timestamp: '2026-06-25 02:30 PM', note: 'Attempting to reproduce bug across Safari and Chrome engines.' }
    ],
    review: null
  },
  {
    id: 6,
    title: 'Custom Font Option in Settings Page',
    description: 'Allow changing the default sans-serif font to a monospace font or other preselected Google Fonts for readability preferences.',
    category: 'Feature Request',
    type: 'Feature Request',
    status: 'Rejected',
    stage: 'Under Review',
    votes: 4,
    hasVoted: false,
    rewardStatus: 'None',
    reward: 'None',
    date: '2026-05-18',
    lastUpdated: '2026-05-25',
    submittedBy: 'Monish',
    history: [
      { status: 'Submitted', timestamp: '2026-05-18 10:00 AM', note: 'Proposal submitted.' },
      { status: 'Assigned', timestamp: '2026-05-20 11:00 AM', note: 'Assigned to Core UI team.' },
      { status: 'Under Review', timestamp: '2026-05-22 02:00 PM', note: 'Reviewing styling system architecture and custom font configurations.' }
    ],
    review: {
      decision: 'Rejected',
      reviewer: 'Design Director',
      notes: 'Thank you for your feedback. To maintain strict visual styling consistency across all enterprise modules, we limit font options to our verified Inter typography system. We will not be introducing custom font selectors at this time.'
    }
  }
];

const initialRewards = [
  { id: 1, credits: 1000, badges: 'Premium Contributor', date: '2026-06-20', reason: 'Feature Accepted & Implemented: Comparison Tool' },
  { id: 2, credits: 250, badges: 'Beta Tester', date: '2026-06-05', reason: 'Bug Confirmed & Patched: Q1 Inflation Rate' },
  { id: 3, credits: 100, badges: 'Early Contributor', date: '2026-05-15', reason: 'First Accepted Proposal Reward' }
];

export default function InnovationExchangePage() {
  const [activeTab, setActiveTab] = useState('features-bugs');
  const [ideas, setIdeas] = useState(initialIdeas);
  const [selectedIdea, setSelectedIdea] = useState(initialIdeas[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Feature Request');

  const handleVote = (id, e) => {
    e.stopPropagation();
    setIdeas(prevIdeas => 
      prevIdeas.map(idea => {
        if (idea.id === id) {
          const updatedVotes = idea.hasVoted ? idea.votes - 1 : idea.votes + 1;
          const updatedIdea = { ...idea, votes: updatedVotes, hasVoted: !idea.hasVoted };
          if (selectedIdea && selectedIdea.id === id) {
            setSelectedIdea(updatedIdea);
          }
          return updatedIdea;
        }
        return idea;
      })
    );
  };

  const handleOpenForm = (category) => {
    setNewCategory(category);
    setIsModalOpen(true);
  };

  const handleCreateSubmission = () => {
    if (!newTitle.trim() || !newDesc.trim()) return;

    const newSubmission = {
      id: ideas.length + 1,
      title: newTitle,
      description: newDesc,
      category: newCategory,
      type: newCategory,
      status: 'Under Review',
      stage: 'Submitted',
      votes: 1,
      hasVoted: true,
      rewardStatus: 'None',
      reward: 'None',
      date: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      submittedBy: 'Monish',
      history: [
        { status: 'Submitted', timestamp: `${new Date().toISOString().split('T')[0]} 10:00 AM`, note: 'Submission created.' }
      ],
      review: null
    };

    setIdeas([newSubmission, ...ideas]);
    setSelectedIdea(newSubmission);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  // Filter ideas based on search, tabs and filter pill
  const getFilteredIdeas = () => {
    let list = ideas;

    // Filter by Active Tab
    if (activeTab === 'features-bugs') {
      list = list.filter(idea => idea.status !== 'Rejected' || idea.submittedBy === 'Monish');
    } else if (activeTab === 'my-contributions') {
      list = list.filter(idea => idea.submittedBy === 'Monish');
    } else if (activeTab === 'roadmap') {
      list = list.filter(idea => ['Planned', 'In Development', 'Released'].includes(idea.status));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(idea => 
        idea.title.toLowerCase().includes(q) || 
        idea.description.toLowerCase().includes(q)
      );
    }

    // Filter by tag filter pill
    if (tagFilter !== 'All') {
      if (tagFilter === 'Feature Requests') {
        list = list.filter(idea => idea.category === 'Feature Request');
      } else if (tagFilter === 'Bug Reports') {
        list = list.filter(idea => idea.category === 'Bug Report');
      } else if (tagFilter === 'Accepted') {
        list = list.filter(idea => ['Planned', 'In Development', 'Released'].includes(idea.status));
      } else if (tagFilter === 'Under Review') {
        list = list.filter(idea => idea.status === 'Under Review');
      } else if (tagFilter === 'Released') {
        list = list.filter(idea => idea.status === 'Released');
      } else if (tagFilter === 'Rejected') {
        list = list.filter(idea => idea.status === 'Rejected');
      }
    }

    return list;
  };

  const filteredIdeas = getFilteredIdeas();

  // Status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Released': return <span className="badge badge--success">Released</span>;
      case 'In Development': return <span className="badge badge--info">In Dev</span>;
      case 'Planned': return <span className="badge badge--warning">Planned</span>;
      case 'Rejected': return <span className="badge badge--danger">Rejected</span>;
      default: return <span className="badge badge--brand">Under Review</span>;
    }
  };

  // Timeline step statuses
  const getTimelineStepClass = (stepStatus, currentStatus) => {
    const order = ['Submitted', 'Assigned', 'Under Review', 'Approved', 'In Development', 'Released', 'Reward Granted'];
    const stepIdx = order.indexOf(stepStatus);
    const currIdx = order.indexOf(currentStatus);

    if (currIdx === -1) return '';
    if (stepIdx < currIdx) return 'timeline-step--completed';
    if (stepIdx === currIdx) return 'timeline-step--active';
    return '';
  };

  return (
    <div className="innovation-exchange">
      {/* 1. Hero Section */}
      <div className="ie-hero">
        <div className="ie-hero__title-wrapper">
          <h1 className="ie-hero__title">Innovation Exchange</h1>
          <p className="ie-hero__subtitle">
            Every great platform is shaped by its contributors. Share ideas, report issues, and help improve Macro_RAG.
          </p>
        </div>
        <div className="ie-hero__actions">
          <button className="btn btn--primary" onClick={() => handleOpenForm('Feature Request')}>
            <Lightbulb size={16} /> Submit Idea
          </button>
          <button className="btn btn--secondary" onClick={() => handleOpenForm('Bug Report')}>
            <Bug size={16} /> Report Bug
          </button>
        </div>
      </div>

      {/* 2. Community Statistics */}
      <div className="ie-stats">
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Total Ideas Submitted</span>
            <Lightbulb size={18} className="text-brand" />
          </div>
          <div className="kpi-card__value">{ideas.length + 136}</div>
          <div className="kpi-card__footer">
            <span className="trend-indicator trend-up font-semibold">+12% this month</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Ideas Implemented</span>
            <CheckCircle2 size={18} className="text-success" />
          </div>
          <div className="kpi-card__value">38</div>
          <div className="kpi-card__footer">
            <span className="trend-indicator trend-up font-semibold">27% success rate</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Under Review</span>
            <Clock size={18} className="text-warning" />
          </div>
          <div className="kpi-card__value">19</div>
          <div className="kpi-card__footer">
            <span className="trend-indicator font-semibold text-muted">Avg response time: 2.4 days</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Rewards Distributed</span>
            <Award size={18} className="text-brand" />
          </div>
          <div className="kpi-card__value">8,400</div>
          <div className="kpi-card__footer">
            <span className="trend-indicator font-semibold text-muted">Credits awarded to contributors</span>
          </div>
        </div>
      </div>

      {/* 3. Contribution Tabs */}
      <div className="ie-tabs">
        <button 
          className={`ie-tabs__btn ${activeTab === 'features-bugs' ? 'ie-tabs__btn--active' : ''}`}
          onClick={() => { setActiveTab('features-bugs'); setTagFilter('All'); }}
        >
          <Lightbulb size={16} /> Feature Requests & Bugs
        </button>
        <button 
          className={`ie-tabs__btn ${activeTab === 'roadmap' ? 'ie-tabs__btn--active' : ''}`}
          onClick={() => { setActiveTab('roadmap'); setTagFilter('All'); }}
        >
          <Map size={16} /> Roadmap Preview
        </button>
        <button 
          className={`ie-tabs__btn ${activeTab === 'rewards' ? 'ie-tabs__btn--active' : ''}`}
          onClick={() => { setActiveTab('rewards'); setTagFilter('All'); }}
        >
          <Award size={16} /> Rewards & History
        </button>
        <button 
          className={`ie-tabs__btn ${activeTab === 'my-contributions' ? 'ie-tabs__btn--active' : ''}`}
          onClick={() => { setActiveTab('my-contributions'); setTagFilter('All'); }}
        >
          <User size={16} /> My Contributions
        </button>
      </div>

      {/* Main Body depending on Tab selection */}
      {activeTab === 'features-bugs' || activeTab === 'my-contributions' ? (
        <div className="ie-content">
          {/* Main Column */}
          <div className="ie-main-section">
            {/* 7. Search & Filter Bar */}
            <div className="card ie-filters">
              <div className="ie-filters__search-wrapper">
                <Search size={16} className="ie-filters__search-icon" />
                <input 
                  type="text" 
                  placeholder="Search contributions..." 
                  className="input ie-filters__search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="ie-filters__tags">
                {['All', 'Feature Requests', 'Bug Reports', 'Accepted', 'Under Review', 'Released', 'Rejected'].map(tag => (
                  <button 
                    key={tag} 
                    className={`ie-filters__tag-btn ${tagFilter === tag ? 'ie-filters__tag-btn--active' : ''}`}
                    onClick={() => setTagFilter(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Recent Ideas list */}
            <div className="ie-main-section">
              {filteredIdeas.length > 0 ? (
                filteredIdeas.map((idea) => (
                  <div 
                    key={idea.id} 
                    className={`card idea-card ${selectedIdea && selectedIdea.id === idea.id ? 'card--interactive' : ''}`}
                    onClick={() => setSelectedIdea(idea)}
                    style={{ cursor: 'pointer', borderLeft: selectedIdea && selectedIdea.id === idea.id ? '3px solid var(--brand-primary)' : '1px solid var(--border-color)' }}
                  >
                    <div 
                      className={`idea-card__vote ${idea.hasVoted ? 'idea-card__vote--active' : ''}`}
                      onClick={(e) => handleVote(idea.id, e)}
                    >
                      <ThumbsUp size={16} />
                      <span className="font-bold text-sm mt-1">{idea.votes}</span>
                    </div>

                    <div className="idea-card__content">
                      <div className="idea-card__header">
                        <h3 className="idea-card__title" onClick={() => setSelectedIdea(idea)}>{idea.title}</h3>
                        {getStatusBadge(idea.status)}
                      </div>
                      <p className="text-sm text-secondary truncate">{idea.description}</p>
                      
                      <div className="idea-card__footer">
                        <div className="idea-card__meta">
                          <span className="badge badge--brand">{idea.category}</span>
                          <span className="flex align-center gap-1"><User size={12} /> {idea.submittedBy}</span>
                          <span className="flex align-center gap-1"><Calendar size={12} /> Updated: {idea.lastUpdated}</span>
                        </div>
                        <button className="btn btn--ghost btn--sm" onClick={() => setSelectedIdea(idea)}>
                          View Details <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card text-center p-5 text-secondary">
                  No contributions matching the current query found.
                </div>
              )}
            </div>
          </div>

          {/* Details Sidebar / timeline panel */}
          <div className="ie-sidebar-section">
            {selectedIdea ? (
              <div className="contribution-detail-view card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge badge--brand">{selectedIdea.category}</span>
                  {getStatusBadge(selectedIdea.status)}
                </div>

                <div>
                  <h3 className="font-bold text-md mb-2">{selectedIdea.title}</h3>
                  <p className="text-xs text-secondary leading-relaxed">{selectedIdea.description}</p>
                </div>

                <div className="divider">
                  <div className="divider__line"></div>
                </div>

                {/* 9. Review Notes */}
                {selectedIdea.review ? (
                  <div className={`review-notes-card ${selectedIdea.review.decision === 'Rejected' ? 'review-notes-card--rejected' : ''}`}>
                    <div className="review-notes-card__header">
                      <span>DECISION: {selectedIdea.review.decision.toUpperCase()}</span>
                      <span>Reviewer: {selectedIdea.review.reviewer}</span>
                    </div>
                    <p className="review-notes-card__text">"{selectedIdea.review.notes}"</p>
                  </div>
                ) : (
                  <div className="review-notes-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div className="review-notes-card__header" style={{ color: 'var(--text-secondary)' }}>
                      <span>DECISION: PENDING</span>
                    </div>
                    <p className="review-notes-card__text">This submission is currently being reviewed by the product board.</p>
                  </div>
                )}

                {/* 8. Timeline view */}
                <div>
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Contribution Progress</h4>
                  <div className="contribution-timeline">
                    {(selectedIdea.status === 'Rejected' 
                      ? ['Submitted', 'Assigned', 'Under Review'] 
                      : ['Submitted', 'Assigned', 'Under Review', 'Approved', 'In Development', 'Released', 'Reward Granted']
                    ).map((step, idx) => {
                      const histEntry = selectedIdea.history.find(h => h.status === step);
                      return (
                        <div 
                          key={step} 
                          className={`timeline-step ${getTimelineStepClass(step, selectedIdea.stage)}`}
                        >
                          <div className="timeline-step__header">
                            <span className="timeline-step__title">{step}</span>
                            {histEntry && <span className="timeline-step__time">{histEntry.timestamp.split(' ')[0]}</span>}
                          </div>
                          {histEntry && <span className="timeline-step__note">{histEntry.note}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card text-center p-4 text-muted">
                Select an idea to inspect its progress timeline and review notes.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 5. Roadmap Preview Tab */}
      {activeTab === 'roadmap' ? (
        <div className="roadmap-grid">
          {/* Planned */}
          <div className="roadmap-col">
            <div className="roadmap-col__header">
              <span className="roadmap-col__title">Planned</span>
              <span className="badge badge--warning">
                {ideas.filter(i => i.status === 'Planned').length}
              </span>
            </div>
            {ideas.filter(i => i.status === 'Planned').map(idea => (
              <div key={idea.id} className="roadmap-card card" onClick={() => { setActiveTab('features-bugs'); setSelectedIdea(idea); }} style={{ cursor: 'pointer' }}>
                <h4 className="font-semibold text-sm text-primary">{idea.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge--brand btn--sm" style={{ fontSize: '10px' }}>{idea.category}</span>
                  <span className="text-xs text-muted">Votes: {idea.votes}</span>
                </div>
              </div>
            ))}
          </div>

          {/* In Development */}
          <div className="roadmap-col">
            <div className="roadmap-col__header">
              <span className="roadmap-col__title">In Development</span>
              <span className="badge badge--info">
                {ideas.filter(i => i.status === 'In Development').length}
              </span>
            </div>
            {ideas.filter(i => i.status === 'In Development').map(idea => (
              <div key={idea.id} className="roadmap-card card" onClick={() => { setActiveTab('features-bugs'); setSelectedIdea(idea); }} style={{ cursor: 'pointer' }}>
                <h4 className="font-semibold text-sm text-primary">{idea.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge--brand btn--sm" style={{ fontSize: '10px' }}>{idea.category}</span>
                  <span className="text-xs text-muted">Votes: {idea.votes}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Released */}
          <div className="roadmap-col">
            <div className="roadmap-col__header">
              <span className="roadmap-col__title">Released</span>
              <span className="badge badge--success">
                {ideas.filter(i => i.status === 'Released').length}
              </span>
            </div>
            {ideas.filter(i => i.status === 'Released').map(idea => (
              <div key={idea.id} className="roadmap-card card" onClick={() => { setActiveTab('features-bugs'); setSelectedIdea(idea); }} style={{ cursor: 'pointer' }}>
                <h4 className="font-semibold text-sm text-primary">{idea.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge--brand btn--sm" style={{ fontSize: '10px' }}>{idea.category}</span>
                  <span className="text-xs text-muted">Votes: {idea.votes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 6. Rewards & Transaction History Tab */}
      {activeTab === 'rewards' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card rewards-header-card">
            <div>
              <h3>Innovation Contributor Balance</h3>
              <p style={{ opacity: 0.8, fontSize: '13px', marginTop: '4px' }}>Submit high-quality feedback to level up your tier and earn premium access credits.</p>
            </div>
            <div className="rewards-header-card__details">
              <div className="rewards-header-card__stat">
                <span style={{ fontSize: '12px', opacity: 0.8 }}>Current Balance</span>
                <span className="rewards-header-card__value">1,350 Credits</span>
              </div>
              <div className="rewards-header-card__stat">
                <span style={{ fontSize: '12px', opacity: 0.8 }}>Contributor Tier</span>
                <span className="rewards-header-card__value" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={18} /> Silver Tier
                </span>
              </div>
              <button className="btn btn--secondary" style={{ background: '#fff', color: 'var(--brand-primary-dark)' }}>Redeem Credits</button>
            </div>
          </div>

          {/* 11. Contribution Analytics Grid */}
          <div className="ie-stats">
            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__title">Total My Contributions</span>
                <Lightbulb size={18} />
              </div>
              <div className="kpi-card__value">4</div>
              <div className="kpi-card__footer">
                <span className="trend-indicator text-muted">3 Features, 1 Bug Report</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__title">My Acceptance Rate</span>
                <TrendingUp size={18} className="text-success" />
              </div>
              <div className="kpi-card__value">75%</div>
              <div className="kpi-card__footer">
                <span className="trend-indicator trend-up">+15% over site average</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__title">Average Review Time</span>
                <Timer size={18} className="text-info" />
              </div>
              <div className="kpi-card__value">2.4d</div>
              <div className="kpi-card__footer">
                <span className="trend-indicator text-muted">Quick evaluation feedback</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card__header">
                <span className="kpi-card__title">My Impact Score</span>
                <Award size={18} className="text-brand" />
              </div>
              <div className="kpi-card__value">88</div>
              <div className="kpi-card__footer">
                <span className="trend-indicator trend-up">Top 15% of contributors</span>
              </div>
            </div>
          </div>

          {/* 10. Reward Transaction History */}
          <div className="card">
            <h3 className="font-bold text-md mb-4">Rewards Log</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Credits Awarded</th>
                  <th>Contributor Badge</th>
                  <th>Reason</th>
                  <th>Date Earned</th>
                </tr>
              </thead>
              <tbody>
                {initialRewards.map((reward) => (
                  <tr key={reward.id}>
                    <td className="font-bold text-success">+{reward.credits} Credits</td>
                    <td><span className="badge badge--brand">{reward.badges}</span></td>
                    <td className="text-secondary">{reward.reason}</td>
                    <td className="text-muted">{reward.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Modal overlay form */}
      {isModalOpen && (
        <div className="ie-modal-overlay">
          <div className="ie-modal">
            <div className="ie-modal__header">
              <h3 className="ie-modal__title">
                {newCategory === 'Feature Request' ? 'Submit Feature Request' : 'Report Platform Bug'}
              </h3>
              <X className="ie-modal__close" onClick={() => setIsModalOpen(false)} />
            </div>

            <div className="ie-modal__body">
              <div className="ie-modal__form-group">
                <label className="ie-modal__label">Title</label>
                <input 
                  type="text" 
                  className="ie-modal__input" 
                  placeholder={newCategory === 'Feature Request' ? 'e.g. Add Export button' : 'e.g. Sidebar toggle fails on mobile'} 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="ie-modal__form-group">
                <label className="ie-modal__label">Submission Category</label>
                <select 
                  className="ie-modal__select"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                </select>
              </div>

              <div className="ie-modal__form-group">
                <label className="ie-modal__label">Description</label>
                <textarea 
                  className="ie-modal__textarea"
                  placeholder="Provide a detailed explanation of your idea or the exact steps to reproduce the bug..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
            </div>

            <div className="ie-modal__footer">
              <button className="btn btn--secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleCreateSubmission} disabled={!newTitle.trim() || !newDesc.trim()}>
                Submit Code Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
