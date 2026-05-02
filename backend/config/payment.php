<?php
// Payment gateway configuration (HARDCODED - for testing only)

if (!defined('RAZORPAY_KEY_ID')) {
    define('RAZORPAY_KEY_ID', 'rzp_test_RH6BCRHYRKNmRY');
}

if (!defined('RAZORPAY_KEY_SECRET')) {
    define('RAZORPAY_KEY_SECRET', 'gJ4Kqbjukx9CihPEBJgoDfhM');
}

if (!defined('RAZORPAY_CHECKOUT_NAME')) {
    define('RAZORPAY_CHECKOUT_NAME', 'CodeHub');
}

if (!defined('RAZORPAY_CHECKOUT_DESCRIPTION')) {
    define('RAZORPAY_CHECKOUT_DESCRIPTION', 'Course Enrollment');
}