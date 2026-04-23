// src/pages/public/NewsPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './NewsPage.css';

const newsItems = [
  {
    id: 1,
    slug: 'uniteam-v2-analytics-launch',
    title: 'UniTeam v2.0 Launches With New Analytics Dashboard',
    excerpt: 'Our biggest release yet — redesigned dashboards, enhanced reporting, and a brand-new mobile app.',
    content: 'We are thrilled to announce the launch of UniTeam v2.0. This major release includes completely redesigned dashboards for students and lecturers, enhanced reporting capabilities, and our first-ever native mobile apps for iOS and Android. The new analytics dashboard provides real-time insights into project progress, individual contributions, and deadline compliance. Lecturers can now see at a glance which projects are at risk and intervene early. Students get a personalized dashboard showing their tasks, upcoming deadlines, and team activity. The mobile apps bring the full UniTeam experience to your pocket, with offline support for low-connectivity environments.',
    date: 'March 15, 2026',
    author: 'James Nkrumah',
    authorInitials: 'JN',
    tag: 'Product Update',
    tagColor: 'teal',
    imageEmoji: '📢',
  },
  {
    id: 2,
    slug: '50-universities-east-africa-partnership',
    title: 'UniTeam Partners With 50 New Universities Across East Africa',
    excerpt: 'We\'re thrilled to welcome institutions from Kenya, Tanzania, Uganda, and Rwanda to the UniTeam network.',
    content: 'UniTeam has officially expanded its footprint across East Africa, partnering with 50 new universities in Kenya, Tanzania, Uganda, and Rwanda. This expansion brings our total partner institutions to over 340 across the continent. The new partnerships will provide thousands of students and lecturers access to our project management platform, helping streamline academic collaboration and improve project outcomes. We are particularly excited about the pilot programs launching at the University of Nairobi, Makerere University, and the University of Dar es Salaam, where we will be working closely with faculty to tailor the platform to local academic needs.',
    date: 'February 28, 2026',
    author: 'Fatima Owusu',
    authorInitials: 'FO',
    tag: 'Partnership',
    tagColor: 'orange',
    imageEmoji: '🎓',
  },
  {
    id: 3,
    slug: 'students-submit-earlier-study',
    title: 'Students Using UniTeam Submit 23% Earlier Than Average',
    excerpt: 'A new independent study from Makerere University found that UniTeam teams consistently beat submission deadlines.',
    content: 'A comprehensive study conducted by Makerere University\'s Department of Computer Science has found that student teams using UniTeam submitted their final projects an average of 23% earlier than non-users. The study, which followed 400 students across two semesters, also found that UniTeam users reported 35% less stress related to group work coordination and 40% fewer missed deadlines. "The transparency and accountability that UniTeam brings to group projects is remarkable," said Dr. Sarah Okello, lead researcher on the study. "Students can see exactly who is doing what, and when things are due. It eliminates the guesswork and blame game that often plagues academic group work."',
    date: 'February 10, 2026',
    author: 'Tunde Makinde',
    authorInitials: 'TM',
    tag: 'Research',
    tagColor: 'brown',
    imageEmoji: '🔬',
  },
  {
    id: 4,
    slug: 'smart-deadline-reminders-ai',
    title: 'Introducing Smart Deadline Reminders Powered by AI',
    excerpt: 'UniTeam now predicts which tasks are at risk based on your team\'s historical patterns.',
    content: 'We are excited to introduce Smart Deadline Reminders, a new AI-powered feature that predicts which tasks are at risk of being missed based on your team\'s historical performance patterns. The system analyzes factors such as past submission behaviour, task complexity, team size, and current progress to generate proactive alerts. Lecturers can see at a glance which projects need attention, while students receive personalised recommendations to stay on track. Early testing shows that teams using Smart Reminders are 28% less likely to miss deadlines compared to those without. This feature is available now on all Pro and Institution plans.',
    date: 'January 22, 2026',
    author: 'Aisha Lawal',
    authorInitials: 'AL',
    tag: 'Feature',
    tagColor: 'teal',
    imageEmoji: '💡',
  },
  {
    id: 5,
    slug: 'edtech-innovation-award-africatech',
    title: 'UniTeam Wins EdTech Innovation Award at AfricaTech Summit',
    excerpt: 'We\'re honoured to receive recognition for our contributions to accessible academic technology.',
    content: 'UniTeam has been awarded the EdTech Innovation Award at the 2026 AfricaTech Summit in Kigali, Rwanda. The award recognises our commitment to building accessible, impactful technology for African students and educators. "UniTeam stood out for its thoughtful design, real-world impact, and scalability," said the award jury. "They\'ve built something that genuinely solves a problem faced by millions of students across the continent." The award comes with a $50,000 grant, which UniTeam will use to further develop offline capabilities and expand our reach to more universities in rural areas.',
    date: 'January 8, 2026',
    author: 'James Nkrumah',
    authorInitials: 'JN',
    tag: 'Award',
    tagColor: 'orange',
    imageEmoji: '🏆',
  },
  {
    id: 6,
    slug: 'mobile-app-ios-android-release',
    title: 'Mobile App Now Available for iOS and Android',
    excerpt: 'Manage your projects, check deadlines, and collaborate with your team from anywhere.',
    content: 'The UniTeam mobile app is now available for download on both iOS and Android devices. The app brings the full UniTeam experience to your smartphone, with features including task management, file viewing, team messaging, deadline reminders, and progress tracking. The app works offline, allowing you to view and edit tasks even without an internet connection — changes sync automatically when you reconnect. Early user reviews praise the intuitive interface and smooth performance, even on older devices. Download the app today from the Apple App Store or Google Play Store.',
    date: 'December 18, 2025',
    author: 'Zara Bello',
    authorInitials: 'ZB',
    tag: 'Product Update',
    tagColor: 'teal',
    imageEmoji: '📱',
  },
];

const NewsPage = () => {
  const [loading] = useState(false);

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

  return (
    <>
      <div className="page-hero section-sm">
        <div className="container-narrow">
          <div className="section-tag">Latest Updates</div>
          <h1 className="section-title">News & <span className="accent">Announcements</span></h1>
          <p className="section-body">Stay up to date with UniTeam product updates, university partnerships, and insights.</p>
        </div>
      </div>

      <section className="section" style={{ background: 'var(--page-bg)', paddingTop: '24px' }}>
        <div className="container">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="news-grid">
              {newsItems.map((item, idx) => (
                <div key={item.id} className={`news-card reveal reveal-delay-${(idx % 3) + 1}`}>
                  <div className="news-img" style={{ background: 'linear-gradient(135deg, rgba(11,110,114,0.12), rgba(11,110,114,0.04))', fontSize: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.imageEmoji}
                  </div>
                  <div className="news-body">
                    <span className={`news-tag ${item.tagColor === 'orange' ? 'orange' : item.tagColor === 'brown' ? 'brown' : ''}`}>
                      {item.tag}
                    </span>
                    <h3 className="news-title">{item.title}</h3>
                    <p className="news-excerpt">{item.excerpt}</p>
                    <div className="news-meta">
                      <div className="news-author-dot" style={{ background: `linear-gradient(135deg, var(--teal), var(--teal-mid))` }}>
                        {item.authorInitials}
                      </div>
                      <div>
                        <div className="news-author-name">{item.author}</div>
                        <div className="news-date">{item.date}</div>
                      </div>
                      <Link to={`/news/${item.slug}`} className="news-read-more">
                        Read → 
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="cta-band">
        <div className="container">
          <h2 className="section-title">Stay in the <br />loop with UniTeam</h2>
          <p className="section-body">Subscribe for product updates, research insights, and partnership announcements.</p>
          <div className="cta-band-actions">
            <Link to="/contact" className="btn btn-white">Get In Touch →</Link>
            <Link to="/about" className="btn btn-outline-white">Our Story</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewsPage;