import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function addToStopList(formData: FormData) {
  "use server";
  const session = await requireAdmin();
  const word = (formData.get("word") as string | null)?.trim().toLowerCase();
  if (!word) return;
  await prisma.customStopWord.upsert({
    where: { word },
    create: { word, addedBy: session.user.id },
    update: {},
  });
  revalidatePath("/admin/keyword-noise");
}

async function removeStopWord(formData: FormData) {
  "use server";
  await requireAdmin();
  const word = formData.get("word") as string | null;
  if (!word) return;
  await prisma.customStopWord.delete({ where: { word } }).catch(() => null);
  revalidatePath("/admin/keyword-noise");
}

export default async function KeywordNoisePage() {
  // Aggregate missing terms from all keyword match logs
  const logs = await prisma.keywordMatchLog.findMany({
    select: { missingTerms: true },
    orderBy: { createdAt: "desc" },
    take: 5000, // cap for safety on large datasets
  });

  const termLogCounts = new Map<string, number>();
  for (const log of logs) {
    try {
      const terms = JSON.parse(log.missingTerms) as string[];
      for (const term of terms) {
        termLogCounts.set(term, (termLogCounts.get(term) ?? 0) + 1);
      }
    } catch {
      // skip malformed rows
    }
  }

  // Aggregate user-flagged terms
  const feedbackRows = await prisma.termFeedback.groupBy({
    by: ["term"],
    _count: { term: true },
    orderBy: { _count: { term: "desc" } },
    take: 200,
  });

  const termFeedbackCounts = new Map<string, number>(
    feedbackRows.map((r) => [r.term, r._count.term])
  );

  // Merge and sort by total signal (log count + feedback count * 3)
  const allTerms = new Set([...termLogCounts.keys(), ...termFeedbackCounts.keys()]);
  const ranked = [...allTerms]
    .map((term) => ({
      term,
      logCount: termLogCounts.get(term) ?? 0,
      feedbackCount: termFeedbackCounts.get(term) ?? 0,
      signal: (termLogCounts.get(term) ?? 0) + (termFeedbackCounts.get(term) ?? 0) * 3,
    }))
    .sort((a, b) => b.signal - a.signal)
    .slice(0, 60);

  const customStopWords = await prisma.customStopWord.findMany({
    orderBy: { addedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1">
        Keyword Noise
      </h1>
      <p className="text-sm text-[var(--muted)] mb-8">
        Terms most commonly missing from tailored resumes across all users. High counts
        suggest stop word candidates. User flags (×3 weight) surface irrelevant terms faster.
      </p>

      {/* Top missing terms table */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          Top missing terms ({logs.length} resumes sampled)
        </h2>
        {ranked.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No data yet — logs appear after users view tailored resumes.</p>
        ) : (
          <div className="border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <th className="text-left px-4 py-2 text-xs font-medium text-[var(--muted)]">Term</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-[var(--muted)]">In logs</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-[var(--muted)]">User flags</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ term, logCount, feedbackCount }) => (
                  <tr key={term} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-[var(--foreground)]">
                      {term}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-[var(--muted)]">
                      {logCount}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-[var(--muted)]">
                      {feedbackCount > 0 ? (
                        <span className="text-yellow-400 font-medium">{feedbackCount}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <form action={addToStopList}>
                        <input type="hidden" name="word" value={term} />
                        <button
                          type="submit"
                          className="text-xs px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                        >
                          Add to stop list
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom stop words */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          Custom stop words ({customStopWords.length})
        </h2>
        <p className="text-xs text-[var(--muted)] mb-4">
          These are applied on top of the built-in stop word list when computing keyword matches.
          Deploy a code update to promote frequently-added terms into the static list.
        </p>

        {customStopWords.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">None added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {customStopWords.map((sw) => (
              <form key={sw.word} action={removeStopWord} className="inline-flex">
                <input type="hidden" name="word" value={sw.word} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--destructive)] hover:text-[var(--destructive)] transition-colors"
                >
                  {sw.word}
                  <span className="opacity-50">×</span>
                </button>
              </form>
            ))}
          </div>
        )}

        {/* Manual add form */}
        <form action={addToStopList} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            name="word"
            placeholder="Add a word manually…"
            className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] w-56"
          />
          <button
            type="submit"
            className="text-sm px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
