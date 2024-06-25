<?php
require 'vendor/autoload.php';

use GitHub\CommitFetcher;
use GitHub\PullRequestCommenter;
use OpenAI\CodeAnalyzer;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$githubToken = getenv('GITHUB_TOKEN');
$openaiApiKey = getenv('OPENAI_API_KEY');

$repoOwner = 'utilisateur';
$repoName = 'repository';
$commitSha = 'sha_du_commit';
$prNumber = 1;  // Numéro de la pull request
$path = 'chemin/vers/le/fichier';
$position = 1;  // Position dans le diff

$commitFetcher = new CommitFetcher($githubToken);
$diff = $commitFetcher->getDiff($repoOwner, $repoName, $commitSha);

$codeAnalyzer = new CodeAnalyzer($openaiApiKey);
$diffComments = $codeAnalyzer->analyzeCodeDiff($diff);

$pullRequestCommenter = new PullRequestCommenter($githubToken);
$pullRequestCommenter->createReviewComment($repoOwner, $repoName, $prNumber, $diffComments, $commitSha, $path, $position);
