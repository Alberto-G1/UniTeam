// src/pages/public/TeamPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './TeamPage.css';

const teamData = [
  { id: 1, initials: 'JN', name: 'James Nkrumah', role: 'CEO & Co-Founder', dept: 'Executive', level: 0, grad: ['#0B6E72', '#0F8F96'],
    bio: 'James co-founded UniTeam after struggling with group project coordination during his final year at Makerere University. He leads product vision and university partnerships. Former software engineering intern at Google Africa.',
    skills: ['Product Strategy', 'University Partnerships', 'Fundraising', 'Public Speaking'],
    stats: [{ val: '340+', lbl: 'Uni Partners' }, { val: '$800K', lbl: 'Funds Raised' }, { val: '4 yrs', lbl: 'At UniTeam' }],
    email: 'j.nkrumah@uniteam.app', linkedin: 'linkedin.com/in/james-nkrumah' },
  { id: 2, initials: 'AL', name: 'Aisha Lawal', role: 'CTO & Co-Founder', dept: 'Engineering', level: 0, grad: ['#D4621A', '#E8782A'],
    bio: 'Aisha architected UniTeam from a hackathon prototype to a platform serving 12,400+ users. She leads all engineering decisions, infrastructure, and technical hiring. MSc Computer Science from University of Lagos.',
    skills: ['System Architecture', 'Node.js', 'React', 'DevOps', 'Team Leadership'],
    stats: [{ val: '99.9%', lbl: 'Uptime' }, { val: '14', lbl: 'Engineers Led' }, { val: '4 yrs', lbl: 'At UniTeam' }],
    email: 'a.lawal@uniteam.app', linkedin: 'linkedin.com/in/aisha-lawal' },
  { id: 3, initials: 'TM', name: 'Tunde Makinde', role: 'Head of Design', dept: 'Design', level: 1, grad: ['#364649', '#0B6E72'],
    bio: 'Tunde shapes the visual language and user experience of UniTeam. He previously led design at a fintech startup and holds a BA in Graphic Communication from KNUST. Passionate about accessible, Africa-first design.',
    skills: ['UI/UX Design', 'Figma', 'Design Systems', 'User Research', 'Accessibility'],
    stats: [{ val: 'v2.0', lbl: 'Latest Release' }, { val: '98%', lbl: 'CSAT Score' }, { val: '3 yrs', lbl: 'At UniTeam' }],
    email: 't.makinde@uniteam.app', linkedin: 'linkedin.com/in/tunde-makinde' },
  { id: 4, initials: 'FO', name: 'Fatima Owusu', role: 'Head of Growth', dept: 'Marketing', level: 1, grad: ['#565449', '#8A8575'],
    bio: 'Fatima drives UniTeam\'s university acquisition and retention strategy. She grew the user base from 500 to 12,400 in 18 months through community-led growth and strategic partnerships. MBA from Lagos Business School.',
    skills: ['Growth Marketing', 'Community Building', 'Partnership Strategy', 'Analytics', 'Content'],
    stats: [{ val: '12.4K', lbl: 'Users Grown' }, { val: '340+', lbl: 'Uni Partners' }, { val: '2 yrs', lbl: 'At UniTeam' }],
    email: 'f.owusu@uniteam.app', linkedin: 'linkedin.com/in/fatima-owusu' },
  { id: 5, initials: 'KA', name: 'Kwame Asante', role: 'Backend Lead', dept: 'Engineering', level: 2, grad: ['#0B6E72', '#22C4CA'],
    bio: 'Kwame leads the backend engineering team, responsible for UniTeam\'s API, database architecture, and integrations. BSc Computer Science from University of Ghana.',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'API Design', 'Microservices'],
    stats: [{ val: '50ms', lbl: 'Avg Response' }, { val: '2M+', lbl: 'API Calls/Day' }, { val: '2 yrs', lbl: 'At UniTeam' }],
    email: 'k.asante@uniteam.app', linkedin: 'linkedin.com/in/kwame-asante' },
  { id: 6, initials: 'ZB', name: 'Zara Bello', role: 'Frontend Lead', dept: 'Engineering', level: 2, grad: ['#0F8F96', '#D4621A'],
    bio: 'Zara leads the frontend team building UniTeam\'s web and mobile interfaces. Expert in React and performance optimisation for low-bandwidth environments. BEng from University of Ibadan.',
    skills: ['React', 'TypeScript', 'React Native', 'Performance', 'Accessibility'],
    stats: [{ val: '<1s', lbl: 'Load Time' }, { val: 'iOS+Android', lbl: 'Platforms' }, { val: '1.5 yrs', lbl: 'At UniTeam' }],
    email: 'z.bello@uniteam.app', linkedin: 'linkedin.com/in/zara-bello' },
  { id: 7, initials: 'DB', name: 'David Boateng', role: 'Lead Product Designer', dept: 'Design', level: 2, grad: ['#D4621A', '#F0BC5E'],
    bio: 'David owns UniTeam\'s design system and leads day-to-day product design. He\'s obsessed with micro-interactions and turning complex workflows into simple, beautiful interfaces. Certified UX Professional.',
    skills: ['Product Design', 'Figma', 'Prototyping', 'Motion Design', 'Design Systems'],
    stats: [{ val: '200+', lbl: 'Screens Designed' }, { val: '1 DS', lbl: 'Design System' }, { val: '2 yrs', lbl: 'At UniTeam' }],
    email: 'd.boateng@uniteam.app', linkedin: 'linkedin.com/in/david-boateng' },
  { id: 8, initials: 'PO', name: 'Peter Osei', role: 'Product Manager', dept: 'Product', level: 2, grad: ['#364649', '#D4621A'],
    bio: 'Peter manages UniTeam\'s product roadmap, user research cycles, and feature prioritisation. He bridges engineering and design to ship features that genuinely matter to students. BSc from UCT.',
    skills: ['Product Roadmapping', 'User Research', 'Agile/Scrum', 'Data Analysis', 'Stakeholder Mgmt'],
    stats: [{ val: '24', lbl: 'Features Shipped' }, { val: '200+', lbl: 'Users Interviewed' }, { val: '1.5 yrs', lbl: 'At UniTeam' }],
    email: 'p.osei@uniteam.app', linkedin: 'linkedin.com/in/peter-osei' },
  { id: 9, initials: 'ON', name: 'Oluwaseun Nwachukwu', role: 'DevOps Engineer', dept: 'Engineering', level: 3, grad: ['#0F8F96', '#0B6E72'],
    bio: 'Seun manages UniTeam\'s cloud infrastructure, CI/CD pipelines, and ensures 99.9% uptime across all services. KCNA certified Kubernetes engineer.',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Monitoring'],
    stats: [{ val: '99.9%', lbl: 'Uptime' }, { val: '0', lbl: 'Prod Incidents' }, { val: '1 yr', lbl: 'At UniTeam' }],
    email: 'o.nwachukwu@uniteam.app', linkedin: '' },
  { id: 10, initials: 'MA', name: 'Miriam Agyemang', role: 'QA Engineer', dept: 'Engineering', level: 3, grad: ['#364649', '#0B6E72'],
    bio: 'Miriam ensures every UniTeam release meets the highest quality standards through automated and manual testing. She has a zero-tolerance approach to bugs that affect submission workflows.',
    skills: ['Test Automation', 'Cypress', 'Playwright', 'Bug Triage', 'Performance Testing'],
    stats: [{ val: '1,200+', lbl: 'Test Cases' }, { val: '99%', lbl: 'Coverage' }, { val: '1 yr', lbl: 'At UniTeam' }],
    email: 'm.agyemang@uniteam.app', linkedin: '' },
  { id: 11, initials: 'NK', name: 'Naomi Kariuki', role: 'UX Researcher', dept: 'Design', level: 3, grad: ['#0B6E72', '#22C4CA'],
    bio: 'Naomi conducts continuous user research across universities in East and West Africa, translating student insights into actionable product improvements.',
    skills: ['User Interviews', 'Usability Testing', 'Journey Mapping', 'Survey Design', 'Data Synthesis'],
    stats: [{ val: '400+', lbl: 'Users Researched' }, { val: '12', lbl: 'Studies Run' }, { val: '1 yr', lbl: 'At UniTeam' }],
    email: 'n.kariuki@uniteam.app', linkedin: '' },
  { id: 12, initials: 'SS', name: 'Sara Suleiman', role: 'Content Strategist', dept: 'Marketing', level: 3, grad: ['#364649', '#0B6E72'],
    bio: 'Sara manages UniTeam\'s content marketing, blog, and in-app copy. She ensures every word we publish is clear, helpful, and reflects the voice of our student community.',
    skills: ['Content Strategy', 'Copywriting', 'SEO', 'Social Media', 'Email Marketing'],
    stats: [{ val: '50+', lbl: 'Articles Written' }, { val: '8K', lbl: 'Monthly Readers' }, { val: '1 yr', lbl: 'At UniTeam' }],
    email: 's.suleiman@uniteam.app', linkedin: '' },
];

