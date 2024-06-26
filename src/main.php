<?php

require 'vendor/autoload.php';

// Récupérez le hash du commit à partir des arguments passés
if ($argc < 2) {
    echo "Usage: php script.php <commit_hash>\n";
    exit(1);
}

$commitHash = $argv[1];

$gitService = new GitService();
$anthropicService = new AnthropicService();
$codeReviewService = new CodeReviewService();

// Exemple de récupération des diffs d'un commit
$repo = 'Quentin1402/qualit--logiciel';
$diff = $gitService->getCommitDiffs($repo, $commitHash);

// Exemple d'analyse du code avec Anthropomorphic-UI
$analysisResult = $anthropicService->analyzeCode($diff);

// Exemple de génération de commentaires de revue de code
$comments = $codeReviewService->generateCodeReviewComments($analysisResult);

// Exemple de publication des commentaires sur GitHub
$codeReviewService->postCommentsToGitHub($comments, $repo, $commitHash);
