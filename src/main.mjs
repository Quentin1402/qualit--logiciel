import axios from 'axios';
import { config } from 'dotenv-esm';

config();

const githubToken = process.env.GITHUB_TOKEN;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const [owner, repo] = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/') : [];
const branch = process.env.GITHUB_REF ? process.env.GITHUB_REF.split('/').pop() : '';
const sha = process.env.GITHUB_SHA;

if (!githubToken) {
  console.error('GITHUB_TOKEN is not set');
  process.exit(1);
}

if (!anthropicApiKey) {
  console.error('ANTHROPIC_API_KEY is not set');
  process.exit(1);
}

if (!owner || !repo) {
  console.error('GITHUB_REPOSITORY is not set or invalid');
  process.exit(1);
}

if (!branch) {
  console.error('GITHUB_REF is not set or invalid');
  process.exit(1);
}

if (!sha) {
  console.error('GITHUB_SHA is not set or invalid');
  process.exit(1);
}

console.log(`GITHUB_TOKEN: ${githubToken ? 'set' : 'not set'}`);
console.log(`ANTHROPIC_API_KEY: ${anthropicApiKey ? 'set' : 'not set'}`);

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github.v3+json'
  }
});

async function checkAuthentication() {
  try {
    const response = await githubApi.get('/user');
    console.log("Authenticated as:", response.data.login);
  } catch (error) {
    console.error("Authentication error:", error.message);
  }
}

checkAuthentication();

async function getLastCommitDiff() {
  console.log(`Fetching commits for ${owner}/${repo} branch ${branch}`);

  try {
    const response = await githubApi.get(`/repos/${owner}/${repo}/commits`, {
      params: {
        sha: branch,
        per_page: 1
      }
    });

    console.log('Commits response:', response.data);

    if (!response.data || response.data.length === 0) {
      throw new Error('No commits found');
    }

    const lastCommit = response.data[0];
    console.log(`Fetching diff for commit ${lastCommit.sha}`);

    const diffResponse = await githubApi.get(`/repos/${owner}/${repo}/commits/${lastCommit.sha}`);

    if (!diffResponse.data || !diffResponse.data.files) {
      throw new Error('No diff data found');
    }

    return diffResponse.data.files.map(file =>
      `File: ${file.filename}\nChanges: ${file.changes}\nAdditions: ${file.additions}\nDeletions: ${file.deletions}\nPatch:\n${file.patch}`
    ).join('\n\n');
  } catch (error) {
    console.error('Error fetching commits:', error);
    throw error;
  }
}

async function analyzeCodeWithClaude(diffs) {
  console.log(`Analyzing code with Claude for diffs:\n${diffs}`);

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
  } catch (error) {
    console.error('Error analyzing code with Claude:', error);
    throw error;
  }
}

async function postReviewComments(comments) {
  console.log(`Posting review comments to ${owner}/${repo} commit ${sha}`);

  try {
    await githubApi.post(`/repos/${owner}/${repo}/commits/${sha}/comments`, {
      body: comments
    });

    console.log("Review comments posted successfully");
  } catch (error) {
    console.error('Error posting review comments:', error);
    throw error;
  }
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
