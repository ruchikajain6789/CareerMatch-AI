
export interface ResumeMatchResult {
  similarity_score: number;
  note: string;
}

function tokenize(text: string): string[] {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'you', 'are', 'was',
    'this', 'that', 'from', 'have', 'has', 'will',
    'your', 'our', 'their', 'they', 'into', 'about',
    'who', 'what', 'when', 'where', 'how', 'not'
  ]);

  return text
    .toLowerCase()
    .match(/[a-z0-9+#.]+/g)
    ?.filter(word => word.length > 1 && !stopWords.has(word)) ?? [];
}

export async function compareResumeWithJob(
  resumeText: string,
  jobText: string
): Promise<ResumeMatchResult> {
  const resumeWords = tokenize(resumeText);
  const jobWords = tokenize(jobText);

  if (!resumeWords.length || !jobWords.length) {
    return {
      similarity_score: 0,
      note: 'Insufficient text to calculate a match.'
    };
  }

  const resumeCounts = new Map<string, number>();
  const jobCounts = new Map<string, number>();

  resumeWords.forEach(word => {
    resumeCounts.set(word, (resumeCounts.get(word) ?? 0) + 1);
  });

  jobWords.forEach(word => {
    jobCounts.set(word, (jobCounts.get(word) ?? 0) + 1);
  });

  const vocabulary = new Set([
    ...resumeCounts.keys(),
    ...jobCounts.keys()
  ]);

  let dotProduct = 0;
  let resumeMagnitude = 0;
  let jobMagnitude = 0;

  vocabulary.forEach(word => {
    const resumeFrequency = resumeCounts.get(word) ?? 0;
    const jobFrequency = jobCounts.get(word) ?? 0;

    dotProduct += resumeFrequency * jobFrequency;
    resumeMagnitude += resumeFrequency ** 2;
    jobMagnitude += jobFrequency ** 2;
  });

  const similarity =
    dotProduct / (Math.sqrt(resumeMagnitude) * Math.sqrt(jobMagnitude));

  return {
    similarity_score: Math.round(similarity * 100),
    note: 'This score measures keyword similarity, not overall job suitability.'
  };
}
