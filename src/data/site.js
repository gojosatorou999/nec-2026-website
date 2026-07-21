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
  { href: '#shapers', label: 'Shapers' },
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
    lede: 'Asia’s largest student-run entrepreneurship body',
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
      'The National Entrepreneurship Challenge is E-Cell IIT Bombay’s flagship contest, run across hundreds of campuses nationwide. Teams take an idea from a one-line premise to a defensible business model, then pitch it against the best student founders in the country.',
    accent: 'var(--peri)',
    stat: { value: '2026', label: 'Edition' },
  },
  {
    id: 'delegation',
    kicker: 'Our Delegation',
    title: '25 selected to represent MGIT',
    body:
      'Out of the whole Idea Incubator cohort, 25 members earned a place in the delegation travelling to IIT Bombay. They were picked on the strength of their ideation, research and pitching across our internal selection rounds.',
    accent: 'var(--mint)',
    stat: { value: '25', label: 'Delegates' },
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
    name: 'Prof. G. Chandra Mohan Reddy',
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
      'The club’s closest faculty ally. She has shaped how Idea Incubator runs — reviewing pitches, opening doors across departments, and holding the standard that got 25 of our members selected. Much of what the club has become traces back to her steady involvement.', // TODO_VERIFY — draft copy
    tags: ['Faculty Coordinator', 'Mentor'],
  },
  {
    id: 'rajnikanth',
    name: 'Dr. T V Rajini Kanth',
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

/* ─── The Shapers — the four who built the club and the NEC campaign ────────
   Deliberately kept OUT of the 25-delegate roster and placed at the end.
   ─────────────────────────────────────────────────────────────────────────── */
export const SHAPERS = [
  {
    id: 'varun',
    name: 'Varun R',
    role: 'Campus Ambassador, E-Cell IIT Bombay · Dev Head, Idea Incubator',
    accent: 'var(--peri)',
    initials: 'V',
    body:
      'Runs the technical side of the club. As campus ambassador he is the direct line between MGIT and E-Cell IIT Bombay.', // TODO_VERIFY — draft copy
  },
  {
    id: 'nivas',
    name: 'Nivas',
    role: 'Co-Head, Idea Incubator',
    accent: 'var(--mint)',
    initials: 'N',
    body:
      'Co-leads the club day to day — operations, member pipeline, and keeping the selection process honest and organised.', // TODO_VERIFY — draft copy
  },
  {
    id: 'vaishnavi',
    name: 'Vaishnavi G',
    role: 'Campus Ambassador, E-Cell IIT Bombay',
    accent: 'var(--violet)',
    initials: 'Va',
    body:
      'Carries IIT Bombay’s programming onto campus and drove the outreach that turned NEC from an announcement into a full delegation.', // TODO_VERIFY — draft copy
  },
  {
    id: 'balaji',
    name: 'Balaji',
    role: 'Club Head, Idea Incubator',
    accent: 'var(--sky)',
    initials: 'B',
    body:
      'Leads Idea Incubator. Set the direction for the NEC 2026 campaign and holds the club to the standard that made this delegation possible.', // TODO_VERIFY — draft copy
  },
];

/* ─── The 25 delegates ───────────────────────────────────────────────────────
   ⚠ TODO_VERIFY — real names not yet supplied. Replace `name`, `branch`,
     `year` and `focus` for each entry. Structure is final; only data changes.
   ─────────────────────────────────────────────────────────────────────────── */
const FOCUS_POOL = [
  'Product & Research',
  'Business Modelling',
  'Market Strategy',
  'Pitch & Storytelling',
  'Financial Modelling',
  'Design & Prototyping',
];

const BRANCH_POOL = ['CSE', 'CSE (AI&ML)', 'IT', 'ECE', 'EEE', 'MECH'];

export const DELEGATES = Array.from({ length: 25 }, (_, i) => {
  const n = i + 1;
  return {
    id: String(n).padStart(2, '0'),
    name: `Delegate ${String(n).padStart(2, '0')}`, // TODO_VERIFY
    branch: BRANCH_POOL[i % BRANCH_POOL.length], // TODO_VERIFY
    year: ['2nd Year', '3rd Year', '4th Year'][i % 3], // TODO_VERIFY
    focus: FOCUS_POOL[i % FOCUS_POOL.length], // TODO_VERIFY
    body:
      'Selected to represent Idea Incubator at the National Entrepreneurship Challenge 2026 at IIT Bombay, after clearing the club’s internal ideation and pitch rounds.', // TODO_VERIFY
  };
});

/* ─── Departments ────────────────────────────────────────────────────────────
   Structure taken directly from the WinnerPagetemp reference build, which
   groups people into seven teams, each shown as its own cube:

     Technology & Development · Marketing & Community · Design & Editors
     Events & Operations · PR & Sponsorship · Content & Documentation
     Finance & Administration

   ⚠ TODO_VERIFY — the split of the 25 delegates across these teams is a
     placeholder. Move people between `count`s once the real teams are known.
   ─────────────────────────────────────────────────────────────────────────── */
const DEPARTMENT_SPEC = [
  {
    id: 'tech', emoji: '💻', title: 'Technology & Development', accent: '#72afff', count: 5,
    blurb: 'Builds what the club ships — this site included. Prototypes, tooling and anything that needs to actually run.'
  },
  {
    id: 'marketing', emoji: '📢', title: 'Marketing & Community', accent: '#a3b2ff', count: 4,
    blurb: 'Grows the room. Campus outreach, campaigns, and keeping the Idea Incubator community loud and active.'
  },
  {
    id: 'design', emoji: '🎨', title: 'Design & Editors', accent: '#bc7aff', count: 4,
    blurb: 'Sets how everything looks and reads — decks, posters, reels and the visual language of the club.'
  },
  {
    id: 'events', emoji: '🎯', title: 'Events & Operations', accent: '#7affcf', count: 4,
    blurb: 'Runs the logistics. Sessions, competitions, travel and the hundred details that make an event happen.'
  },
  {
    id: 'pr', emoji: '🤝', title: 'PR & Sponsorship', accent: '#ffd65c', count: 3,
    blurb: 'Handles partners, sponsors and the club’s relationships outside MGIT — including with E-Cell IIT Bombay.'
  },
  {
    id: 'content', emoji: '📝', title: 'Content & Documentation', accent: '#7fd4f5', count: 3,
    blurb: 'Writes it all down. Case studies, recaps, research notes and the record of what the club has done.'
  },
  {
    id: 'finance', emoji: '💰', title: 'Finance & Administration', accent: '#5bf1b0', count: 2,
    blurb: 'Keeps the books straight — budgets, reimbursements and the paperwork behind every trip and event.'
  },
];

let cursor = 0;
export const DEPARTMENTS = DEPARTMENT_SPEC.map((spec) => {
  const members = DELEGATES.slice(cursor, cursor + spec.count);
  cursor += spec.count;
  return { ...spec, members };
});

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
