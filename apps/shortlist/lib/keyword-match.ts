export interface KeywordMatchResult {
  score: number; // 0–100 integer
  matched: string[]; // sorted alphabetically
  missing: string[];
  total: number;
}

const STOP_WORDS = new Set([
  // Articles, conjunctions, prepositions
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "not", "no", "nor", "so",
  "yet", "both", "either", "neither", "whether", "although", "though", "while",
  "since", "because", "if", "unless", "until", "when", "where", "which", "who",
  "whom", "what", "that", "this", "these", "those", "it", "its", "we", "our",
  "you", "your", "they", "their", "he", "she", "his", "her", "i", "my", "me",
  "us", "them", "him", "as", "than", "then", "also", "just", "more", "some",
  "any", "all", "each", "every", "other", "such", "own", "same", "about", "up",
  "out", "into", "through", "over", "after", "before", "between", "during",
  "without", "within", "along", "across", "behind", "beyond", "plus", "except",
  "down", "off", "above", "below", "new", "use", "work", "using", "working",
  "help", "make", "take", "get", "set", "one", "two", "three", "four", "five",
  "job", "role", "team", "company", "looking", "seeking", "required", "ability",
  "strong", "good", "well", "able", "must", "need", "needs", "including",
  "related", "relevant", "various", "etc", "per", "via", "i.e", "e.g",
  // Generic JD boilerplate qualifiers
  "nice", "preferred", "applicable", "candidate", "based", "additional",
  "given", "like", "offers", "want", "hear",
  // Generic action verbs that appear in JDs but are not skills
  "achieving", "advancing", "allowing", "applying", "bringing", "executing",
  "fostering", "involving", "participating", "remaining", "upholding",
  "accomplishing", "ensuring", "coordinating",
  // HR / compensation / benefits vocabulary
  "salary", "compensation", "benefits", "dental", "bereavement", "fertility",
  "allowance", "stipend", "holidays", "coverage", "wellness", "bonus",
  "paid", "leave", "insurance", "retirement", "perks", "vacation",
]);

const MIN_TERM_LENGTH = 3;

function extractUnigrams(text: string, stopWords: Set<string>): Set<string> {
  const terms = new Set<string>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-+#.]/g, " ")
    .split(/\s+/);

  for (const word of words) {
    const cleaned = word.replace(/^[-]+|[-]+$/g, "");
    if (
      cleaned.length >= MIN_TERM_LENGTH &&
      !stopWords.has(cleaned) &&
      !/^\d+$/.test(cleaned)
    ) {
      terms.add(cleaned);
    }
  }
  return terms;
}

function extractBigrams(text: string, stopWords: Set<string>): Set<string> {
  const bigrams = new Set<string>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= MIN_TERM_LENGTH && !stopWords.has(w) && !/^\d/.test(w));

  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]} ${words[i + 1]}`);
  }
  return bigrams;
}

export function computeKeywordMatch(
  jobDescription: string,
  tailoredText: string,
  extraStopWords?: Set<string>
): KeywordMatchResult {
  if (!jobDescription.trim()) {
    return { score: 0, matched: [], missing: [], total: 0 };
  }

  const stopWords =
    extraStopWords && extraStopWords.size > 0
      ? new Set([...STOP_WORDS, ...extraStopWords])
      : STOP_WORDS;

  const jdUnigrams = extractUnigrams(jobDescription, stopWords);
  const jdBigrams = extractBigrams(jobDescription, stopWords);
  const jdTerms = new Set<string>([...jdUnigrams, ...jdBigrams]);

  const tailoredNormalized = tailoredText
    .toLowerCase()
    .replace(/[^a-z0-9\s\-+#.]/g, " ");

  const matched: string[] = [];
  const missing: string[] = [];

  for (const term of jdTerms) {
    if (tailoredNormalized.includes(term)) {
      matched.push(term);
    } else {
      missing.push(term);
    }
  }

  matched.sort();
  missing.sort();

  const total = jdTerms.size;
  const score = total === 0 ? 0 : Math.round((matched.length / total) * 100);

  return { score, matched, missing, total };
}
