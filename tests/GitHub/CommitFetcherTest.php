<?php
use PHPUnit\Framework\TestCase;
use GitHub\CommitFetcher;

class CommitFetcherTest extends TestCase {
    public function testGetDiff() {
        $fetcher = new CommitFetcher('fake_token');
        $diff = $fetcher->getDiff('user', 'repo', 'sha');

        $this->assertNotEmpty($diff);
    }
}
