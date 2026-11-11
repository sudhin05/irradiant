<?php
/**
 * Irradiant — contact form handler.
 * Works on Hostinger shared hosting (PHP mail()). For better deliverability,
 * create the mailbox below in hPanel so the From address is a real, authenticated sender.
 */

declare(strict_types=1);

const TO_EMAIL   = 'info@irradiant.in';
const FROM_EMAIL = 'noreply@irradiant.in';   // must be a mailbox on the irradiant.in domain
const SITE_NAME  = 'Irradiant website';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'Method not allowed.']);
}

// Honeypot: real visitors never fill this hidden field.
if (!empty($_POST['company'])) {
    respond(200, ['ok' => true]);
}

// Basic rate limit: one submission per 30 seconds per session.
session_start();
if (isset($_SESSION['last_submit']) && time() - $_SESSION['last_submit'] < 30) {
    respond(429, ['ok' => false, 'error' => 'Please wait a moment before sending another message.']);
}

$clean = static function (string $key, int $max): string {
    $v = trim((string)($_POST[$key] ?? ''));
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
};

$name     = str_replace("\n", ' ', $clean('name', 120));
$email    = str_replace("\n", '', $clean('email', 160));
$phone    = str_replace("\n", ' ', $clean('phone', 40));
$interest = str_replace("\n", ' ', $clean('interest', 60));
$message  = $clean('message', 4000);

if ($name === '' || $email === '' || $message === '') {
    respond(422, ['ok' => false, 'error' => 'Please fill in your name, email and enquiry.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'Please enter a valid email address.']);
}

$subject = 'New enquiry from ' . $name . ($interest !== '' ? " ({$interest})" : '');
$body = "New enquiry via irradiant.in\n"
      . str_repeat('-', 40) . "\n"
      . "Name:     {$name}\n"
      . "Email:    {$email}\n"
      . "Phone:    " . ($phone !== '' ? $phone : '-') . "\n"
      . "Interest: " . ($interest !== '' ? $interest : '-') . "\n"
      . str_repeat('-', 40) . "\n\n"
      . $message . "\n\n"
      . "Sent: " . date('Y-m-d H:i:s') . " | IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$headers = [
    'From: ' . SITE_NAME . ' <' . FROM_EMAIL . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
];

$sent = mail(TO_EMAIL, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers), '-f' . FROM_EMAIL);

if (!$sent) {
    respond(500, ['ok' => false, 'error' => 'We could not send your message right now. Please email info@irradiant.in directly.']);
}

$_SESSION['last_submit'] = time();
respond(200, ['ok' => true]);
