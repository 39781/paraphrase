var Paraphrase = require('paraphrase-sentences');
var express 		= require('express');
var router			= express.Router();

router.post('/generatePhrase',function(req, res){
	const key = 'AIzaSyBP_wS9n31lBq-EG6B4_2DwttALyjRfmIE';
	console.log(req.body);
	let paraphrase = new Paraphrase({ key });
	 
	(async () => {
	  let results = await paraphrase.get(req.body.parasent);
	  var resp = "<table><tr><th>Sno</th><th>Variation</th></tr>";
	  i=1;
	  results.forEach(function(result){
		resp+="<tr><td>"+(i++)+"</td><td>"+result+"</td></tr>"
	  })
	  resp+="</table>";
	  res.json({response:resp}).end();
	})();
})

module.exports = router;