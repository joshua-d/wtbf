let express = require('express');
let path = require('path');
let router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/../../frontend/build/index.html'));
});

router.get('/test', function(req, res, next) {
    res.sendFile(path.join(__dirname, '/../views/test.html'));
});



module.exports = router;
