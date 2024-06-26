import { Octokit } from "@octokit/rest";
import axios from 'axios';
import { config } from 'dotenv-esm';

config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function getLastCommitDiff() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const branch = process.env.GITHUB_REF.split('/').pop();

  console.log(`Owner: ${owner}, Repo: ${repo}, Branch: ${branch}`);

  const { data: commits } = await octokit.repos.listCommits({
    owner,
    repo,
    sha: branch,
    per_page: 1
  });

  if (!commits || commits.length === 0) {
    throw new Error("No commits found.");
  }

  const lastCommit = commits[0];
  console.log(`Last Commit SHA: ${lastCommit.sha}`);

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
  try {
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

    console.log(`Anthropic API Response: ${JSON.stringify(response.data)}`);

    return response.data.completion;
  } catch (error) {
    console.error('Error during analysis with Claude:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function postReviewComments(comments) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const sha = process.env.GITHUB_SHA;

  console.log(`Posting comments to ${owner}/${repo} on commit ${sha}`);

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
    console.log(`Diffs: ${diffs}`);
    const analysis = await analyzeCodeWithClaude(diffs);
    console.log(`Analysis: ${analysis}`);
    await postReviewComments(analysis);
    console.log("Code review completed successfully");
  } catch (error) {
    console.error("Error during code review:", error);
    process.exit(1);
  }
}

main();
