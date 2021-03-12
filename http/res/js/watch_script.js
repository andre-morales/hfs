'use strict'
var Video = {
	$container: null,
	$video: null,
	$bottomControls: null,
	$controlRows: null,
	$progress: null,
	$progressbar: null,
	$progresshover: null,
	$muteButton: null,
	$volumeslider: null,	
	video: null,
	pinnedControls: false,
	showingControls: true,
	muteButtonHovered: false,
	volumeSliderHovered: false,
	fullscreen: false,
	firstPlay: false,

	TextTracks: {
		enabled: false,
		nativeTTDisplay: false,
		$ttList: null,
		$ttWindowContainer: null,
		openMenu: function(){
			$('.tt-main-menu').addClass("show");
		},
		setEnabled: function(bool){
			this.enabled = bool;
			for(var id in Video.textTracks){
				var t = Video.textTracks[id];
				t._updateMode();
			}
		},
		setNativeTTDisplay: function(bool){
			this.nativeTTDisplay = bool;
			for(var id in Video.textTracks){
				var t = Video.textTracks[id];
				t._updateMode();
			}
		},
		init: function(){
			this.$ttList = $(".tt-list");
			this.$ttWindowContainer = $(".tt-window-container");	
		}
	},
	textTracks: {},

	TextTrackEditor: null,

	toggleFullscreen: function(){
		if(this.fullscreen) this.$container.removeClass("fullscreen");
		else this.$container.addClass("fullscreen");
		this.fullscreen = !this.fullscreen;
		
		if (video_isFullScreen()) {
			if (document.exitFullscreen) document.exitFullscreen();
			else if (document.webkitCancelFullScreen) document.webkitCancelFullScreen();
			else if (document.msExitFullscreen) document.msExitFullscreen();
		} else {
			var vc = this.$container[0];
			if (vc.requestFullscreen) vc.requestFullscreen();
			else if (vc.webkitRequestFullScreen) vc.webkitRequestFullScreen();
			else if (vc.msRequestFullscreen) vc.msRequestFullscreen();
		}
	},
	togglePlay: function(){
		if(!this.$progressbar) return;

		var progress_ = this.$progressbar[0];
		var video_ = this.$video[0];
		if(!this.firstPlay){
			if(video_.duration){
				video_.currentTime = progress_.value * video_.duration;
				this.firstPlay = true;
			}
		}
		if(video_.ended || video_.paused){
			video_.play();
		} else {
			video_.pause();
		}
	},
	toggleMute: function(){
		if(this.video.muted = !this.video.muted){
			this.$container.addClass("muted");
		} else {
			this.$container.removeClass("muted");
		}
	},
	
	togglePinControls: function(){
		this.pinnedControls = !this.pinnedControls;
		if(this.pinnedControls){
			this.$container.addClass("pinnedcontrols");
		} else {
			this.$container.removeClass("pinnedcontrols");
		}
	},

	onPlay: function(){
		this.$container.addClass("playing");
	},
	onPause: function(){
		this.$container.removeClass("playing");
	},

	init: function(){
		var self = this;
		this.$video = this.$container.find('video');
		this.video = this.$video[0];
		this.$controlRows = this.$container.find(".controls-row");
		this.$bottomControls = this.$container.find('.bottom-controls');
		this.$muteButton = this.$container.find('.mutebutton');
		this.$progress = this.$container.find('.progress');
		this.$progressbar = this.$progress.find('.slider');
		this.$progresshover = this.$progress.find('.hover');
		this.$volumeslider = this.$bottomControls.find('.volumeslider');
		this.$time = this.$bottomControls.find('.time');
		this.TextTracks.init();
		this.TextTrackEditor = new Text_TrackEditor();
		this.TextTrackEditor.init();
		this.$controlRows.hover(function(){
			if(!Video.pinnedControls && Video.showingControls){
				Video.showingControls = false;
				Video.$controlRows.removeClass("opacity-0");
			}
		}, function(){
			if(!Video.pinnedControls && !Video.showingControls){
				Video.showingControls = true;
				Video.$controlRows.addClass("opacity-0");
			}
		});
		this.$muteButton.parent().hover(function(){
			self.muteButtonHovered = true;
			self.$volumeslider.addClass('expanded');
		}, function(){
			self.muteButtonHovered = false;
			if(!self.volumeSliderHovered && !self.muteButtonHovered){
				self.$volumeslider.removeClass('expanded');
			}
		});
		this.$volumeslider.parent().hover(function(){
			self.volumeSliderHovered = true;
			self.$volumeslider.addClass('expanded');
		}, function(){
			self.volumeSliderHovered = false;
			if(!self.volumeSliderHovered && !self.muteButtonHovered){
				self.$volumeslider.removeClass('expanded');
			}
		});
		this.$video.bind('timeupdate', function() {
			var video_ = self.$video[0];
			if(!sliderHeld){
				var progress_ = self.$progressbar[0];
				if(video_.duration > 0){
					progress_.setValue(video_.currentTime / video_.duration);
				} else {
					progress_.setValue(0);
				}
			}

			var timestr = toTimeString(video_.currentTime) + " / " + toTimeString(video_.duration);
			self.$time.text(timestr);
			for(var id in self.textTracks){
				var tt = self.textTracks[id];
				if(tt.config.enabled){
					tt.updateCues();
				}
			}
		});
	}
};

