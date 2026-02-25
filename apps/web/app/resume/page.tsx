const experience = [
  {
    title: "Senior Software Engineer / Technical Lead",
    company: "Asurion",
    period: "Mar 2019 – Present",
    location: "Nashville, TN",
    bullets: [
      "Architected configurable, multi-tenant platform services processing millions of requests daily across multiple global regions — enabling downstream teams to ship new capabilities without platform rewrites or service interruptions.",
      "Established engineering standards that turned the platform into a force multiplier — shared service contracts, component libraries, and observability baselines that eliminated integration friction and allowed the broader engineering organization to build on the platform predictably and at speed.",
      "Raised the reliability ceiling of a multi-region platform by replacing ad-hoc deployments with automated validation gates and staged rollouts — producing a consistent uptime track record that stakeholders could plan against and downstream teams could build on with confidence.",
      "Partnered with product, operations, and global business stakeholders to translate complex, evolving requirements into durable platform abstractions, reducing the integration cost of new capabilities across teams.",
      "Mentored engineers across levels on distributed systems and production ownership, reducing ramp time for new team members and growing mid-level engineers into independent contributors on complex platform work.",
      "Applied hands-on expertise in agentic AI systems to reshape how the team builds — introducing autonomous pipelines for code generation, automated review, and AI-driven operations that compressed delivery cycles and positioned the team ahead of industry adoption curves.",
    ],
  },
  {
    title: "Senior Web Developer",
    company: "OBERD",
    period: "Dec 2016 – Nov 2018",
    location: "Kansas City, MO",
    bullets: [
      "Designed and delivered full-stack healthcare analytics features using React, Node.js, Elasticsearch, and Redis — contributing to a platform used by hospital systems to improve patient outcomes reporting.",
      "Owned significant portions of the data pipeline and UI layer, improving query performance and making complex analytics accessible to non-technical clinical users.",
    ],
  },
  {
    title: "Chief Technical Officer",
    company: "Eventr.io",
    period: "Oct 2014 – Nov 2016",
    location: "",
    bullets: [
      "Set technical direction and owned the full platform roadmap for an event management startup, making foundational architecture decisions that allowed a small team to scale product surface quickly.",
      "Hired, led, and mentored engineering staff while remaining hands-on across Node.js services, MongoDB data modeling, and frontend delivery.",
    ],
  },
  {
    title: "Early Career: Software Engineer & Consultant",
    company: "MindMixer · Hoopla.io · Local Ruckus · Vector Media Group · Galleon Labs",
    period: "2011 – 2016",
    location: "",
    bullets: [
      "Built full-stack web applications across a range of industries and team sizes using Node.js, Python/Django, C#, React, and relational and document databases.",
      "Consulted for Fortune 500 clients (Vector Media Group) and contributed to large-scale data migrations, REST API design, and multi-platform frontend delivery.",
    ],
  },
];

const skills = [
  { category: "Platform Engineering", items: "Distributed systems, multi-tenant architecture, service design, extensibility patterns" },
  { category: "Frontend", items: "React, TypeScript, JavaScript (ES6+), component systems, UI/UX collaboration" },
  { category: "Backend", items: "Node.js, Express, REST APIs, microservices, serverless, event-driven architecture" },
  { category: "Data", items: "PostgreSQL, MongoDB, Redis, Elasticsearch" },
  { category: "Cloud & DevOps", items: "AWS, GitHub Actions, Jenkins, CI/CD, observability, logging, monitoring" },
  { category: "Leadership", items: "Technical strategy, architecture reviews, cross-functional alignment, mentorship, Agile delivery" },
  { category: "Modern Tooling", items: "AI-assisted development (GitHub Copilot, Cody), LLM-enhanced workflows, automated testing" },
];

export default function ResumePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[var(--muted)] text-sm mb-2">$ cat resume.md</p>
          <h1 className="text-2xl font-bold text-[var(--accent)]">## resume</h1>
        </div>
        <a
          href="/Robert_Fines_Senior_Engineer_Resume.docx"
          download
          className="text-xs border border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors px-3 py-1.5 rounded"
        >
          $ download .docx
        </a>
      </div>

      {/* Experience */}
      <section className="space-y-6">
        <h2 className="text-[var(--accent)] text-sm font-semibold uppercase tracking-widest border-b border-[var(--border)] pb-2">
          ### experience
        </h2>

        <div className="space-y-10">
          {experience.map((job) => (
            <div key={`${job.company}-${job.period}`} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-[var(--foreground)] font-semibold">{job.title}</span>
                <span className="text-[var(--accent)] text-xs whitespace-nowrap">{job.period}</span>
              </div>
              <p className="text-[var(--muted)] text-sm">
                {job.company}
                {job.location ? ` — ${job.location}` : ""}
              </p>
              <ul className="space-y-1 pt-1">
                {job.bullets.map((bullet, i) => (
                  <li key={i} className="text-[var(--foreground)] text-sm leading-relaxed flex gap-2">
                    <span className="text-[var(--muted)] shrink-0">&gt;</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="space-y-4">
        <h2 className="text-[var(--accent)] text-sm font-semibold uppercase tracking-widest border-b border-[var(--border)] pb-2">
          ### skills
        </h2>
        <div className="space-y-2 text-sm">
          {skills.map(({ category, items }) => (
            <div key={category} className="flex flex-wrap gap-x-2">
              <span className="text-[var(--accent)] shrink-0">{category}:</span>
              <span className="text-[var(--foreground)]">{items}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="space-y-4">
        <h2 className="text-[var(--accent)] text-sm font-semibold uppercase tracking-widest border-b border-[var(--border)] pb-2">
          ### education
        </h2>
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-[var(--foreground)] font-semibold">B.S. Computer Science</span>
            <span className="text-[var(--accent)] text-xs">2006 – 2011</span>
          </div>
          <p className="text-[var(--muted)] text-sm">University of Missouri–Kansas City</p>
        </div>
      </section>
    </div>
  );
}
