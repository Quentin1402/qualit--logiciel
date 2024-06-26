const { Octokit } = require("@octokit/rest");
const axios = require('axios');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function getLastCommitDiff() {
  const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
  const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
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
  const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
  const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
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