function toTimeString(time){
	var floor = Math.floor;

	var cTimeM = floor(time / 60);
	var cTimeS = floor(time - cTimeM * 60);

	var cTimeS_ = (cTimeS < 10)?("0" + cTimeS):cTimeS;
	var cTimeM_ = cTimeM;
	return cTimeM_ + ":" + cTimeS_;
}

var cueWindowConfig_ = {};
var sliderHeld = false;

function main(){
	polyfill_util();
	/*console.log("main().");*/
	/*console.time("Main() time");*/
	resetCheckboxValues();

	Video.$container = $('.video-container');
	Video.init();	

	var cwc_f = function(q){
		cueWindowConfig_[q] = Video.TextTrackEditor.$container.find("." + q);
	}
	cwc_f("wx"); cwc_f("val-wx");
	cwc_f("wy"); cwc_f("val-wy");
	cwc_f("ww"); cwc_f("val-ww");
	cwc_f("wh"); cwc_f("val-wh");
	cwc_f("ys"); cwc_f("val-ys");
	cwc_f("ysh"); cwc_f("val-ysh");
	cwc_f("font-size"); cwc_f("val-font-size");	
	cwc_f("timing-shift");	
	var cwc_ss = function(n, shift){
		var s = cueWindowConfig_[n];
		var sli = s[0];
		var p = s.parent();

		p.prev().find("button").click(function(){
			sli.setValue(sli.value - shift);
			s.trigger('change');
		});
		p.next().find("button").click(function(){
			sli.setValue(sli.value * 1.0 + shift);
			s.trigger('change');
		});
	};
	cwc_ss('wx', 1); cwc_ss('wy', 1);
	cwc_ss('ww', 1); cwc_ss('wh', 1);
	cwc_ss('ys', 1); cwc_ss('ysh', 1);
	cwc_ss('font-size', 0.5);

	var cwc_ssd = function(n, shift){
		var s = cueWindowConfig_[n];
		var sli = s[0];
		var p = s.parent();

		p.prev().find("button").click(function(){
			s.val(sli.value - shift);
			s.trigger('change');
		});
		p.next().find("button").click(function(){
			s.val(sli.value * 1.0 + shift);
			s.trigger('change');
		});
	};
	cwc_ssd('timing-shift', 0.5);
	Video.$video[0].controls = false;


	// -- Progress Bar --
	Video.$progress.hover(function(){
		Video.$progresshover.addClass('show');
	}, function(){
		Video.$progresshover.removeClass('show');
	});
	Video.$progress.mousemove(function(ev){
		var wb = Video.$progress.outerWidth();
		var offsetX = Video.$progress.offset().left;
		var wh = Video.$progresshover.outerWidth();
		var ox = ev.pageX - offsetX;

		var t = ox / wb;
		if(Video.video.duration){
			Video.$progresshover.text(toTimeString(t * Video.video.duration));
		} else {
			Video.$progresshover.text("00:00");
		}
		
		var x = ox - wh/2;
		if(x > wb - wh){ 
			x = wb - wh;
			Video.$progresshover.css("left", "auto");
			Video.$progresshover.css("right", 0);
		} else {
			if(x < 0) x = 0;
			Video.$progresshover.css("left", x);
			Video.$progresshover.css("right", "auto");
		}			
	});
	Video.$progressbar.bind('mousedown', function(){ sliderHeld = true;});
	$(document).mouseup(function(){
		if(sliderHeld){
			sliderHeld = false;
			var video_ = Video.video;
			if(isFinite(video_.duration)){
				var rat = Video.$progressbar[0].value;
				video_.currentTime = rat * video_.duration;	
			}
		}
	});

	// -- Volume Control --
	addSliderChangeListener(Video.$volumeslider, function(t){
		Video.$video[0].volume = t.val() / 100.0;
	});
	
	cwc_setup();

	// Close the dropdown menu if the user clicks outside of it
	addListener(document, 'click', function(t, event, target){
		var menus = $(".contextmenu-wrapper");
		for(var i = 0; i < menus.length; i++) {
			var menu = menus[i];
			
			if(!menu.contains(target)){
				var contents = $(menu).find('.contextmenu-content');
				for(var j = 0; j < contents.length; j++) {
					var content = $(contents[j]);
					content.removeClass('show');
				}
			}
		}
	});

	
	loadMainSubtitles();
	loadCCStatus();

	for(var i = 0; ; i++){
		if(!Video.textTracks[i]) break;
		updateCueWindowStyle(i);
	}
	/*console.timeEnd("Main() time");*/
}



