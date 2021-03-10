'use strict';

var JQUERY;
var IE5_OR_NEWER;

function ps(slider){
	/*var upper = $('<span class="Upper"></span>');
	upper.appendTo(slider);*/
	var lower = slider.find('.Lower');
	var thumb = slider.find('.Thumb');
	var lower = $('<span class="Lower"></span>');
	lower.appendTo(slider);
	var thumb = $('<span class="Thumb"></span>');
	thumb.appendTo(slider);

	var sw = slider.outerWidth();
	var sh = slider.outerHeight();
	var min_ = slider.attr("val-min");
	var max_ = slider.attr("val-max");
	var min = (min_)?(min_*1.0):0;
	var max = (max_)?(max_*1.0):1;

	var held = false;
	var valueChange = function(value){
		if(value < 0) value = 0;
		if(value > 1) value = 1;
		if(slider[0].value == value) return;

		lower.css("width", value * 100 + "%");
		thumb.css("left", (value * sw - 8) + "px");
		var y = sh/2 - 8 - 1 - 1;
		thumb.css("top", y + "px");

		slider[0].value = min + (max - min) * value;
		slider.trigger('change');
	};

	$(document).mousemove(function(ev){
		if(held){
			valueChange((ev.pageX - slider.offset().left) / sw);	
		}
	});
	
	slider.mousedown(function(ev){
		held = true;
		valueChange((ev.pageX - slider.offset().left) / sw);
	});
	thumb.mousedown(function(){
		held = true;
	});
	$(document).mouseup(function(){
		held = false;
	});
	slider[0].setValue = function(value){
		valueChange(value);
	};
	valueChange(0.5);
}

function prepareSliders(){
	if(!JQUERY) return;

	var sliders = $(".Slider");

	for(var i = 0; i < sliders.length; i++){
		var slider = $(sliders[i]);
		ps(slider);
	}
}

function polyfill_util(){
	IE5_OR_NEWER = (typeof document.getElementById !== "undefined");
	JQUERY = (typeof jQuery !== "undefined");
	if(typeof encodeURIComponent != 'function'){
		encodeURIComponent = escape;
	}
	prepareSliders();
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

var Console = {
	log: function(v){
		if(console && console.log){
			console.log(v);
		}
	}
};

function dummy(d0){}