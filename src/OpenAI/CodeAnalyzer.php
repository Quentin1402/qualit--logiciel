<?php
namespace OpenAI;

use GuzzleHttp\Client;

class CodeAnalyzer {
    private $client;
    private $apiKey;

    public function __construct($apiKey) {
        $this->client = new Client();
        $this->apiKey = $apiKey;
    }

    public function analyzeCodeDiff($diff) {
        $prompt = "Analyze the following code diff and provide code review comments:\n\n$diff\n\nComments:";

        $response = $this->client->request('POST', 'https://api.openai.com/v1/completions', [
            'headers' => [
                'Authorization' => "Bearer $this->apiKey",
                'Content-Type' => 'application/json'
            ],
            'json' => [
                'model' => 'text-davinci-003',
                'prompt' => $prompt,
                'max_tokens' => 150,
                'temperature' => 0.7
            ]
        ]);

        $body = json_decode($response->getBody(), true);
        return $body['choices'][0]['text'];
    }
}