const levelNames = ['Executive Leadership', 'Department Heads & Leads', 'Team Members'];

const TeamPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const openModal = (member) => {
    setSelectedMember(member);
    setModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (e) => {
    if (e && e.target !== document.querySelector('.team-modal-overlay') && e.target !== document.querySelector('.team-modal-close')) {
      return;
    }
    setModalOpen(false);
    setSelectedMember(null);
    document.body.style.overflow = '';
  };

  // Group members by level (0=Executive, 1=Heads, 2=Leads, 3=Team Members)
  const execMembers = teamData.filter(m => m.level === 0);
  const headsMembers = teamData.filter(m => m.level === 1);
  const leadsMembers = teamData.filter(m => m.level === 2);
  const teamMembers = teamData.filter(m => m.level === 3);

  return (
    <>
      <div className="page-hero section-sm">
        <div className="container-narrow">
          <div className="section-tag">The People</div>
          <h1 className="section-title">Meet the <span className="accent">team</span> behind UniTeam</h1>
          <p className="section-body">A diverse team of builders, designers, and educators united by one mission: better tools for every student.</p>
        </div>
      </div>

      <section className="section" style={{ background: 'var(--page-bg)', paddingTop: '24px' }}>
        <div className="container">
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div className="section-tag" style={{ margin: '0 auto' }}>Organisational Hierarchy</div>
          </div>

          <div className="hierarchy-wrap">
            {/* Executive Leadership */}
            <div className="hierarchy-level reveal">
              <div className="hierarchy-level-label">
                <div className="hl-line"></div>
                <span className="hl-text">Executive Leadership</span>
                <div className="hl-line"></div>
              </div>
              <div className="hierarchy-row ceo-row">
                {execMembers.map((member, idx) => (
                  <div key={member.id} className="team-card ceo-card reveal reveal-delay-1" onClick={() => openModal(member)}>
                    <div className="team-avatar" style={{ background: `linear-gradient(135deg, ${member.grad[0]}, ${member.grad[1]})` }}>
                      {member.initials}
                    </div>
                    <div className="team-name">{member.name}</div>
                    <div className="team-role">{member.role}</div>
                    <span className="team-dept">{member.dept}</span>
                    <div className="team-card-view">
                      View Details <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Heads */}
            <div className="hierarchy-level reveal">
              <div className="hierarchy-level-label">
                <div className="hl-line"></div>
                <span className="hl-text">Department Heads</span>
                <div className="hl-line"></div>
              </div>
              <div className="hierarchy-row">
                {headsMembers.map((member, idx) => (
                  <div key={member.id} className="team-card reveal reveal-delay-2" onClick={() => openModal(member)}>
                    <div className="team-avatar" style={{ background: `linear-gradient(135deg, ${member.grad[0]}, ${member.grad[1]})` }}>
                      {member.initials}
                    </div>
                    <div className="team-name">{member.name}</div>
                    <div className="team-role">{member.role}</div>
                    <span className="team-dept">{member.dept}</span>
                    <div className="team-card-view">
                      View Details <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Leads */}
            <div className="hierarchy-level reveal">
              <div className="hierarchy-level-label">
                <div className="hl-line"></div>
                <span className="hl-text">Team Leads</span>
                <div className="hl-line"></div>
              </div>
              <div className="hierarchy-row">
                {leadsMembers.map((member, idx) => (
                  <div key={member.id} className="team-card reveal reveal-delay-3" onClick={() => openModal(member)}>
                    <div className="team-avatar" style={{ background: `linear-gradient(135deg, ${member.grad[0]}, ${member.grad[1]})` }}>
                      {member.initials}
                    </div>
                    <div className="team-name">{member.name}</div>
                    <div className="team-role">{member.role}</div>
                    <span className="team-dept">{member.dept}</span>
                    <div className="team-card-view">
                      View Details <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Members */}
            <div className="hierarchy-level reveal">
              <div className="hierarchy-level-label">
                <div className="hl-line"></div>
                <span className="hl-text">Team Members</span>
                <div className="hl-line"></div>
              </div>
              <div className="hierarchy-row">
                {teamMembers.map((member, idx) => (
                  <div key={member.id} className="team-card reveal reveal-delay-4" onClick={() => openModal(member)}>
                    <div className="team-avatar" style={{ background: `linear-gradient(135deg, ${member.grad[0]}, ${member.grad[1]})` }}>
                      {member.initials}
                    </div>
                    <div className="team-name">{member.name}</div>
                    <div className="team-role">{member.role}</div>
                    <span className="team-dept">{member.dept}</span>
                    <div className="team-card-view">
                      View Details <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Modal */}
      <div className={`team-modal-overlay ${modalOpen ? 'open' : ''}`} onClick={closeModal}>
        {selectedMember && (
          <div className="team-modal">
            <div className="team-modal-header">
              <button className="team-modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div className="team-modal-avatar" style={{ background: `linear-gradient(135deg, ${selectedMember.grad[0]}, ${selectedMember.grad[1]})` }}>
                {selectedMember.initials}
              </div>
              <div className="team-modal-name">{selectedMember.name}</div>
              <div className="team-modal-role">{selectedMember.role} · {selectedMember.dept}</div>
            </div>
            <div className="team-modal-body">
              <div className="team-modal-section">
                <div className="team-modal-section-title">About</div>
                <p className="team-modal-bio">{selectedMember.bio}</p>
              </div>
              <div className="team-modal-section">
                <div className="team-modal-section-title">Key Stats</div>
                <div className="team-modal-stats">
                  {selectedMember.stats.map((stat, idx) => (
                    <div key={idx} className="tms">
                      <div className="tms-val">{stat.val}</div>
                      <div className="tms-lbl">{stat.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="team-modal-section">
                <div className="team-modal-section-title">Skills & Expertise</div>
                <div className="team-modal-tags">
                  {selectedMember.skills.map((skill, idx) => (
                    <span key={idx} className="team-modal-tag">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="team-modal-section">
                <div className="team-modal-section-title">Connect</div>
                <div className="team-modal-contact">
                  <button className="tmc-btn" onClick={() => navigator.clipboard.writeText(selectedMember.email)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Email
                  </button>
                  {selectedMember.linkedin && (
                    <button className="tmc-btn" onClick={() => window.open(`https://${selectedMember.linkedin}`, '_blank')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                      LinkedIn
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA Band */}
      <div className="cta-band">
        <div className="container">
          <h2 className="section-title">Want to join our team?</h2>
          <p className="section-body">We're always looking for passionate people.</p>
          <div className="cta-band-actions">
            <Link to="/contact" className="btn btn-white">View Open Roles →</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamPage;