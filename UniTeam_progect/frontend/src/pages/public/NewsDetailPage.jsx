// src/pages/public/NewsDetailPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './NewsPage.css';

const newsItems = [
  {
    id: 1,
    slug: 'uniteam-v2-analytics-launch',
    title: 'UniTeam v2.0 Launches With New Analytics Dashboard',
    excerpt: 'Our biggest release yet — redesigned dashboards, enhanced reporting, and a brand-new mobile app.',
    content: 'We are thrilled to announce the launch of UniTeam v2.0. This major release includes completely redesigned dashboards for students and lecturers, enhanced reporting capabilities, and our first-ever native mobile apps for iOS and Android. The new analytics dashboard provides real-time insights into project progress, individual contributions, and deadline compliance. Lecturers can now see at a glance which projects are at risk and intervene early. Students get a personalized dashboard showing their tasks, upcoming deadlines, and team activity. The mobile apps bring the full UniTeam experience to your pocket, with offline support for low-connectivity environments.\n\nThe response from our beta testers has been overwhelmingly positive. "The new dashboard is a game-changer," said Dr. Michael Omondi, a lecturer at the University of Nairobi. "I can now monitor all 15 of my supervised projects from a single screen, and the risk alerts help me identify struggling groups before it\'s too late."\n\nUniTeam v2.0 is available now for all users. Update your app today to experience the new features.',
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
    content: 'UniTeam has officially expanded its footprint across East Africa, partnering with 50 new universities in Kenya, Tanzania, Uganda, and Rwanda. This expansion brings our total partner institutions to over 340 across the continent. The new partnerships will provide thousands of students and lecturers access to our project management platform, helping streamline academic collaboration and improve project outcomes.\n\nWe are particularly excited about the pilot programs launching at the University of Nairobi, Makerere University, and the University of Dar es Salaam, where we will be working closely with faculty to tailor the platform to local academic needs.\n\n"Our goal is to make UniTeam the default collaboration platform for every university in Africa," said James Nkrumah, CEO and Co-Founder. "This expansion is a significant step toward that vision, and we are grateful to our new partner institutions for their trust and enthusiasm."',
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
    content: 'A comprehensive study conducted by Makerere University has found that student teams using UniTeam submitted final projects an average of 23% earlier than non-users. The study followed 400 students across two semesters and showed reduced stress around team coordination and fewer missed deadlines.\n\nThe findings reinforce what lecturers and project supervisors have reported: clearer ownership and milestone visibility lead to stronger accountability and better outcomes.\n\nUniTeam will continue partnering with institutions to measure academic impact through transparent, data-backed collaboration workflows.',
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
    content: 'Smart Deadline Reminders use historical project patterns and current task progress to predict risk before deadlines are missed. Students receive practical nudges, while lecturers get earlier visibility into projects that need intervention.\n\nIn internal pilots, teams using Smart Reminders were significantly less likely to miss milestone submissions.\n\nThis feature is now available on Pro and Institution plans, with additional analytics enhancements rolling out in upcoming releases.',
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
    content: 'UniTeam has received the EdTech Innovation Award at the AfricaTech Summit, recognizing the platform\'s practical impact in academic collaboration.\n\nThe recognition highlights UniTeam\'s focus on accessible user experience, measurable student outcomes, and institution-ready workflows.\n\nThe accompanying grant support will be invested in expanded offline capabilities and deeper integration support for partner universities.',
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
    content: 'The UniTeam mobile app is now available for both iOS and Android, giving students and lecturers full access to core project workflows on the go.\n\nThe app supports low-bandwidth usage patterns and includes offline-friendly behavior for key task operations.\n\nUsers can now track deadlines, review activity, and collaborate from anywhere without losing workflow continuity.',
    date: 'December 18, 2025',
    author: 'Zara Bello',
    authorInitials: 'ZB',
    tag: 'Product Update',
    tagColor: 'teal',
    imageEmoji: '📱',
  },
];

const NewsDetailPage = () => {
  const { slug } = useParams();
  const [newsItem, setNewsItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const item = newsItems.find((entry) => entry.slug === slug);
    setNewsItem(item || null);
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="news-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="news-detail-page">
        <Link to="/news" className="news-back-link">← Back to News</Link>
        <h1>Article Not Found</h1>
        <p>The news article you're looking for doesn't exist or has been moved.</p>
      </div>
    );
  }

  return (
    <div className="news-detail-page">
      <Link to="/news" className="news-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to News
      </Link>
      
      <div className="news-detail-date">{newsItem.date}</div>
      <h1 className="news-detail-title">{newsItem.title}</h1>
      <p className="news-detail-excerpt">{newsItem.excerpt}</p>
      
      <div className="news-detail-content">
        {newsItem.content.split('\n\n').map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
};

export default NewsDetailPage;