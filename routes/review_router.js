const express = require('express');
const router = express.Router();

const { ROUTES_REVIEWS } = require('../utils/utils.js');
const methods = require('../controllers/review_controller.js');

router.route(ROUTES_REVIEWS.reviews).get(methods.getReviews);
router.route(ROUTES_REVIEWS.reviews_by_bootcampID).get(methods.getReviewsForBootcamp);
router.route(ROUTES_REVIEWS.review_by_reviewID).get(methods.getReview);

router.route(ROUTES_REVIEWS.review_by_reviewID).post(methods.createReview);
router.route(ROUTES_REVIEWS.review_by_reviewID).put(methods.updateReview);
router.route(ROUTES_REVIEWS.review_by_reviewID).delete(methods.deleteReview);


module.exports = router;