const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const Job = require('../models/Job');

let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-career-copilot';

// Gracefully handle unencoded special characters (e.g. '@') in MongoDB password from environment config
if (MONGODB_URI) {
  const match = MONGODB_URI.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.*)@([^@/]+)(.*)$/);
  if (match) {
    const protocol = match[1];
    const username = match[2];
    const password = match[3];
    const host = match[4];
    const rest = match[5];
    if (password.includes('@')) {
      MONGODB_URI = `${protocol}${username}:${encodeURIComponent(password)}@${host}${rest}`;
    }
  }
}

const INITIAL_DATA_JOBS = [
  {
    _id: "job_1",
    title: "AI Engineer",
    company: "Google DeepMind",
    location: "London, UK (Hybrid)",
    salary: "£110,000 - £150,000",
    description: "Join the team building next-generation agentic workflows and advanced reasoning architectures. You will develop highly optimized LLM routing scripts, construct custom fine-tuning pipelines, and integrate state-of-the-art vector similarity datasets. Requirements include Python, PyTorch, and hands-on LLMs/NLP experience.",
    skillsRequired: ["python", "pytorch", "llms", "nlp", "vector databases", "git"],
    type: "Full-Time"
  },
  {
    _id: "job_2",
    title: "Senior Fullstack Engineer",
    company: "Stripe",
    location: "San Francisco, CA (Remote)",
    salary: "$160,000 - $210,000",
    description: "Help expand global payment infrastructure by designing robust user control portals and reliable API endpoints. You will work across modern React components, TypeScript architectures, Node.js gateways, and relational databases. Experience with caching and security standards is required.",
    skillsRequired: ["javascript", "typescript", "react", "node.js", "express", "sql", "git"],
    type: "Full-Time"
  },
  {
    _id: "job_3",
    title: "Machine Learning Engineer",
    company: "Meta AI",
    location: "Menlo Park, CA (Onsite)",
    salary: "$180,000 - $230,000",
    description: "Design and implement scalable training frameworks for high-fidelity recommendation algorithms. Work extensively with massive data clusters, scikit-learn statistical pipelines, deep learning algorithms, and real-time distributed data pipelines. PyTorch and scikit-learn are core requirements.",
    skillsRequired: ["python", "scikit-learn", "pytorch", "numpy", "pandas", "deep learning", "git"],
    type: "Full-Time"
  },
  {
    _id: "job_4",
    title: "Backend Engineer",
    company: "Netflix",
    location: "Los Gatos, CA (Hybrid)",
    salary: "$170,000 - $220,000",
    description: "Build ultra-low-latency video indexing and API routing pipelines. The ideal candidate will have extensive knowledge in microservice routing, REST standards, Dockerized services, and SQL query tuning. Node.js or Python experience is preferred.",
    skillsRequired: ["python", "node.js", "express", "sql", "postgresql", "rest apis", "git"],
    type: "Full-Time"
  },
  {
    _id: "job_5",
    title: "Frontend Developer",
    company: "Vercel",
    location: "New York, NY (Remote)",
    salary: "$120,000 - $150,000",
    description: "Craft pixel-perfect, responsive web designs and optimized single-page web structures. Implement rich UI transition features, modular theme components, and ensure state integrity. Deep familiarity with HTML5, CSS3, Tailwind layouts, and React is mandatory.",
    skillsRequired: ["html", "css", "javascript", "typescript", "react", "tailwind css", "git"],
    type: "Contract"
  },
  {
    _id: "job_6",
    title: "Data Scientist",
    company: "Airbnb",
    location: "San Francisco, CA (Hybrid)",
    salary: "$150,000 - $200,000",
    description: "Drive product strategy through rigorous data analysis, experimentation, and predictive modeling. Partner with product and engineering teams to build recommendation models, run A/B tests, and develop data pipelines. Strong Python, SQL, and statistics skills required.",
    skillsRequired: ["python", "sql", "statistics", "pandas", "numpy", "scikit-learn"],
    type: "Full-Time"
  },
  {
    _id: "job_7",
    title: "DevOps Engineer",
    company: "Spotify",
    location: "Stockholm, Sweden (Remote)",
    salary: "€90,000 - €130,000",
    description: "Own and scale cloud infrastructure for hundreds of microservices powering millions of daily active users. Design CI/CD pipelines, manage Kubernetes clusters, and implement infrastructure-as-code with Terraform. AWS and Docker expertise essential.",
    skillsRequired: ["docker", "kubernetes", "aws", "ci/cd", "terraform", "linux", "git"],
    type: "Full-Time"
  },
  {
    _id: "job_8",
    title: "QA Engineer",
    company: "Shopify",
    location: "Toronto, Canada (Remote)",
    salary: "CAD $100,000 - $140,000",
    description: "Ensure product quality across the commerce platform through automated test suites, integration testing, and performance benchmarking. Build robust Cypress and Selenium test frameworks. Collaborate with developers to embed quality into the CI pipeline.",
    skillsRequired: ["testing", "selenium", "cypress", "javascript", "python", "git"],
    type: "Full-Time"
  },
  {
    _id: "job_9",
    title: "Product Manager",
    company: "Notion",
    location: "San Francisco, CA (Hybrid)",
    salary: "$140,000 - $190,000",
    description: "Lead product strategy for a fast-growing collaboration tool used by millions. Define roadmaps, write detailed PRDs, run discovery sprints, and work cross-functionally with engineering and design. Experience with agile methodologies and data-driven decision making required.",
    skillsRequired: ["roadmap", "product requirements", "user stories", "agile", "scrum", "prioritization", "communication"],
    type: "Full-Time"
  },
  {
    _id: "job_10",
    title: "UI/UX Designer",
    company: "Figma",
    location: "New York, NY (Hybrid)",
    salary: "$130,000 - $175,000",
    description: "Shape the future of collaborative design tooling by creating intuitive, accessible, and visually stunning interfaces. Conduct user research, create wireframes and high-fidelity prototypes, and collaborate with engineers. Mastery of Figma and interaction design principles is expected.",
    skillsRequired: ["figma", "ui design", "ux design", "wireframes", "prototyping", "user research"],
    type: "Full-Time"
  },
  {
    _id: "job_11",
    title: "Data Analyst",
    company: "Uber",
    location: "Chicago, IL (Hybrid)",
    salary: "$95,000 - $130,000",
    description: "Transform raw data into actionable insights for marketplace and rider operations teams. Build dashboards, run cohort analyses, and present findings to leadership. Expert-level SQL, Tableau, and Python skills required.",
    skillsRequired: ["sql", "excel", "tableau", "pandas", "python", "data visualization"],
    type: "Full-Time"
  },
  {
    _id: "job_12",
    title: "HR Manager",
    company: "Salesforce",
    location: "San Francisco, CA (Onsite)",
    salary: "$110,000 - $145,000",
    description: "Lead talent acquisition strategy and employee experience programs for a high-growth engineering organization. Design onboarding workflows, manage recruiting pipelines, and ensure compliance with employment standards. Strong communication and leadership skills are essential.",
    skillsRequired: ["recruiting", "talent acquisition", "interviewing", "communication", "onboarding", "leadership"],
    type: "Full-Time"
  },
  {
    _id: "job_13",
    title: "Marketing Manager",
    company: "HubSpot",
    location: "Boston, MA (Remote)",
    salary: "$100,000 - $140,000",
    description: "Drive growth through multi-channel marketing campaigns, content strategy, and SEO/SEM optimization. Analyze campaign performance with data analytics tools and iterate rapidly. Experience with CRM platforms and digital marketing required.",
    skillsRequired: ["seo", "sem", "growth marketing", "content strategy", "crm", "communication"],
    type: "Full-Time"
  },
  {
    _id: "job_14",
    title: "Sales Representative",
    company: "Datadog",
    location: "New York, NY (Hybrid)",
    salary: "$80,000 - $120,000 + Commission",
    description: "Drive new business by qualifying leads, managing enterprise sales cycles, and closing deals for a leading observability platform. Strong CRM proficiency, negotiation skills, and the ability to communicate technical value propositions to diverse stakeholders required.",
    skillsRequired: ["salesforce", "crm", "negotiation", "cold outreach", "communication", "leadership"],
    type: "Full-Time"
  },
  {
    _id: "job_15",
    title: "Operations Specialist",
    company: "Slack (Salesforce)",
    location: "Denver, CO (Remote)",
    salary: "$85,000 - $115,000",
    description: "Optimize internal processes and cross-departmental workflows to improve organizational efficiency. Build productivity frameworks, streamline onboarding pipelines, and report on operational KPIs to leadership. Strong project management and Excel skills required.",
    skillsRequired: ["process optimization", "project management", "excel", "communication", "problem solving", "leadership"],
    type: "Full-Time"
  }
];

