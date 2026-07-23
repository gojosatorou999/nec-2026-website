/* ═══════════════════════════════════════════════════════════════════════════
   SITE CONTENT
   ───────────────────────────────────────────────────────────────────────────
   ⚠ Anything marked `TODO_VERIFY` is draft copy or a placeholder name that
     needs to be confirmed before this goes public. Search for that string.
   ═══════════════════════════════════════════════════════════════════════════ */

export const EVENT = {
  name: 'NEC 2026 Challenge',
  full: 'National Entrepreneurship Challenge 2026',
  host: 'E-Cell, IIT Bombay',
  venue: 'IIT Bombay · Powai, Mumbai',
  delegation: 'Idea Incubator · MGIT',
};

/* ─── Navigation ─────────────────────────────────────────────────────────── */
export const NAV_LINKS = [
  { href: '/about.html', label: 'About', external: true },
  { href: '#delegation', label: 'Delegation' },
  { href: '#mentors', label: 'Mentors' },
  { href: '#hosts', label: 'Hosts' },
  { href: '/timeline.html', label: 'Timeline', external: true },
];

/* ─── The four bodies behind NEC 2026, told on /about.html ───────────────────
   Copy supplied verbatim by the club — do not paraphrase.
   ─────────────────────────────────────────────────────────────────────────── */
export const ABOUT_ENTITIES = [
  {
    id: 'nec',
    kicker: 'The Competition',
    title: 'What is NEC?',
    lede: 'India’s largest student entrepreneurship challenge',
    accent: 'var(--peri)',
    body: [
      'Entrepreneurship Cell is essential for any college because it develops students’ entrepreneurial spirit, which we believe is instrumental for our country to grow.',
      'NEC is the platform that helps colleges build an actively functioning E-Cell.',
      'It’s a 6 month-long competition where we guide students by giving them tasks that are essential for any Entrepreneurship cell to work smoothly.',
    ],
  },
  {
    id: 'ecell',
    kicker: 'The Host',
    title: 'E-Cell, IIT Bombay',
    lede: 'Asia’s largest student run entrepreneurship body',
    accent: 'var(--mint)',
    body: [
      'The Entrepreneurship Cell (E-Cell) of IIT Bombay has been inspiring Entrepreneurs since 1998 and is Asia’s largest student-run entrepreneurship-promoting Non-Profit Organization as designated by Thomson Reuters.',
      'The Entrepreneurship Cell, at IIT Bombay was founded in 1998 with the motto of ‘Creating Job Creators’. Currently, we are a team of 22 Managers, 2 Overall Coordinators, and many enthusiastic students studying at IITB, sharing a common mission. The team meets up in an 18x18x14 room, popularly known as the ‘E-Cell office’ inside the Students Activity Centre (SAC), where the strategy to uplift the flame of startups across the globe originates.',
    ],
  },
  {
    id: 'iic',
    kicker: 'The Umbrella',
    title: 'Institution’s Innovation Council',
    lede: 'MGIT’s innovation and entrepreneurship platform',
    accent: 'var(--violet)',
    body: [
      'The Institution’s Innovation Council (IIC) is a platform established by the Mahatma Gandhi Institute of Technology to promote innovation and entrepreneurship among faculty and students.',
      'The IIC focuses to promote innovation, creativity, and entrepreneurship among students and faculty by building a strong innovation ecosystem and aims to nurture ideas into startups, build industry linkages, enhance innovation skills, support women innovators, and strengthen MGIT’s participation in national innovation activities.',
    ],
  },
  {
    id: 'ideaincubator',
    kicker: 'The Club',
    title: 'Idea Incubator, MGIT',
    lede: 'Leadership in innovation and research amongst MGITans',
    accent: 'var(--sky)',
    body: [
      'Idea Incubator MGIT, is a student club focused on fostering Leadership in innovation and research amongst MGITans. It was founded on 17th April 2019 by the Principal, MGIT as its de facto head.',
      'The mission of the club is to work on NextGen Projects, collaborate with professionals and companies to enrich research skills, develop an entrepreneurial mindset with professional skills to stand out of the crowd as gems of MGIT and revered researchers of the nation at large.',
      'The club conducts Ideathons, Design thinking contests to help students nurture ideas to develop cutting edge technology.',
      'Shark Tank MGIT, an idea pitching session drawing inspiration from Shark Tank India was conducted during NIRVANA 2K22 where 4 start-up entrepreneurs judged ideas and provided incentives in the form of their wisdom and grants.',
    ],
  },
];

