<?php
namespace GitHub;

use GuzzleHttp\Client;

class CommitFetcher {
    private $client;
    private $token;

    public function __construct($token) {
        $this->client = new Client();
        $this->token = $token;
    }

    public function getDiff($repoOwner, $repoName, $commitSha) {
        $url = "https://api.github.com/repos/$repoOwner/$repoName/commits/$commitSha";
        $response = $this->client->request('GET', $url, [
            'headers' => [
                'Authorization' => "token $this->token"
            ]
        ]);

        $commit = json_decode($response->getBody(), true);
        $diffUrl = $commit['html_url'] . '.diff';

        $diffResponse = $this->client->request('GET', $diffUrl);
        return $diffResponse->getBody()->getContents();
    }
}
