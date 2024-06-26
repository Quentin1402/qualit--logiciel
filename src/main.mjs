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

  console.log(`Fetching commits for ${owner}/${repo} branch ${branch}`);

  const { data: commits } = await octokit.repos.listCommits({
    owner,
    repo,
    sha: branch,
    per_page: 1
  });

  if (!commits || commits.length === 0) {
    throw new Error('No commits found');
  }

  const lastCommit = commits[0];
  console.log(`Fetching diff for commit ${lastCommit.sha}`);

  const { data: diff } = await octokit.repos.getCommit({
    owner,
    repo,
    ref: lastCommit.sha
  });

  if (!diff || !diff.files) {
    throw new Error('No diff data found');
  }

  return diff.files.map(file => 
    `File: ${file.filename}\nChanges: ${file.changes}\nAdditions: ${file.additions}\nDeletions: ${file.deletions}\nPatch:\n${file.patch}`
  ).join('\n\n');
}

async function analyzeCodeWithClaude(diffs) {
  console.log(`Analyzing code with Claude for diffs:\n${diffs}`);

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
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }
  });

  if (!response.data || !response.data.content) {
    throw new Error('Invalid response from Claude API');
  }

  console.log(`Analysis result from Claude:\n${JSON.stringify(response.data, null, 2)}`);

  return response.data.content[0].text;
}

async function postReviewComments(comments) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const sha = process.env.GITHUB_SHA;

  console.log(`Posting review comments to ${owner}/${repo} commit ${sha}`);

  await octokit.repos.createCommitComment({
    owner,
    repo,
    commit_sha: sha,
    body: comments
  });

  console.log("Review comments posted successfully");
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
