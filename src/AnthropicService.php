<?php

use GuzzleHttp\Client;

class AnthropicService
{
    private $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    public function analyzeCode($diff)
    {
        $response = $this->client->post('https://api.anthropic.com/v1/analyze-code', [
            'headers' => [
                'Authorization' => 'Bearer ' . getenv('ANTHROPIC_API_KEY'),
                'Content-Type' => 'application/json'
            ],
            'json' => [
                'code_diff' => $diff,
                'max_tokens' => 500
            ]
        ]);

        return json_decode($response->getBody()->getContents(), true);
    }

    public function detectBugs($diff)
    {
        $response = $this->client->post('https://api.anthropic.com/v1/detect-bugs', [
            'headers' => [
                'Authorization' => 'Bearer ' . getenv('ANTHROPIC_API_KEY'),
                'Content-Type' => 'application/json'
            ],
            'json' => [
                'code_diff' => $diff,
                'max_tokens' => 500
            ]
        ]);

        return json_decode($response->getBody()->getContents(), true);
    }
}
