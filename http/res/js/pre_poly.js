'use strict';

var __DOCUMENT__ = document;
var IE5_OR_NEWER = (typeof document.getElementById !== "undefined");
var IE6_OR_NEWER = (typeof document.createDocumentFragment !== "undefined");
var JQUERY;

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

function Decode(string, reservedSet) {
    var strLen = string.length;
    var result = "";

	for (var k = 0; k < strLen; k++) {
        var chr = string.charAt(k);
        var str = chr;
        if (chr === '%') {
			alert("ERROR");
            /*var start = k;
            var tmp_ = string.slice(k+1, k+3);
            var byte = '0x' + tmp_;
            if (Number.isNaN(byte) || k + 2 >= strLen) throw new URIError;
            k += 2;
            if (byte < 0x80) {
                chr = String.fromCharCode(byte);
                str = reservedSet.includes(chr) ? string.slice(start, k + 1) : chr;
            } else { // the most significant bit in byte is 1
                var n = Math.clz32(byte ^ 0xFF) - 24; // Position of first right-most 10 in binary
                if (n < 2 || n > 4) throw new URIError;
                let value = byte & (0x3F >> n);
                if (k + (3 * (n - 1)) >= strLen) throw new URIError;
                for (let j = 1; j < n; j++) {
                    if (string[++k] !== '%') throw new URIError;
                    let byte = +`0x${string.slice(k+1, k+3)}`;
                    if (Number.isNaN(byte) || ((byte & 0xC0) != 0x80)) throw new URIError;
                    k += 2;
                    value = (value<<6) + (byte & 0x3F);
                }
                if (value >= 0xD800 && value < 0xE000 || value >= 0x110000) throw new URIError; 
                if (value < 0x10000) {
                    chr = String.fromCharCode(value);
                    str = reservedSet.includes(chr) ? string.slice(start, k + 1) : chr;
                } else { // value is ≥ 0x10000
                    var low = ((value - 0x10000) & 0x3FF) + 0xDC00;
                    var high = (((value - 0x10000) >> 10) & 0x3FF) + 0xD800;
                    str = String.fromCharCode(high) + String.fromCharCode(low);
                }
           }*/
        }
        result += str;
    }
    return result;
}

if(typeof decodeURIComponent === 'undefined'){
	decodeURIComponent = function(encoded) {
	    return Decode(encoded, "");
	}
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

var log10 = Math.log10 || function(x) {
	return Math.log(x) / Math.LN10;
}

PU_dummies('console', ["log", "trace", "time", "timeEnd"]);