/* Polyfill for IE5+.
 * IE4 doesn't support basic standard DOM funcionality like getElementByID.
 * Windows 95 supports IE5 and so there's no reason to support IE4.
 */
function isIE5(){
	return typeof document.getElementById !== "undefined";
}

function polyfill_util(){
	if(typeof encodeURIComponent != 'function'){
		encodeURIComponent = escape;
	}
}

// -- Polyfill for addEventListener --
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

function removeClass(element, class_){
	var cn = element.className;
	var i = cn.indexOf(class_);
	if(i != -1){
		var r = cn.substring(0, i) + cn.substring(i + class_.length);
		element.className = r;
	}
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function dummy(d0){}