/* ─── "The Challenge" explainer cards ────────────────────────────────────── */
export const ABOUT_CARDS = [
  {
    id: 'challenge',
    kicker: 'The Event',
    title: 'Asia’s largest business model competition',
    body:
      'The National Entrepreneurship Challenge is E-Cell IIT Bombay’s flagship contest, run across hundreds of campuses nationwide. Teams take an idea from a one line premise to a defensible business model, then pitch it against the best student founders in the country.',
    accent: 'var(--peri)',
    stat: { value: '2026', label: 'Edition' },
  },
  {
    id: 'delegation',
    kicker: 'Our Delegation',
    title: '22 selected to represent MGIT',
    body:
      'Twenty-two students from across MGIT earned a place in the delegation travelling to IIT Bombay. They were picked on the strength of their ideation, research and pitching across our internal selection rounds.',
    accent: 'var(--mint)',
    stat: { value: '22', label: 'Winners' },
  },
  {
    id: 'collab',
    kicker: 'The Collaboration',
    title: 'Idea Incubator × E-Cell IIT Bombay',
    body:
      'Idea Incubator is MGIT’s entrepreneurship body under the Institution’s Innovation Council. Our campus ambassadors bridge the two institutions — carrying IIT Bombay’s programming to MGIT, and MGIT’s builders to Powai.',
    accent: 'var(--violet)',
    stat: { value: 'IIC', label: 'MoE Recognised' },
  },
];

/* ─── Mentors & Leadership ───────────────────────────────────────────────────
   Big cards. These are the people backing the club institutionally.
   Names, designations and photo paths are confirmed. The `body` copy is still
   draft — see TODO_VERIFY. Portraits live in public/faculty/ and fall back to
   a monogram disc until those files exist.
   ─────────────────────────────────────────────────────────────────────────── */
export const MENTORS = [
  {
    id: 'principal',
    name: 'Prof. G. Chandramohan Reddy',
    honorific: 'Principal · Founder of the club',
    org: 'Mahatma Gandhi Institute of Technology',
    accent: 'var(--sky)',
    initials: 'CR',
    photo: '/faculty/principal-reddy.png',
    body:
      'As Principal of MGIT, he anchors the institutional support that lets a student-run body like Idea Incubator operate at national scale. The delegation travelling to IIT Bombay does so with the college’s full backing — funding, academic accommodation, and the mandate to represent MGIT on a national stage.', // TODO_VERIFY — draft copy
    tags: ['Institutional Head', 'Patron'],
  },
  {
    id: 'sabitha',
    name: 'Dr. K. C. Sabitha',
    honorific: 'Assistant Professor, Mechanical Engineering · Club Coordinator',
    org: 'MGIT',
    accent: 'var(--bulb)',
    initials: 'KS',
    photo: '/faculty/sabitha.png',
    body:
      'The club’s closest faculty ally. She has shaped how Idea Incubator runs — reviewing pitches, opening doors across departments, and holding the standard that got 22 of our students selected. Much of what the club has become traces back to her steady involvement.', // TODO_VERIFY — draft copy
    tags: ['Faculty Coordinator', 'Mentor'],
  },
  {
    id: 'rajnikanth',
    name: 'Dr. T. V. Rajinikanth',
    honorific: 'Professor & Convener, R&D Committee · Head, CSE',
    org: 'MGIT',
    accent: 'var(--peri)',
    initials: 'RK',
    photo: '/faculty/rajini-kanth.png',
    body:
      'As HOD of CSE, he has consistently made room for the club inside the department — lab access, scheduling flexibility, and encouragement for students to build alongside their coursework. A large share of the NEC delegation comes out of CSE.', // TODO_VERIFY — draft copy
    tags: ['HOD · CSE', 'Mentor'],
  },
];

