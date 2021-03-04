"use strict"
const VERSION_STR = "Alpha 1.0.0";

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
				if(!config[group]){
					config[group] = {};
				}
			} else {
				var line_ = line.split(" = ");
				var key = line_[0];
				if(config[group][key]){
					delete config[group][key];
				}
				config[group][key] = line_[1];
			}
		}
	}
}

function setupHandlers(){
	app.use((req, res, next) => {
		var reqURL = decodeURI(req.url);
		var pathSplit = reqURL.split('/');
		if(pathSplit[1] == 'v'){
			const viewstr = pathSplit.slice(2).join();
			const viewPath = viewstr.substring(0, viewstr.indexOf('?'));
			var GETValueMap = parseGETMap(viewstr);

			res.render(viewPath, {
				'_GET' : GETValueMap,
				FS: FS,
				Path: Path,
				'S': {
					path_resolveVirtual: path_resolveVirtual,
					path_normalize: path_normalize,
				}
			});
		} else {
			next();
		}
	});

	for(const [mountPoint, mountLocation] of Object.entries(config.folders)){
		app.use(mountPoint, (req, res, next) => {
			var virtualFile = decodeURI(req.url);
			var virtualRootURL = path_normalize(Path.join(mountPoint, virtualFile));
			path_resolveVirtual(virtualRootURL);
			var relativePath = Path.join(mountLocation, virtualFile);

			console.log(req.method + " [: " + req.connection.remoteAddress + "] " + virtualFile);
			if(req.method == 'GET'){
				if (FS.existsSync(relativePath)) {
					var type = FS.lstatSync(relativePath);
					if(type.isDirectory()){
						res.render('folder', {
							'folder': virtualRootURL,
							'files': getFileMap(relativePath)
						});
						return;
					}
				}
				next();			
			} else if(req.method == 'POST'){
				if(req.body.fileSubmitForm){
					if(req.files){
						var file = req.files.file;
						file.mv(Path.join(relativePath, file.name));
					} else {
						console.log("Request files = null. " + req.files);
					}
				} else {
					console.log("Unknown form submit. " + req.files);
				}
				res.render('folder', {
					'folder': virtualRootURL,
					'files': getFileMap(relativePath)
				});
			}
		});
	}

	// Static resource handler
	for(var i in config.folders){
		var mountLocation = config.folders[i];
		console.log("[" + i + "] = " + mountLocation);
		app.use(i, Express.static(mountLocation));
	}
	app.use(Express.static('http'));

	// 404 handler.
	app.use((req, res) => {
		var reqFile = decodeURI(req.url);
		console.log("request to file " + reqFile + " resulted in 404.");
		res.status(404);
		res.render('404.ejs', {'requestedPage': reqFile});
	});
}

function path_resolveVirtual(path){
	path = path.replace(/\\/g, '/');
	for(const [mountPoint, mountLocation] of Object.entries(config.folders)){
		if(path.startsWith(mountPoint)){
			var relativePath = path_normalize(Path.join(mountLocation, path.substring(mountPoint.length)));
			return relativePath;
		}
	}
	console.log("Couldn't resolve virtual path: " + path);
	return null;
}

function path_normalize(path){
	return Path.normalize(path).replace(/\\/g, '/');
}

function parseGETMap(string){
	var GETValueMap = [];
	var i = string.lastIndexOf('?');
	var qm;
	if(i == -1){
		qm = string;
	} else {
		qm = string.substring(i + 1);
	}
	
	var km = qm.split('&');
	for(var i = 0; i < km.length; i++){
		var kmv = km[i];
		var ioe = kmv.indexOf('=');
		var key = kmv.substring(0, ioe);
		var val = kmv.substring(ioe + 1);
		GETValueMap[key] = decodeURIComponent(val);
	}
	return GETValueMap;
}

function getFileMap(folder){
	var files = FS.readdirSync(folder);
	var fileMap = [];
	for(var i = 0; i < files.length; i++){
		var file = files[i];
		var filePath = Path.join(folder, file);
		try{
			var type = FS.lstatSync(filePath);
			if(type.isDirectory()){
				fileMap.push(file + "/");
			} else {
				fileMap.push(file);
			}
		} catch (ev){
			fileMap.push(file);
		}
	}
	return fileMap;
}

main();