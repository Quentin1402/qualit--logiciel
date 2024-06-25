<?php
use PHPUnit\Framework\TestCase;
use GitHub\PullRequestCommenter;

class PullRequestCommenterTest extends TestCase {
    public function testCreateReviewComment() {
        $commenter = new PullRequestCommenter('fake_token');
        $response = $commenter->createReviewComment('user', 'repo', 1, 'comment', 'sha', 'path', 1);

        $this->assertArrayHasKey('id', $response);
    }
}
