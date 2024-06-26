import { Octokit } from "@octokit/rest";
import axios from 'axios';
import { config } from 'dotenv-esm';

config();

const githubToken = process.env.GITHUB_TOKEN;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!githubToken) {
  console.error('GITHUB_TOKEN is not set');
  process.exit(1);
}

if (!anthropicApiKey) {
  console.error('ANTHROPIC_API_KEY is not set');
  process.exit(1);
}

console.log(`GITHUB_TOKEN: ${githubToken ? 'set' : 'not set'}`);
console.log(`ANTHROPIC_API_KEY: ${anthropicApiKey ? 'set' : 'not set'}`);

const octokit = new Octokit({ auth: githubToken });

async function getLastCommitDiff() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const branch = process.env.GITHUB_REF.split('/').pop();

  const { data: commits } = await octokit.repos.listCommits({
    owner,
    repo,
    sha: branch,
    per_page: 1
  });

  const lastCommit = commits[0];
  const { data: diff } = await octokit.repos.getCommit({
    owner,
    repo,
    ref: lastCommit.sha
  });

  return diff.files.map(file => 
    `File: ${file.filename}\nChanges: ${file.changes}\nAdditions: ${file.additions}\nDeletions: ${file.deletions}\nPatch:\n${file.patch}`
  ).join('\n\n');
}

async function analyzeCodeWithClaude(diffs) {
  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze the following code diffs and provide code review comments: ${diffs}`
      }
    ]
  }, {
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }
  });

  return response.data.content[0].text;
}

async function postReviewComments(comments) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const sha = process.env.GITHUB_SHA;

  await octokit.repos.createCommitComment({
    owner,
    repo,
    commit_sha: sha,
    body: comments
  });
}

async function main() {
  try {
    const diffs = await getLastCommitDiff();
    const analysis = await analyzeCodeWithClaude(diffs);
    await postReviewComments(analysis);
    console.log("Code review completed successfully");
  } catch (error) {
    console.error("Error during code review:", error);
    process.exit(1);
  }
}

main();
