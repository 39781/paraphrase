var express 		= require('express');
var router			= express.Router();	 
var fs 				= require("fs");	
var request			= require('request');
var config			= require('./config.js');
var path			= require("path");	
var url 			= require('url');	
const {google}		= require('googleapis');
const key			= require('./testBot.json');
const auth0			= require('./utilities/auth0.js');
const actions		= require('./actions/actions.js');
const jwtMiddleware = require('express-jwt')
var jwksClient 		= require('jwks-rsa');
//const {dialogflow,Suggestions,SimpleResponse} = require('actions-on-google');
const {WebhookClient, Text, Card, Image, Suggestion, Payload, List} = require('dialogflow-fulfillment');
var sessID;



router.use('/auth0/psMicroService',function(req, res, next){
	var client = jwksClient({
		jwksUri: config.appDet.jwksUri
	});
	function getKey(header, callback){
	  client.getSigningKey(header.kid, function(err, key) {
		var signingKey = key.publicKey || key.rsaPublicKey;
		callback(null, signingKey);
	  });
	}
	if (req.headers.authorization){
		var auth = req.headers.authorization.split(' ');
		if(auth[0] === 'Bearer'){
			return jwt.verify(auth[1], getKey, {algorithms:config.appDet.alg,issuer:config.appDet.issuer,audience:req.session.audience}, function(err, decoded) {
				if(err){
					const err = new Error('Not Found');
					err.status = 404;
					next(err);
				}else{
					next();
				}			
			});
		}else{
			const err = new Error('Not Found');
			err.status = 404;
			next(err);
		}			
    } 
});
/*router.use('/auth0/psMicroService', jwtMiddleware({
  secret: jwksClient.expressJwtSecret({
			cache: true,
			rateLimit: true,
			jwksRequestsPerMinute: 5,
			jwksUri: config.appDet.jwksUri
		  }), 
  getToken: function (req) {
	  console.log('headers',req.headers)
    if (req.headers.authorization){
		var auth = req.headers.authorization.split(' ');
		if(auth[0] === 'Bearer'){
			return auth[1];
		}else{
			return null;
		}			
    } else if (req.query && req.query.token) {
		return req.query.token;
      return req.query.token;
    } else if (req.cookies && req.cookies.token) {      
      return req.cookies.token;
    }    
    return null; 
  }
}));*/

router.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('your are not authorized person to get information. please login to get authorization');
  }
});

router.post('/auth0/psMicroService', function(req,res){
	console.log(req.body);
	request.get(req.body.api, {'json': true}, (err, httpResponse, body) => {
		 if(err){
			 console.log('err',err);
			 res.json(err).end();
		 }else{
			 res.json(body).end();
		 }		 
	});
});
router.post('/auth0/wdMicroService', function(req,res){
	console.log(req.body);
	request.get(req.body.api, {'json': true}, (err, httpResponse, body) => {
		 if(err){
			 console.log('err',err);
			 res.json(err).end();
		 }else{
			 res.json(body).end();
		 }		 
	});
});
router.post('/auth0/artMicroService', function(req,res){
	console.log(req.body);
	request.get(req.body.api, {'json': true}, (err, httpResponse, body) => {
		 if(err){
			 console.log('err',err);
			 res.json(err).end();
		 }else{
			 res.json(body).end();
		 }		 
	});
});
router.post('/auth0/snowMicroService', function(req,res){
	console.log(req.body);
	request.get(req.body.api, {'json': true}, (err, httpResponse, body) => {
		 if(err){
			 console.log('err',err);
			 res.json(err).end();
		 }else{
			 res.json(body).end();
		 }		 
	});
});


router.post('/botHandler',function(req, res){		
	var responseObj = JSON.parse(JSON.stringify(config.responseObj));
	//console.log(JSON.stringify(req.body));
	var actionName = req.body.queryResult.action;	
	console.log(actionName);	
	
	userCheck(req.body)
	.then(function(resp){
		console.log(resp);
		res.status(200);
		res.json(resp).end();
	})
	.catch(function(err){
		res.status(400);
		res.json(err).end();
	})
		
});	


router.post('/validateUser',function(req, res){
	var accDet = {};
	/*var adConfig = JSON.parse(JSON.stringify(config.adCred));
		adConfig['user'] ={
			username : req.body.username,
			password : req.body.passwd
		};			
	auth0.authenticateAD(adConfig)*/
	var adConfig = JSON.parse(JSON.stringify(config.adAuthObj));
		adConfig['username'] = req.body.username;
		adConfig['password'] = req.body.passwd;		
	auth0.authenticateAuth0AD(adConfig,config.auth0ADlogin)
	.then(function(result){
		console.log('result',result);
		if(!result){
			res.status(400);
			res.json({status:'invalid user'}).end();
		}else{
			/*var uname = req.body.username.toLowerCase();
			var smsApi = config.smsApi.replace('phonenumber',config.employees[uname].ph);	
			smsApi = smsApi.replace('Otpnumber',45627);
			smsApi = smsApi.replace('name',config.employees[uname].name);
			loggedUsers[req.body.sess] = {
				otp:45627,
				access_token:''
			};
			console.log(smsApi,config.employees[uname].ph);
			request(smsApi,function(error,response,body){
				console.log('error',error,'body',body);
				res.status(200);
				res.json({status:true}).end();
			});*/
			accDet['domainName'] = config.appDet.domainName;
			accDet['clientID'] = config.appDet.clientID,
			accDet['phoneNumber'] = config.employees[req.body.username.toLowerCase()].ph;
			accDet['redirectUri'] = config.appDet.redirectUri;
			console.log({status:'valid user','accDet':accDet});
			res.status(200);
			res.json({status:'valid user','accDet':accDet}).end();
		}
	})
	.catch(function(err){
		console.log('err',err);
		res.status(400);
		res.json({status:'Technical Issue'}).end();
	});	
})

