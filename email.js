/*----------------------------------------------------------------------------
email.js - Send email from external email provider.
Subject, to, cc, bcc, body, attachments as passed as arguments.

When called from IBMi QSH this can't handle Unicode.  
Use emailUTF8 instead, all parms are inside a UTF8 file.

Paul Foster, Nov 2018
----------------------------------------------------------------------------*/

var nodemailer  = require('nodemailer');
var fs = require('fs');

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
	//port: credentials.port,
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

//Get email details from passed parameters
var emailsubject = process.argv[2];
var emailto      = process.argv[3];
var emailcc      = process.argv[4];
var emailbcc     = process.argv[5];
var emailbody    = process.argv[6];
var attachments  = process.argv[7];

attachObject = {path: attachments};
emailattach = [attachObject];

var mailOptions = {
	from: credentials.from,
	to:  emailto,
	cc:  emailbcc,
	bcc: emailcc,
	subject: emailsubject,
	html: emailbody,
	attachments: emailattach
};

// verify connection configuration - comment out when working
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
var filename = '/home/tempfile/email_' + ymd + '.txt';

transporter.sendMail(mailOptions, function(error, info){
	if (error) {
	  console.log(error);
	  rtn = datestring + ' - ' + 'Error: ' + error + '\n';
	} else {
		//console.log('Email sent: ' + info.response);
		rtn = datestring + ' - ' + 'to: ' + emailto;
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