function resetCheckboxValues(){
	var ch = $('input[type="checkbox"]');
	for(var i = 0; i < ch.length; i++){
		ch[i].checked = $(ch[i]).hasClass("checked");
	}
}

function updateCueWindowStyle(id){
	var _window = Video.textTracks[id].$window;
	var ttc = Video.textTracks[id].config;
	var x = ttc.window_x * 1.0 + 50;
	var y = -ttc.window_y * 1.0 + 50;
	var w = ttc.window_w * 0.5;
	var h = ttc.window_h * 0.5;
	var fs = ttc.fontSize * 1.0;
	_window.css("left",   ( x         - w) + "%");
	_window.css("right",  (-x + 100.0 - w) + "%");
	_window.css("top",    ( y         - h) + "%");
	_window.css("bottom", (-y + 100.0 - h) + "%");
	_window.css("font-size", fs + "pt");
}

function video_isFullScreen() {
	return !!(document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement || document.fullscreenElement);
}

/* -- Cue window configurator -- */
function cwc_setup(){

	var gcttc = function(){
		return Video.textTracks[Video.TextTrackEditor.ttId].config;
	};
	addSliderChangeListener(cueWindowConfig_['wx'], function(t, e){
		var v = t[0].value.toFixed(0) * 1.0;
		gcttc().window_x = v;
		cueWindowConfig_["val-wx"].text(v);
		updateCueWindowStyle(Video.TextTrackEditor.ttId);
	});

	addSliderChangeListener(cueWindowConfig_['wy'], function(t, e){
		var v = t[0].value.toFixed(0) * 1.0;
		gcttc().window_y = v;
		cueWindowConfig_["val-wy"].text(v);
		updateCueWindowStyle(Video.TextTrackEditor.ttId);
	});

	addSliderChangeListener(cueWindowConfig_['ww'], function(t, e){
		var v = t[0].value.toFixed(0) * 1.0;
		gcttc().window_w = v;
		cueWindowConfig_["val-ww"].text(v);
		updateCueWindowStyle(Video.TextTrackEditor.ttId);
	});

	addSliderChangeListener(cueWindowConfig_['wh'], function(t, e){
		var v = t[0].value.toFixed(0) * 1.0;
		gcttc().window_h = v;
		cueWindowConfig_["val-wh"].text(v);
		updateCueWindowStyle(Video.TextTrackEditor.ttId);
	});
	addSliderChangeListener(cueWindowConfig_['ys'], function(t, e){
		var v = t[0].value.toFixed(0) * 1.0;
		gcttc().lineYSpread = v;
		cueWindowConfig_["val-ys"].text(v);
		Video.textTracks[Video.TextTrackEditor.ttId].updateCues();
	});
	addSliderChangeListener(cueWindowConfig_['ysh'], function(t, e){
		var v = t[0].value.toFixed(0) * 1.0;
		gcttc().lineYShift = v;
		cueWindowConfig_["val-ysh"].text(v);
		Video.textTracks[Video.TextTrackEditor.ttId].updateCues();
	});
	addSliderChangeListener(cueWindowConfig_['font-size'], function(t, e){
		var v = t[0].value.toFixed(0) * 1.0;
		gcttc().fontSize = v;
		cueWindowConfig_["val-font-size"].text(v);
		updateCueWindowStyle(Video.TextTrackEditor.ttId);
	});

}

function cwc_reset(){
	Video.TextTrackEditor.currentConfig().reset();
	Video.TextTrackEditor.openFor(Video.TextTrackEditor.ttId);
	updateCueWindowStyle(Video.TextTrackEditor.ttId);
}

/* -- Save/Load CC status -- */
function saveCCStatus(){
	var ttc = {};
	for(var i in Video.textTracks){
		if(Video.textTracks.hasOwnProperty(i)){
			ttc[i] = Video.textTracks[i].config;
		}
	}
	var cookie = JSON.stringify(ttc);
	//console.log(cookie);
	setCookie("ttc", cookie, 365);
}

function loadCCStatus(){
	var cookie = getCookie("ttc");
	if(!cookie) return;

	var configMaster = JSON.parse(cookie);
	if(configMaster){
		for(var i in configMaster){
			var tt = Video.textTracks[i];
			var ttc = configMaster[i];
			if(tt && ttc){
				tt.config.fromJSON(ttc);
			}
		}	
	}
}

/* -- Template function -- */
function templateOf(templateId, target){
	var $template = $("#" + templateId);
	var template = $template[0];
	var clone = $(template.cloneNode(true));
	if(target) target.append(clone);
	clone.removeClass("template");
	return clone;
}

/* -- Custom smooth slider listener -- */
function addSliderChangeListener(target, callback, fire){
	target.bind('change', function(ev) {
		callback(target, ev);
	});
	target.bind('input', function(ev) {
		callback(target, ev);
	});
	if(fire) callback(target);
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

function _datc(c, n){
	return Video.textTracks[c].webvtt.activeCues[n];
}