<?php

use GuzzleHttp\Client;

class GitService
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    public function getCommitDiffs($repo, $commitHash)
    {
        $response = $this->client->get("https://api.github.com/repos/$repo/commits/$commitHash", [
            'headers' => [
                'Authorization' => 'token ' . getenv('GITHUB_TOKEN'),
                'Accept' => 'application/vnd.github.v3.diff'
            ]
        ]);

        return $response->getBody()->getContents();
    }
}
