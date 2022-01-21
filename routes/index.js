var express = require('express');
var path = require('path');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.sendFile(path.join(__dirname, '/../views/home.html'));
});

router.get('/test', function(req, res, next) {
    res.sendFile(path.join(__dirname, '/../views/test.html'));
});

module.exports = router;
