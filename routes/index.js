var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/TV', function(req, res, next) {
  res.render('indexTV');
});

router.get('/controller/:id', function(req, res, next){
	res.render('controller');
} )

router.get('/r/:id', function(req, res, next){
	var roomId = req.path.split('/')[2];
	res.render('room', {room: roomId});
});

router.get('/TV/r/:id', function(req, res, next){
	var roomId = req.path.split('/')[3];
	res.render('roomTV', {room: roomId});
});

router.get('/test/', function(req, res, next){
	res.render('test');
})


module.exports = router;