/* ─── The Hosts — the three running NEC 2026 at MGIT ────────────────────────
   Kept OUT of the 22-strong delegation roster and placed at the end.
   ─────────────────────────────────────────────────────────────────────────── */
export const HOSTS = [
  {
    id: 'varun',
    name: 'R Varun',
    role:
      'Director, NEC 2026 · Development Head, Idea Incubator · Campus Ambassador, IIT Bombay',
    accent: 'var(--peri)',
    initials: 'RV',
    body:
      'Directs NEC 2026 at MGIT and runs the technical side of Idea Incubator. As campus ambassador he is the direct line between MGIT and E-Cell IIT Bombay.',
  },
  {
    id: 'balaji',
    name: 'Balaji',
    role: 'Team Leader · Club Head, Idea Incubator',
    accent: 'var(--sky)',
    initials: 'B',
    body:
      'Leads the team and heads Idea Incubator. Set the direction for the NEC 2026 campaign and holds it to the standard that made this delegation possible.',
  },
  {
    id: 'nivas',
    name: 'Nivas Salla',
    role: 'Co-Head, Idea Incubator',
    accent: 'var(--mint)',
    initials: 'NS',
    body:
      'Co-leads day to day — operations, the member pipeline, and keeping the selection process honest and organised.',
  },
];

/* ─── The 22 winners ─────────────────────────────────────────────────────────
   The roster is authored per team below and flattened into DELEGATES, so the
   team sizes can never drift out of step with the people in them the way a
   separate `count` field did.

   `role`   — 'Manager' for the team's manager, 'Delegate' for everyone else.
   `branch` — branch and year, shown as supplied (e.g. 'CSD, 2nd Year').
   ─────────────────────────────────────────────────────────────────────────── */
const ROSTER = {
  tech: [
    { name: 'Rishanth Patkar', role: 'Manager', branch: 'CSE, 2nd Year' },
    { name: 'Kyatham Vishwanath', role: 'Delegate', branch: 'CSD, 2nd Year' },
    { name: 'Sai Chaitanya Kareda', role: 'Delegate', branch: 'CSD, 2nd Year' },
  ],
  marketing: [
    { name: 'BVS Saranya', role: 'Manager', branch: 'MCT, 3rd Year' },
    { name: 'Sai Amrutha Polu', role: 'Delegate', branch: 'CSE, 4th Year' },
    { name: 'Ruthika Konkata', role: 'Delegate', branch: 'CSB, 3rd Year' },
    { name: 'Advith Hruday Ravulapati', role: 'Delegate', branch: 'MCT, 2nd Year' },
    { name: 'Niharika Bandi', role: 'Delegate', branch: 'CSB, 3rd Year' },
  ],
  design: [
    { name: 'T Siddhartha Karthik', role: 'Manager', branch: 'CSE, 3rd Year' },
    { name: 'Mriduhaasini', role: 'Delegate', branch: 'CSM, 2nd Year' },
  ],
  events: [
    { name: 'Hasini Jella', role: 'Manager', branch: 'CSE, 3rd Year' },
    { name: 'Harshita Vadde', role: 'Delegate', branch: 'CSM, 2nd Year' },
    { name: 'Vishnu Ganesh M', role: 'Delegate', branch: 'MCT, 2nd Year' },
  ],
  pr: [
    { name: 'Prisha Vishal Mistry', role: 'Manager', branch: 'CSD, 2nd Year' },
    { name: 'Kanuri Sai Karthik', role: 'Delegate', branch: 'ECE, 3rd Year' },
    { name: 'Indukuri Laasya Reddy', role: 'Delegate', branch: 'CSD, 2nd Year' },
    { name: 'Sharan Mittapalli', role: 'Delegate', branch: 'CSD, 2nd Year' },
    { name: 'Nooka Hemesh Reddy', role: 'Delegate', branch: 'CSD, 2nd Year' },
    { name: 'Shreyash Nuguru', role: 'Delegate', branch: 'CSB, 2nd Year' },
  ],
  content: [
    { name: 'Abhigna', role: 'Manager', branch: 'ECE, 2nd Year' },
    { name: 'Vengala Venkata Sai Lohini', role: 'Delegate', branch: 'CSD, 2nd Year' },
  ],
  finance: [{ name: 'Hasini Suppala', role: 'Manager', branch: 'CSD, 2nd Year' }],
};

