const experience = [
  {
    title: "Senior Software Engineer / Technical Lead",
    company: "Asurion",
    period: "Mar 2019 – Present",
    location: "Nashville, TN",
    bullets: [
      "Architected a configurable, multi-tenant platform processing millions of requests daily across global regionsworking directly with product, operations, and international stakeholders to get the abstractions right. 15+ products and more than a dozen teams currently build on it directly without platform-side changes.",
      "Defined shared service contracts, component libraries, and observability baselines that became the default integration path for the broader engineering org. New team integrations that previously took about 6 weeks now land in 5 days on average.",
      "Replaced ad-hoc deployments with automated validation gates and staged rollouts across a multi-region platform. Overall incident rate dropped 60%, deployment related incidents dropped by 75% and uptime stabilized at 99.6%, giving downstream teams an SLA they could actually plan against.",
      "Mentored engineers on distributed systems design and production ownership. Cut new-hire ramp time on the platform — from 8 to 4 weeks — and developed mid-level engineers into leads on complex platform work. 11 mentees promoted within 4 years.",
      "Built agentic AI pipelines for code generation, automated review, and operational tasks. Compressed the team's PR-to-merge cycle by ~25% and automated ~40% of routine review work — freeing engineers to focus on design problems instead of mechanical ones.",
    ],
  },
  {
    title: "Senior Web Developer",
    company: "OBERD",
    period: "Dec 2016 – Nov 2018",
    location: "Kansas City, MO",
    bullets: [
      "Designed and shipped full-stack analytics features (React, Node.js, Elasticsearch, Redis) for a healthcare platform used by hospital systems for patient outcomes reporting. The query builder became a core part of how clinical teams tracked performance of targeted groups of patients.",
      "Owned the data pipeline and analytics UI layer. Optimized query performance by 15% and built tools to create dashboards that clinical users could use without engineering support.",
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
