'use strict';

function ps(slider){
	var lower = $('<span class="Lower"></span>');
	lower.appendTo(slider);
	var thumb = $('<span class="Thumb"></span>');
	thumb.appendTo(slider);

	var sw = function(){ return slider.outerWidth() };
	var sh = slider.outerHeight();
	var tw = thumb.outerWidth();
	var th = thumb.outerHeight();
	var bd = sh - slider.height();
	var min = asNumber(slider.attr("data-min"), 0);
	var max = asNumber(slider.attr("data-max"), 100);

	var held = false;
	var valueChange = function(value, fireEv){
		value = clamp(value, 0, 1);
		//if(slider[0].value == value) return;

		lower.css("width", value * 100 + "%");
		thumb.css("left", (value * sw() - tw/2) + "px");
		thumb.css("top", (sh - th - bd)/2 + "px");

		slider[0].value = min + (max - min) * value;
		if(fireEv) slider.trigger('change');
	};

	$(document).mousemove(function(ev){
		if(held){
			valueChange((ev.pageX - slider.offset().left) / sw(), true);	
		}
	});
	
	slider.mousedown(function(ev){
		held = true;
		valueChange((ev.pageX - slider.offset().left) / sw(), true);
	});
	thumb.mousedown(function(){
		held = true;
	});
	$(document).mouseup(function(ev){
		if(held){
			held = false;
			valueChange((ev.pageX - slider.offset().left) / sw(), true);
		}
	});
	slider[0].setValue = function(value, fireEv){
		valueChange((value-min)/(max-min), fireEv);
	};

	var val = asNumber(slider.attr("data-value"), 0);
	valueChange(clamp(val, min, max));
}

function prepareSliders(){
	if(!JQUERY) return;

	var sliders = $(".Slider");

	for(var i = 0; i < sliders.length; i++){
		var slider = $(sliders[i]);
		ps(slider);
	}
}

function clamp(val, min, max){
	return ((val <= min) ? min : ((val >= max) ? max : val));
};

function asNumber(val, def){
	if(val === undefined){
		return def;
	}
	return Number(val);
}

function polyfill_util(){
	JQUERY = (typeof jQuery !== "undefined");
	prepareSliders();
}

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/* -- Saving/Loading Cookies  -- */
function getCookie(name) {
	var cname = name + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	
	var ca = decodedCookie.split(';');
	for(var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(cname) == 0) {
			return c.substring(cname.length, c.length);
		}
	}
	return "";
}

function setCookie(name, value, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));

	var expires = "expires=" + d.toUTCString();
	document.cookie = name + "=" + value + ";" + expires + ";samesite=lax;path=/";
}