let delegateNo = 0;
const buildTeam = (teamId) =>
  ROSTER[teamId].map((p) => {
    delegateNo += 1;
    return {
      ...p,
      id: String(delegateNo).padStart(2, '0'),
      body:
        'Selected to represent MGIT at the National Entrepreneurship Challenge 2026 at IIT Bombay, after clearing the internal ideation and pitch rounds.',
    };
  });

/* ─── Departments ────────────────────────────────────────────────────────────
   Structure taken directly from the WinnerPagetemp reference build, which
   groups people into seven teams, each shown as its own cube:

     Technology & Development · Marketing & Community · Design & Editors
     Events & Operations · PR & Sponsorship · Content & Documentation
     Finance & Administration

   Team sizes are not stored — each team's `members` come straight from ROSTER
   above, so the count shown is always the number of people actually listed.
   ─────────────────────────────────────────────────────────────────────────── */
const DEPARTMENT_SPEC = [
  {
    id: 'tech', emoji: '💻', title: 'Technology & Development', accent: '#72afff',
    blurb: 'Builds what the team ships — this site included. Prototypes, tooling and anything that needs to actually run.'
  },
  {
    id: 'marketing', emoji: '📢', title: 'Marketing & Community', accent: '#a3b2ff',
    blurb: 'Grows the room. Campus outreach, campaigns, and keeping the MGIT community loud and active.'
  },
  {
    id: 'design', emoji: '🎨', title: 'Design & Editors', accent: '#bc7aff',
    blurb: 'Sets how everything looks and reads — decks, posters, reels and the visual language of the campaign.'
  },
  {
    id: 'events', emoji: '🎯', title: 'Events & Operations', accent: '#7affcf',
    blurb: 'Runs the logistics. Sessions, competitions, travel and the hundred details that make an event happen.'
  },
  {
    id: 'pr', emoji: '🤝', title: 'PR & Sponsorship', accent: '#ffd65c',
    blurb: 'Handles partners, sponsors and MGIT’s relationships outside campus — including with E-Cell IIT Bombay.'
  },
  {
    id: 'content', emoji: '📝', title: 'Content & Documentation', accent: '#7fd4f5',
    blurb: 'Writes it all down. Case studies, recaps, research notes and the record of what the team has done.'
  },
  {
    id: 'finance', emoji: '💰', title: 'Finance & Administration', accent: '#5bf1b0',
    blurb: 'Keeps the books straight — budgets, reimbursements and the paperwork behind every trip and event.'
  },
];

export const DEPARTMENTS = DEPARTMENT_SPEC.map((spec) => ({
  ...spec,
  members: buildTeam(spec.id),
}));

/** All 22, in team order. */
export const DELEGATES = DEPARTMENTS.flatMap((d) => d.members);

/* ─── Social / external links ────────────────────────────────────────────────
   Dummy hrefs — swap `#` for the real URLs when available.
   ─────────────────────────────────────────────────────────────────────────── */
export const LINK_GROUPS = [
  {
    id: 'ii',
    label: 'Idea Incubator',
    links: [
      {
        type: 'linkedin',
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/company/idea-incubator-mgit-r-d',
      },
      { type: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/idea.mgit/' },
      { type: 'globe', label: 'Website', href: 'https://mgit.ac.in/iic/' },
    ],
  },
  {
    id: 'mgit',
    label: 'MGIT',
    links: [
      { type: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/school/mgit-college/posts/?feedView=all' },
      { type: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/mgithyd' },
      { type: 'globe', label: 'Website', href: 'https://mgit.ac.in' },
    ],
  },
];