var userCheck = function(requ){	
	return new Promise(function(resolve, reject){
		console.log(JSON.stringify(requ));
		var uid = requ.originalDetectIntentRequest.payload.user.userId;
		if(typeof(loggedUsers[uid])!='undefined'){
			var options = {
				idToken:loggedUsers[uid].access_token,
				issuer:config.appDet.issuer,
				audience:config.appDet.audience,
				jwksUri:config.appDet.jwksUri
			};
			return auth0.tokenVerifier(options)
			.then(function(result){
				console.log(result);
				console.log(requ.queryResult.action);
				console.log(JSON.stringify(requ.queryResult.fulfillmentMessages));
				switch(requ.queryResult.action){
					case 'input.welcome':resolve(actions.gotoMenu());break;					
					default : resolve(actions.sendResponses(requ.queryResult.fulfillmentMessages));break;
					//default:agent.add(agent.consoleMessages);
				}
			})
			.catch(function(err){
				console.log(err);								
				reject({
					"fulfillmentText": '',
					"followupEventInput":{
						"name": "mainMenu", 
						"parameters" : { 
							text:"You are not a authorized user, please login, Hi I'm Hema !. I can help you to manage your leave, search an employee, account recovery and create or track your service tickets. Kindly select an option below to continue.",
							session:requ.originalDetectIntentRequest.payload.user.userId
						},					
					}
				});
			})
				
			/*if(requ.queryResult.action == 'input.welcome'){
				agent.setFollowupEvent("gotoMenu");
			}else{
				agent.add(agent.consoleMessages); 
			}*/							
			//return;
			
			
		}else{
			resolve({
				"fulfillmentText": '',
				"followupEventInput":{
					"name": "mainMenu", 
					"parameters" : { 
						text:"Hi I'm Hema !. I can help you to manage your leave, search an employee, account recovery and create or track your service tickets. Kindly select an option below to continue.",
						session:requ.originalDetectIntentRequest.payload.user.userId
					}
				}
			});			
		}
	})
}





router.get('/redirectUri',function(req,res){	
	res.redirect('https://logintests.herokuapp.com/redirectPage.html?sno='+req.query.sno+'&empId='+req.query.empId+'&userId='+req.query.userId);	
});


router.post('/generateAccessToken',function(req, res){
	console.log(req.body.url);
	var params = url.parse(req.body.url, true).query;
	loggedUsers[params.userId] = params		
	/*auth0.generateToken(config.microServicesApis.common, config.appDet.tokenEndPoint)
	.then(function(result){
		console.log(result);
		loggedUsers[params.userId]['access_token'] = result.access_token;
		res.status(200);
		res.send('close');
		res.end();
	})
	.catch(function(err){
		res.status(400);
		res.send("Authentication failed due to some technical issue. Try again later");
		res.end();
	});*/
	if(params.sno==2){
		loggedUsers[params.userId]['access_token'] = params.access_token;		
		console.log(loggedUsers[params.userId]);
		console.log('redirecurl',redirectUrl);
		testAccessTokenValidation(params.access_token,config.apis[0]);
		res.header('content-type','text/plain');
		res.status(200);
		res.json(redirectUrl).end();
	}else{
		loggedUsers[params.userId] = params	

		redirectUrl = config.appDet.authorize+'?scope='+config.appDet.scope+'&audience='+config.appDet.audience+'&response_type='+config.appDet.responseType+'&client_id='+config.appDet.clientID+'&redirect_uri='+encodeURIComponent("https://logintests.herokuapp.com/redirectUri?sno=2&empId="+params.empId+"&userId="+params.userId)+'&nonce='+params.access_token+'&prompt=none';
		
		console.log(redirectUrl);		
		res.header('content-type','text/plain');
		res.status(200);
		res.send(redirectUrl);
		res.end();
	}
	console.log(params);		
			
	//tokenVerifier(params.id_token,);
	
})
//https://github.com/actions-on-google/dialogflow-facts-about-google-nodejs/blob/master/functions/index.js
var testAccessTokenValidation = function(token, peopleSoftAPI){
	request.post('https://logintests.herokuapp.com/auth0/psMicroService', {
		'auth': {
		  'bearer': token
		 },
		'json': true,
		'body':{api:peopleSoftAPI}
		}, (err, httpResponse, body) => {
		  console.log(err,body);
		 console.log(httpResponse.statusCode + ': ' + httpResponse.statusMessage);
	});
}


/*function sendConfirmation(session){
	let jwtClient = new google.auth.JWT(
	  key.client_email, null, key.private_key,
	  ['https://www.googleapis.com/auth/cloud-platform'],
	  null
	);	
	//https://actions.googleapis.com/v2/conversations:send
	jwtClient.authorize((err, tokens) => {	 
	  request.post(config.dialogFlowAPI.replace('sessions', session), {
		'auth': {
		  'bearer': tokens.access_token,
		 },
		'json': true,
		'body':{"queryInput":{"event":{"name":"loginSuccessEvent","languageCode":"en"}}}
	  }, (err, httpResponse, body) => {
		  console.log(err,body);
		 console.log(httpResponse.statusCode + ': ' + httpResponse.statusMessage);
	  });
	});
}*/

  
module.exports = router;



			