async function seedDatabase() {
  try {
    // 1. Seed Admin
    const adminEmail = 'admin@zenova.ai';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Zenova Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isApproved: true,
        createdAt: new Date()
      });
      console.log('Seeded default admin user: admin@zenova.ai / admin123');
    }

    // 2. Migrate from db.json if collections are empty
    const dbPath = path.join(__dirname, '..', 'db.json');
    if (fs.existsSync(dbPath)) {
      console.log('Found db.json. Checking for data migration...');
      let dbData;
      try {
        const raw = fs.readFileSync(dbPath, 'utf8');
        dbData = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse db.json, skipping migration:', err.message);
        dbData = {};
      }

      // Seed Jobs
      const jobCount = await Job.countDocuments();
      if (jobCount === 0) {
        const jobsToInsert = dbData.jobs && dbData.jobs.length > 0
          ? dbData.jobs.map(j => ({ ...j, _id: j.id }))
          : INITIAL_DATA_JOBS;
        await Job.insertMany(jobsToInsert);
        console.log(`Initialized/Migrated ${jobsToInsert.length} jobs in MongoDB.`);
      }

      // Seed Users (excluding admin to avoid duplicates)
      const userCount = await User.countDocuments();
      if (userCount <= 1 && dbData.users && dbData.users.length > 0) {
        const usersToInsert = [];
        for (const u of dbData.users) {
          if (u.email.toLowerCase() !== adminEmail.toLowerCase()) {
            usersToInsert.push({
              _id: u.id,
              name: u.name,
              email: u.email.toLowerCase(),
              password: u.password,
              role: u.role || 'candidate',
              isApproved: u.isApproved || false,
              createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
            });
          }
        }
        if (usersToInsert.length > 0) {
          await User.insertMany(usersToInsert);
          console.log(`Migrated ${usersToInsert.length} users from db.json to MongoDB.`);
        }
      }

      // Seed Resumes
      const resumeCount = await Resume.countDocuments();
      if (resumeCount === 0 && dbData.resumes && dbData.resumes.length > 0) {
        const resumesToInsert = dbData.resumes.map(r => ({
          _id: r.id,
          userId: r.userId,
          filename: r.filename,
          targetRole: r.targetRole,
          report: r.report,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
        }));
        await Resume.insertMany(resumesToInsert);
        console.log(`Migrated ${resumesToInsert.length} resumes from db.json to MongoDB.`);
      }

      // Seed Interviews
      const interviewCount = await Interview.countDocuments();
      if (interviewCount === 0 && dbData.interviews && dbData.interviews.length > 0) {
        const interviewsToInsert = dbData.interviews.map(i => ({
          _id: i.id,
          userId: i.userId,
          question: i.question,
          userAnswer: i.userAnswer,
          targetRole: i.targetRole,
          report: i.report,
          createdAt: i.createdAt ? new Date(i.createdAt) : new Date()
        }));
        await Interview.insertMany(interviewsToInsert);
        console.log(`Migrated ${interviewsToInsert.length} interviews from db.json to MongoDB.`);
      }
    } else {
      // Seed default jobs from INITIAL_DATA_JOBS if db.json doesn't exist and Job collection is empty
      const jobCount = await Job.countDocuments();
      if (jobCount === 0) {
        await Job.insertMany(INITIAL_DATA_JOBS);
        console.log('Seeded default jobs inventory (no db.json found).');
      }
    }
  } catch (err) {
    console.error('Error seeding/migrating database:', err.message);
  }
}

const connectDB = async () => {
  try {
    const connectionOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000
    };
    await mongoose.connect(MONGODB_URI, connectionOptions);
    console.log("MongoDB connected successfully with production pool config.");
    await seedDatabase();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    // process.exit(1);
  }
};

module.exports = {
  connectDB
};
