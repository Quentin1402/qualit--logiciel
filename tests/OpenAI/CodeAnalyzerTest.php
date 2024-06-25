<?php
use PHPUnit\Framework\TestCase;
use OpenAI\CodeAnalyzer;

class CodeAnalyzerTest extends TestCase {
    public function testAnalyzeCodeDiff() {
        $analyzer = new CodeAnalyzer('fake_api_key');
        $comments = $analyzer.analyzeCodeDiff('fake_diff');

        $this->assertNotEmpty($comments);
    }
}
