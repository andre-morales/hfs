"use strict"
const VERSION_STR = "Alpha 0.97.1";

// Imports
const Path = require('path');
const FS = require('fs');
const HTTP = require('http');
const HTTPS = require('https');
const Express = require('express');
const FileUpload = require('express-fileupload');

var app = null;
const config = { 'GLOBAL': {}};

function main(){
	console.log("HFS v" + VERSION_STR);
	app = Express();
	app.set('view engine', 'ejs');
	app.set('views', './views');
	app.disable('x-powered-by');

	app.use(FileUpload({
		createParentPath: true
	}));
	app.use(Express.json());
	app.use(Express.urlencoded({extended: true})); // Handles POST body translation.
	
	parseConfigFile('config.cnf');
	parseConfigFile('config.private.cnf');
	console.log("-- Config --");
	console.log(config);
	setupHandlers();

	if(config.http.port > 0){
		var httpServer = HTTP.createServer(app);
		httpServer.listen(config.http.port, () => {
			console.log('HTTP Ok.');
		});
	}
	if(config.https.port > 0){
		var pKey  = FS.readFileSync(config.https.pkey, 'utf8');
		var certif = FS.readFileSync(config.https.cert, 'utf8');
		var httpsServer = HTTPS.createServer({key:pKey, cert:certif}, app);
		httpsServer.listen(config.https.port, () => {
			console.log('HTTPS Ok.');
		});
	}
	
	console.log("Setup done.");
}

function parseConfigFile(path){
	var contents = FS.readFileSync(path, 'utf8');
	var lines = contents.split("\n");
	var group = "GLOBAL";

	for(var i = 0; i < lines.length; i++){
		var line = lines[i];
		if(line.trim()){
			if(line.startsWith("[")){
				group = line.substring(1, line.length - 1);
				config[group] = {};
			} else {
				var line_ = line.split(" = ");
				config[group][line_[0]] = line_[1];
			}
		}
	}
}

function setupHandlers(){
	app.use((req, res, next) => {
		var reqURL = decodeURI(req.url);
		var filesSplit = reqURL.split('/');
		if(filesSplit[1] == 'v'){
			const viewr = filesSplit.slice(2).join();
			const viewsp = viewr.split('?');
			var qm = viewsp.slice(1).join();
			var km = qm.split('&');

			var GETValueMap = [];
			for(var i = 0; i < km.length; i++){
				var kmv = km[i];
				var ioe = kmv.indexOf('=');
				var key = kmv.substring(0, ioe);
				var val = kmv.substring(ioe + 1);
				GETValueMap[key] = decodeURIComponent(val);
			}
			res.render(viewsp[0], {'_GET' : GETValueMap});
		} else if(filesSplit[1] == 'files'){	
			var reqInsideFile = filesSplit.slice(2).join('/');
			var reqFilePath = Path.join(config.GLOBAL.folder, reqInsideFile);

			if(req.method == 'GET'){
				console.log("GET [" + req.connection.remoteAddress + "] " + reqInsideFile);	
				if (FS.existsSync(reqFilePath)) {
					var type = FS.lstatSync(reqFilePath);
					if(type.isDirectory()){
						res.render('folder', {
							'folder': reqURL,
							'files': getFileMap(reqFilePath)
						});
						return;
					}
				}
				next();			
			} else if(req.method == 'POST'){
				console.log("POST [: " + req.connection.remoteAddress + "] " + reqInsideFile);
				if(req.body.fileSubmitForm){
					if(req.files){
						var file = req.files.file;
						file.mv(Path.join(reqFilePath, file.name));
					} else {
						console.log("Request files = null. " + req.files);
					}
				} else {
					console.log("Unknown form submit. " + req.files);
				}
				res.render('folder.eta', {
					'folder': reqURL,
					'files': getFileMap(reqFilePath)
				});
			}
		} else {
			if(req.method == 'GET'){
				var reqFilePath = Path.join(__dirname, 'http', reqURL);
				console.log("GET [" + req.connection.remoteAddress + "] " + reqFilePath);	
				if (FS.existsSync(reqFilePath)) {
					var type = FS.lstatSync(reqFilePath);
					if(type.isDirectory()){
						res.render('folder.eta', {
							'folder': reqURL,
							'files': getFileMap(reqFilePath)
						});
						return;
					}
				}		
			}
			next();		
		}
	});

	// Static resource handler
	app.use('/files', Express.static(config.GLOBAL.folder));
	app.use(Express.static('http'));

	// 404 handler.
	app.use((req, res, next) => {
		notfoundHandler(req, res);
	});
}

function notfoundHandler(req, res){
	var reqFile = decodeURI(req.url);
	console.log("request to file " + reqFile + " resulted in 404.");
	res.status(404);
	res.render('404.ejs', {'requestedPage': reqFile});
}

function getFileMap(folder){
	var files = FS.readdirSync(folder);
	var fileMap = [];
	for(var i = 0; i < files.length; i++){
		var file = files[i];
		var filePath = Path.join(folder, file);
		var type = FS.lstatSync(filePath);
		if(type.isDirectory()){
			fileMap.push(file + "/");
		} else {
			fileMap.push(file);
		}
	}
	return fileMap;
}

main();