var __DOCUMENT__ = document;
var IE5_OR_NEWER = (typeof document.getElementById !== "undefined");
var IE6_OR_NEWER = (typeof document.createDocumentFragment !== "undefined");

function addListener(target, listenTo, callback, fire){
	if(target.addEventListener){
		target.addEventListener(listenTo, function(ev){
			callback(target, ev, ev.target);
		});
	} else {
		target.attachEvent("on" + listenTo, function(){
			var ev = window.event;
			var eventTarget = ev.srcElement;
			callback(target, ev, eventTarget);
		});
	}
	if(fire) callback(target);
}

function dom_contains(parent, child) {
	var node = child.parentNode;
	while (node != null) {
		if (node == parent) {
			return true;
		}
		node = node.parentNode;
	}
	return false;
}

function addClass(element, cl){
	if(element.className.indexOf(cl) == -1){
		element.className += cl + " ";
	}
}

function removeClass(element, cl){
	var clname = element.className;
	var i = clname.indexOf(cl);
	if(i != -1){
		var r = clname.substring(0, i) + clname.substring(i + cl.length);
		element.className = r;
		return true;
	}
	return false;
}

if(typeof encodeURIComponent === 'undefined'){
	encodeURIComponent = function(str){
		var escapedStr = escape(str);
		var pEscapedStr = [];
		for(var i = 0; i < escapedStr.length; i++){
			var ch = escapedStr.charAt(i);
			switch(ch){
				case '/': ch = '%2F'; break;
			}
			pEscapedStr[i] = ch;
		}
		return pEscapedStr.join("");
	};
}

function PU_dummy(){}

function PU_dummies(master, el){
	var length = el.length;
	var obj = (window[master] = window[master] || {});
	while (length--) {
		var method = el[length];
		if (!obj[method])
			obj[method] = PU_dummy;
	}
}

PU_dummies('console', ["log", "trace", "time", "timeEnd"]);