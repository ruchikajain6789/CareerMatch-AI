const BACKEND_URL = "http://127.0.0.1:8000";

export interface ResumeMatchResult {
  similarity_score: number;
  note: string;
}

export async function compareResumeWithJob(
  resumeText: string,
  jobText: string
): Promise<ResumeMatchResult> {
  const response = await fetch(`${BACKEND_URL}/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume_text: resumeText,
      job_text: jobText,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resume comparison failed: ${response.status}`);
  }

  return response.json() as Promise<ResumeMatchResult>;
}