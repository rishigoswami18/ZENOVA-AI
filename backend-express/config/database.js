const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db.json');

const INITIAL_DATA = {
  users: [],
  resumes: [],
  interviews: [],
  jobs: [
    {
      id: "job_1",
      title: "AI Engineer",
      company: "Google DeepMind",
      location: "London, UK (Hybrid)",
      salary: "£110,000 - £150,000",
      description: "Join the team building next-generation agentic workflows and advanced reasoning architectures. You will develop highly optimized LLM routing scripts, construct custom fine-tuning pipelines, and integrate state-of-the-art vector similarity datasets. Requirements include Python, PyTorch, and hands-on LLMs/NLP experience.",
      skillsRequired: ["python", "pytorch", "llms", "nlp", "vector databases", "git"],
      type: "Full-Time"
    },
    {
      id: "job_2",
      title: "Senior Fullstack Engineer",
      company: "Stripe",
      location: "San Francisco, CA (Remote)",
      salary: "$160,000 - $210,000",
      description: "Help expand global payment infrastructure by designing robust user control portals and reliable API endpoints. You will work across modern React components, TypeScript architectures, Node.js gateways, and relational databases. Experience with caching and security standards is required.",
      skillsRequired: ["javascript", "typescript", "react", "node.js", "express", "sql", "git"],
      type: "Full-Time"
    },
    {
      id: "job_3",
      title: "Machine Learning Engineer",
      company: "Meta AI",
      location: "Menlo Park, CA (Onsite)",
      salary: "$180,000 - $230,000",
      description: "Design and implement scalable training frameworks for high-fidelity recommendation algorithms. Work extensively with massive data clusters, scikit-learn statistical pipelines, deep learning algorithms, and real-time distributed data pipelines. PyTorch and scikit-learn are core requirements.",
      skillsRequired: ["python", "scikit-learn", "pytorch", "numpy", "pandas", "deep learning", "git"],
      type: "Full-Time"
    },
    {
      id: "job_4",
      title: "Backend Engineer",
      company: "Netflix",
      location: "Los Gatos, CA (Hybrid)",
      salary: "$170,000 - $220,000",
      description: "Build ultra-low-latency video indexing and API routing pipelines. The ideal candidate will have extensive knowledge in microservice routing, REST standards, Dockerized services, and SQL query tuning. Node.js or Python experience is preferred.",
      skillsRequired: ["python", "node.js", "express", "sql", "postgresql", "rest apis", "git"],
      type: "Full-Time"
    },
    {
      id: "job_5",
      title: "Frontend Developer",
      company: "Vercel",
      location: "New York, NY (Remote)",
      salary: "$120,000 - $150,000",
      description: "Craft pixel-perfect, responsive web designs and optimized single-page web structures. Implement rich UI transition features, modular theme components, and ensure state integrity. Deep familiarity with HTML5, CSS3, Tailwind layouts, and React is mandatory.",
      skillsRequired: ["html", "css", "javascript", "typescript", "react", "tailwind css", "git"],
      type: "Contract"
    }
  ]
};

// Ensure database file exists
function initializeDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
  }
}

// Read database
function readDb() {
  initializeDb();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database, resetting:", err);
    return INITIAL_DATA;
  }
}

// Write database
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing to database:", err);
    return false;
  }
}

module.exports = {
  readDb,
  writeDb
};
