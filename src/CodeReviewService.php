<?php

use GuzzleHttp\Client;

class CodeReviewService
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    public function generateCodeReviewComments($analysisResult)
    {
        // Placeholder function for generating code review comments
        $comments = [];

        foreach ($analysisResult as $result) {
            $comments[] = "Line " . $result['line_number'] . ": " . $result['comment'];
        }

        return $comments;
    }

    public function postCommentsToGitHub($comments, $repo, $commitHash)
    {
        $client = new Client(); // Define the Client object from GuzzleHttp

        foreach ($comments as $comment) {
            $response = $client->post("https://api.github.com/repos/$repo/commits/$commitHash/comments", [
                'headers' => [
                    'Authorization' => 'token ' . getenv('GITHUB_TOKEN'),
                    'Accept' => 'application/vnd.github.v3+json'
                ],
                'json' => [
                    'body' => $comment,
                    'path' => '<file_path>',
                    'position' => '<line_number>'
                ]
            ]);
        }
    }
}
