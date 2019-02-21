//-------------------------------------------------------------------
// Accept UTF8 file as a parameter (process.argv)
// File contains to, subject, body, cc, bcc, attachment link in json
// Read file and process json to get details to email
//
// Paul Foster, November 2018
//-------------------------------------------------------------------

var fs = require('fs');
var nodemailer = require('nodemailer');

var credentials = require('./credentials');
/* credentials stored as object in separate file so can hide from Git. Format is:
var creds = {
  from: 'noreply@myemail.com',
  host: 'smtp.myemail.com', 
  port: 587,
  secure: false,
  user: 'myuser@myemail.com',
  pass: 'password'
}
module.exports = creds;
*/

//Set up transporter using data from credentials file
var transporter = nodemailer.createTransport({
	host: credentials.host,
	port: credentials.port,
	secure: credentials.secure,
	auth: {
	  user: credentials.user,
	  pass: credentials.pass
	},
	tls: {
	//  //do not fail if cert invalid
	  rejectUnauthorized: false
	}
});


var emailsubject = '';
var emailto      = '';
var emailcc      = '';
var emailbcc     = '';
var emailbody    = '';
var emailattach  = '';

//Get file name from passed parm.  The file is saved to IFS
var infile = process.argv[2];

//Read file synchronously (it's small, no need to asynch)
try {  
    var data = fs.readFileSync(infile, 'utf8');
} catch(e) {
    console.log('Error:', e.stack);
	return;
}

var content = JSON.parse(data);    

if (typeof content.subject != 'undefined') {
  var emailsubject = content.subject;
}	
if (typeof content.toAddress != 'undefined') {
  var emailto = content.toAddress;
}
if (typeof content.ccAddress != 'undefined') {
  var emailcc = content.ccAddress;
}
if (typeof content.bccAddress != 'undefined') {
  var emailbcc = content.bccAddress;
}
if (typeof content.body != 'undefined') {
  var emailbody = content.body;
}
if (typeof content.attachments != 'undefined') {
  var emailattach = content.attachment; 
}

var mailOptions = {
	from: credentials.from,
	to:  emailto,
	cc:  emailcc,
	bcc: emailbcc,
	subject: emailsubject,
	html: emailbody,
	attachments: emailattach
};

// verify connection configuration
/*
transporter.verify(function(error, success) {
   if (error) {
        console.log(error);
   } else {
        console.log('Server is ready to take our messages');
   }
});
*/

var rtn = '';

//Date time in local timezone ...
var date = new Date(); 
var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000); 
var offset = date.getTimezoneOffset() / 60; 
var hours = date.getHours(); 
newDate.setHours(hours - offset); 

var datestring = date.toLocaleString();

//Get yyyymmdd for log file name
var year = date.getFullYear().toString(); 
var month = (date.getMonth() + 1).toString(); 
var day = date.getDate().toString(); 
(day.length == 1) && (day = '0' + day);	 
(month.length == 1) && (month = '0' + month); 
var ymd = year + month + day;
var filename = '/home/tempfile/email_' + ymd + '.log';

transporter.sendMail(mailOptions, function(error, info){
	if (error) {
	  //console.log(error);
	  rtn = datestring + ' - ' + 'Error: ' + error + '\n';
	} else {
		//console.log('Email sent: ' + info.response);
		rtn = datestring + ' - ' + 'to: ' + emailto + ',  cc: ' + emailcc + ',  bcc: ' + emailbcc;
		if (typeof emailsubject != 'undefined') {
			rtn += ', subject: ' + emailsubject;
		}  		  
		if (typeof attachments != 'undefined') {
			rtn += ', attachment: ' + attachments;
		} 
		rtn += '\n';
	}
	  
	//append content at the end of the file:
	fs.appendFile(filename, rtn, function (err) {
	  if (err) throw err;
	    console.log('Updated!');
	});

	
});

