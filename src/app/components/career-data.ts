import { levelYPositions } from '../config/career-levels';
import { LEVEL_COLORS } from '../config/tokens';

export interface CareerRole {
  id: string;
  title: string;
  level: number;
  track: 'single' | 'ic' | 'management';
  color: string;
  x: number;
  y: number;
  description: string;
  requirements: string[];
  skills: string[];
  connections: string[];
}

// Color scheme based on level — imported from centralized tokens
const levelColors = LEVEL_COLORS;

// Y positions imported from centralized config
// Now managed in /src/app/config/career-levels.ts

export const careerRoles: CareerRole[] = [
  // ============================================
  // SINGLE PATH (CENTER) - Levels 0-3
  // ============================================
  {
    id: 'intern',
    title: 'Intern',
    level: 0,
    track: 'single',
    color: levelColors[0],
    x: 50,
    y: levelYPositions[0],
    description: 'Entry-level position for students or recent graduates learning the fundamentals of product design through hands-on projects and mentorship.',
    requirements: [
      'Currently pursuing or recently completed design-related degree',
      'Basic knowledge of design tools (Figma, Sketch, or Adobe XD)',
      'Portfolio showing design projects or coursework',
      'Eagerness to learn and strong work ethic',
    ],
    skills: ['Basic Design Tools', 'Visual Design', 'Communication', 'Collaboration', 'Time Management'],
    connections: ['junior-designer'],
  },
  {
    id: 'junior-designer',
    title: 'Junior Designer',
    level: 1,
    track: 'single',
    color: levelColors[1],
    x: 50,
    y: levelYPositions[1],
    description: 'Early-career designer executing well-defined projects under supervision. Building foundational skills in user research, visual design, and prototyping.',
    requirements: [
      '0-2 years of professional design experience',
      'Proficiency in modern design tools',
      'Understanding of design principles and user-centered design',
      'Ability to receive and implement feedback',
    ],
    skills: ['UI Design', 'Prototyping', 'User Research Basics', 'Design Systems', 'Stakeholder Communication'],
    connections: ['mid-level-designer'],
  },
  {
    id: 'mid-level-designer',
    title: 'Mid-level Designer',
    level: 2,
    track: 'single',
    color: levelColors[2],
    x: 50,
    y: levelYPositions[2],
    description: 'Autonomous designer leading small to medium projects. Demonstrates strong craft skills and begins to influence product decisions and mentor juniors.',
    requirements: [
      '2-4 years of product design experience',
      'Portfolio of shipped products with measurable impact',
      'Strong understanding of UX research and usability principles',
      'Ability to work independently on moderately complex projects',
    ],
    skills: ['Interaction Design', 'User Research', 'Usability Testing', 'Design Critique', 'Cross-functional Collaboration'],
    connections: ['senior-designer'],
  },
  {
    id: 'senior-designer',
    title: 'Senior Designer',
    level: 3,
    track: 'single',
    color: levelColors[3],
    x: 50,
    y: levelYPositions[3],
    description: 'Experienced designer leading complex projects and features. Strong influence on product strategy and team practices. This is the pivotal role where career paths diverge.',
    requirements: [
      '5-7 years of product design experience',
      'Track record of leading high-impact projects',
      'Strong stakeholder management and communication skills',
      'Evidence of mentoring and growing junior designers',
    ],
    skills: ['Strategic Design', 'Leadership', 'Stakeholder Management', 'Design Systems', 'Data-Driven Design'],
    connections: ['staff', 'manager'],
  },

  // ============================================
  // IC PATH (LEFT) - Levels 4-6
  // ============================================
  {
    id: 'staff',
    title: 'Staff Designer',
    level: 4,
    track: 'ic',
    color: levelColors[4],
    x: 25,
    y: levelYPositions[4],
    description: 'Individual contributor with deep expertise in specific design domains. Focuses on craft excellence and setting quality standards for complex design challenges.',
    requirements: [
      '7-9 years of design experience with proven expertise',
      'Recognized expert in 1-2 design specializations',
      'Strong portfolio demonstrating advanced craft skills',
      'Ability to influence without direct authority',
    ],
    skills: ['Deep Craft Expertise', 'Design Systems Architecture', 'Advanced Prototyping', 'Technical Design', 'Design QA'],
    connections: ['principal'],
  },
  {
    id: 'principal',
    title: 'Principal Designer',
    level: 5,
    track: 'ic',
    color: levelColors[5],
    x: 25,
    y: levelYPositions[5],
    description: 'Senior IC driving innovation and excellence across the organization. Shapes design standards, methodologies, and tools. Mentor to senior designers.',
    requirements: [
      '10-12 years of design experience',
      'Industry recognition through speaking, writing, or open-source contributions',
      'Demonstrated impact on company-wide design initiatives',
      'Deep expertise across multiple design disciplines',
    ],
    skills: ['Design Innovation', 'Systems Thinking', 'Technical Architecture', 'Thought Leadership', 'Community Building'],
    connections: ['distinguished'],
  },
  {
    id: 'distinguished',
    title: 'Distinguished Designer',
    level: 6,
    track: 'ic',
    color: levelColors[6],
    x: 25,
    y: levelYPositions[6],
    description: 'Highest level individual contributor. Defines the future of design at the company and influences the broader industry. Sets long-term vision and strategy.',
    requirements: [
      '12-15+ years of experience with transformative impact',
      'Published thought leader in the design community',
      'Strategic advisor to executive leadership',
      'Track record of pioneering new design approaches',
    ],
    skills: ['Strategic Vision', 'Industry Influence', 'Innovation Leadership', 'Executive Advisory', 'Legacy Building'],
    connections: [],
  },

  // ============================================
  // MANAGEMENT PATH (RIGHT) - Levels 4-7
  // ============================================
  {
    id: 'manager',
    title: 'Design Manager',
    level: 4,
    track: 'management',
    color: levelColors[4],
    x: 75,
    y: levelYPositions[4],
    description: 'First people management role building and leading design teams. Responsible for hiring, performance management, career development, and team culture.',
    requirements: [
      '6-8 years of design experience',
      'Demonstrated success in people management or team leadership',
      'Strong organizational and communication skills',
      'Experience with hiring, mentoring, and performance management',
    ],
    skills: ['People Management', 'Team Coordination', '1:1 Coaching', 'Performance Support', 'Hiring & Recruiting'],
    connections: ['director'],
  },
  {
    id: 'director',
    title: 'Design Director',
    level: 5,
    track: 'management',
    color: levelColors[5],
    x: 75,
    y: levelYPositions[5],
    description: 'Experienced manager leading larger teams or managing other managers. Influences design operations and drives design strategy across product areas.',
    requirements: [
      '7-10 years of design experience with 2-3 years managing',
      'Managed teams of 8+ designers or managed managers',
      'Track record of building high-performing teams',
      'Strategic influence on design operations and processes',
    ],
    skills: ['Manager Development', 'Org Design', 'Strategic Planning', 'Process Improvement', 'Cross-org Leadership'],
    connections: ['vp'],
  },
  {
    id: 'vp',
    title: 'VP of Design',
    level: 6,
    track: 'management',
    color: levelColors[6],
    x: 75,
    y: levelYPositions[6],
    description: 'Senior executive overseeing design across multiple product areas or business units. Sets design strategy aligned with business goals and partners directly with C-suite.',
    requirements: [
      '10-15 years of design experience with 5-7 years in leadership',
      'Led design organizations through significant business outcomes',
      'Strong executive presence and board-level communication',
      'Experience with P&L responsibility and business metrics',
    ],
    skills: ['Executive Leadership', 'Business Strategy', 'P&L Ownership', 'Org Transformation', 'C-suite Collaboration'],
    connections: ['cdo'],
  },
  {
    id: 'cdo',
    title: 'Chief Design Officer',
    level: 7,
    track: 'management',
    color: levelColors[7],
    x: 75,
    y: levelYPositions[7],
    description: 'Top design executive setting company-wide design vision and strategy. Member of C-suite driving business transformation through design.',
    requirements: [
      '15+ years of experience with 8+ years in executive leadership',
      'Proven track record of design-led business transformation',
      'Strong C-suite relationships and board-level communication',
      'Experience building and scaling design organizations',
    ],
    skills: ['Executive Strategy', 'C-suite Influence', 'Organizational Leadership', 'P&L Management', 'Board Communication'],
    connections: [],
  },
];