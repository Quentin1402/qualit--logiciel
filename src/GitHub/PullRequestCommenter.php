<?php
namespace GitHub;

use GuzzleHttp\Client;

class PullRequestCommenter {
    private $client;
    private $token;

    public function __construct($token) {
        $this->client = new Client();
        $this->token = $token;
    }

    public function createReviewComment($repoOwner, $repoName, $prNumber, $comment, $commitSha, $path, $position) {
        $url = "https://api.github.com/repos/$repoOwner/$repoName/pulls/$prNumber/comments";
        
        $response = $this->client->request('POST', $url, [
            'headers' => [
                'Authorization' => "token $this->token",
                'Content-Type' => 'application/json'
            ],
            'json' => [
                'body' => $comment,
                'commit_id' => $commitSha,
                'path' => $path,
                'position' => $position
            ]
        ]);

        return json_decode($response->getBody(), true);
    }
}
