'use strict'
var Video = {
	$container: null,
	$video: null,
	$bottomControls: null,
	$controlRows: null,
	$progressbar: null,
	$volumeslider: null,	
	pinnedControls: false,
	showingControls: true,
	

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
			Video.nativeTTDisplay = bool;
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

	TextTrackEditor: {
		ttId: 0,

		currentConfig: function(){
			return Video.textTracks[this.ttId].config;
		},
	},

	toggleFullscreen: function(){
		if (video_isFullScreen()) {
			if (document.exitFullscreen) document.exitFullscreen();
			this.$container.removeClass("fullscreen");
		} else {
			var vc = this.$container[0];
			if (vc.requestFullscreen) vc.requestFullscreen();
			this.$container.addClass("fullscreen");
		}
	},
	togglePlay: function(){
		if(!this.$progressbar) return;

		var progress_ = this.$progressbar[0];
		var video_ = this.$video[0];
		if(firstPlay){
			video_.currentTime = progress_.value * video_.duration / 100.0;
			firstPlay = false;
		}
		if(video_.ended || video_.paused){
			video_.play();
		} else {
			video_.pause();
		}
	},
	toggleMute: function(){
		var video_ = this.$video[0];
		if(video_.muted = !video_.muted){
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
		this.$video = this.$container.find('video');
		this.$controlRows = this.$container.find(".controls-row");
		this.$bottomControls = this.$container.find('.bottom-controls');
		this.$progressbar = this.$controlRows.find('.progressbar');
		this.$volumeslider = this.$bottomControls.find('.volumeslider');
		this.TextTracks.init();

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
	}
};

function TextTrack(id, src, lang, label){
	var self = this;
	this.id = id;
	this.lang = lang;
	this.label = label;

	// Creates track tag under video tag.
	this.$track = templateOf("t_track");
	this.$track.load(function(){
		self.applyTimingShift();
	});
	this.$track.attr("src", src);
	this.$track.attr("srclang", lang);
	this.$track.attr("label", label);
	this.$track.attr("data-track-id", id);
	Video.$video.append(this.$track);
	this.texttrack = this.$track[0].track;

	// Create cues window.
	this.$window = templateOf("t_tt-window");
	this.$insideWindow = this.$window.find(".tt-window-internal");
	Video.TextTracks.$ttWindowContainer.append(this.$window);

	this.$ttListItem = templateOf("t_tt-list-item");
	this.$enableCheckbox = this.$ttListItem.find(".cc-enable-checkbox");
	Video.TextTracks.$ttList.append(this.$ttListItem);

	this.$enableCheckbox.bind('click', function(){		
		self.setEnabled(this.checked);
		saveCCStatus();
	});
	this.setEnabled = function(bool){
		this.config.enabled = bool;
		this._updateMode();
	};
	this._updateMode = function(){
		if(this.config.enabled && Video.TextTracks.enabled){
			if(Video.nativeTTDisplay){
				this.texttrack.mode = 'showing';
				this.$window.addClass("hide");
			} else {
				this.texttrack.mode = 'hidden';
				this.$window.removeClass("hide");
			}
		} else {
			this.texttrack.mode = 'disabled';
			this.$window.addClass("hide");
		}	
	};
	this.applyTimingShift = function(){
		if(this.currentTimingShift == this.config.timingShift) return;
		if(!this.texttrack.cues) return;
		if(this.texttrack.cues.length == 0) return;
		this.currentTimingShift = this.config.timingShift;
		var i = 0;
		var cuesB = [];
		while(this.texttrack.cues.length > 0){
			var cue = this.texttrack.cues[0];
			var oStart;
			var oEnd;
			if(!cue.oStartTime){
				cue.oStartTime = cue.startTime;
				cue.oEndTime = cue.endTime;
			}
			oStart = cue.oStartTime;
			oEnd = cue.oEndTime;

			this.texttrack.removeCue(cue);
			cue.startTime = oStart + this.config.timingShift;
			cue.endTime = oEnd + this.config.timingShift;
			cuesB.push(cue);
			i++;
		}
		for(i = 0; i < cuesB.length; i++){
			this.texttrack.addCue(cuesB[i]);
		}

	};
	this.updateCues = function(){
		var cueWindow = this.$insideWindow;
		var textTrack = this.texttrack;
		cueWindow.empty();

		var ac = textTrack.activeCues.length;
		for(var i = 0; i < ac; i++){
			var cue = textTrack.activeCues[i];
			var liney = cue.line;
			var str = cue.text;
			var cuetag = $('<span class="cue"></span>').html(str.replace('\n', '<br/>'));
			
			cueWindow.append(cuetag);
			if(this.config.lineYFlip){
				liney = 100 - liney;
			}
				
			if(liney > 50){
				cuetag.css("top",    liney         + "%");
				cuetag.css("bottom", 0             + "%");
			} else {
				cuetag.css("bottom", (100 - liney) + "%");
				cuetag.css("top",    0             + "%");
			}
		}	
	};
	this.currentTimingShift = 0;
	this.config = new TextTrackConfig();
	this.config.id = id;

	this.texttrack.addEventListener('cuechange', function(){
		if(!self.config.enabled) return;

		/*if(self.currentTimingShift != self.config.timingShift){
			self.applyTimingShift();
		}*/
		self.updateCues();
	});
}

function TextTrackConfig(){
	var self = this;
	this.reset = function(){
		self.enabled = false;
		self.window_x = 50;
		self.window_y = 50;
		self.window_w = 100;
		self.window_h = 100;
		self.fontSize = 20;
		self.timingShift = 0.0;
		self.lineYFlip = false;
	};
	this.toJSON = function(){
		return {
			en: (self.enabled)?1:0,
			wx: self.window_x,
			wy: self.window_y,
			ww: self.window_w,
			wh: self.window_h,
			fs: self.fontSize,
			ts: self.timingShift,
			yf: (self.lineYFlip)?1:0,
		};
	};
	this.fromJSON = function(src){
		var tt = Video.textTracks[this.id];

		self.enabled = (src.en == 1);
		self.window_x = src.wx * 1.0;
		self.window_y = src.wy * 1.0;
		self.window_w = src.ww * 1.0;
		self.window_h = src.wh * 1.0;
		self.fontSize = src.fs * 1.0;
		self.timingShift = src.ts * 1.0;
		self.lineYFlip = (src.yf == 1);
		tt.$enableCheckbox[0].checked = self.enabled;
	};
	this.reset();
}

var cueWindowConfig = null;
var cueWindowConfig_ = {};
var sliderHeld = false;
var firstPlay = true;

var ccStatus = {};

var __TRACKID_COUNTER__ = 0;

function main(){
	resetCheckboxValues();

	Video.$container = $('.video-container');
	Video.init();	

	cueWindowConfig = $('.cue-window-config');
	var cwc_f = function(q){
		cueWindowConfig_[q] = cueWindowConfig.find("." + q);
	}
	cwc_f('title');
	cwc_f("wx"); cwc_f("val-wx");
	cwc_f("wy"); cwc_f("val-wy");
	cwc_f("ww"); cwc_f("val-ww");
	cwc_f("wh"); cwc_f("val-wh");
	cwc_f("font-size"); cwc_f("val-font-size");	
	cwc_f("flip-y-line");	
	cwc_f("timing-shift");	
	Video.$video[0].controls = false;


	// -- Progress Bar --
	Video.$progressbar.bind('onmousedown', function(){ sliderHeld = true; });
	Video.$progressbar.bind('onmouseup', function(){ sliderHeld = false; });
	Video.$progressbar.bind('change', function() {
		var video_ = Video.$video[0];
		if(isFinite(video_.duration)){
			video_.currentTime = Video.$progressbar.val() * video_.duration / 100.0;	
		}
	});
	Video.$video.bind('timeupdate', function() {
		if(!sliderHeld){
			var video_ = Video.$video[0];
			var progress_ = Video.$progressbar[0];
			if(video_.duration > 0){
				progress_.value = video_.currentTime * 100.0 / video_.duration;
			} else {
				progress_.value = 0;
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
	var x = ttc.window_x * 1.0;
	var y = ttc.window_y * 1.0;
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

function loadTextTrack(id, src, lang, label){
	Video.textTracks[id] = new TextTrack(id, src, lang, label);

	var ttt = Video.textTracks[id];
	var ttc = ttt.config;

	// Creates subitem on the captions menu on the bottom controls.
	
	ttt.$ttListItem.find(".cc-label").text(label);
	var morebtn = ttt.$ttListItem.find(".morebutton");
	morebtn.click(function(){
		Video.TextTrackEditor.ttId = id;
		cueWindowConfig_['title'].text(label);
		cwc_open();
		updateCueWindowStyle(id);
		$(".highlighted").removeClass("highlighted");
		ttt.$window.addClass('highlighted');
		cueWindowConfig.removeClass('hide');
	});
}

/* -- Cue window configurator -- */
function cwc_setup(){
	var gcttc = function(){
		return Video.textTracks[Video.TextTrackEditor.ttId].config;
	};
	addSliderChangeListener(cueWindowConfig_['wx'], function(t, e){
		gcttc().window_x = t.val();
		cueWindowConfig_["val-wx"].text(t.val());
		updateCueWindowStyle(Video.TextTrackEditor.ttId);
	});

	addSliderChangeListener(cueWindowConfig_['wy'], function(t, e){
		gcttc().window_y = t.val();
		cueWindowConfig_["val-wy"].text(t.val());
		updateCueWindowStyle(Video.TextTrackEditor.ttId);
	});

	addSliderChangeListener(cueWindowConfig_['ww'], function(t, e){
		gcttc().window_w = t.val();
		cueWindowConfig_["val-ww"].text(t.val());
		updateCueWindowStyle(Video.TextTrackEditor.ttId);
	});

	addSliderChangeListener(cueWindowConfig_['wh'], function(t, e){
		gcttc().window_h = t.val();
		cueWindowConfig_["val-wh"].text(t.val());
		updateCueWindowStyle(Video.TextTrackEditor.ttId);
	});

	addSliderChangeListener(cueWindowConfig_['font-size'], function(t, e){
		gcttc().fontSize = t.val();
		cueWindowConfig_["val-font-size"].text(t.val());
		updateCueWindowStyle(Video.TextTrackEditor.ttId);
	});

}

function cwc_open(){
	var ttc = Video.textTracks[Video.TextTrackEditor.ttId].config;
	var wx = ttc.window_x;
	var wy = ttc.window_y;
	var ww = ttc.window_w;
	var wh = ttc.window_h;
	var fs = ttc.fontSize;
	cueWindowConfig_["wx"].val(wx);
	cueWindowConfig_["val-wx"].text(wx);

	cueWindowConfig_["wy"].val(wy);
	cueWindowConfig_["val-wy"].text(wy);

	cueWindowConfig_["ww"].val(ww);
	cueWindowConfig_["val-ww"].text(ww);

	cueWindowConfig_["wh"].val(wh);
	cueWindowConfig_["val-wh"].text(wh);

	cueWindowConfig_["font-size"].val(fs);
	cueWindowConfig_["val-font-size"].text(fs);

	cueWindowConfig_["flip-y-line"][0].checked = ttc.lineYFlip;
	cueWindowConfig_["timing-shift"].val(ttc.timingShift);
}

function cwc_toggleYLineFlip(ctx){
	var ttt = Video.textTracks[Video.TextTrackEditor.ttId];
	ttt.config.lineYFlip = ctx.checked;
	ttt.updateCues();
}

function cwc_reset(){
	Video.TextTrackEditor.currentConfig().reset();
	cwc_open();
	updateCueWindowStyle(Video.TextTrackEditor.ttId);
}
function cwc_apply(){
	var tt = Video.textTracks[Video.TextTrackEditor.ttId];
	tt.config.timingShift = parseInt($(".timing-shift").val());
	tt.applyTimingShift();
	updateCueWindowStyle(Video.TextTrackEditor.ttId);
}
function cwc_ok(){
	cwc_close();
	cwc_apply();
	saveCCStatus();
}
function cwc_close(){
	$(".highlighted").removeClass("highlighted");
	cueWindowConfig.addClass('hide');
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
function templateOf(templateId){
	return $($("#" + templateId)[0].content.firstElementChild.cloneNode(true));
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