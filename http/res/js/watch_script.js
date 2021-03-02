'use strict'
var Video = {
	$container: null,
	$video: null,
	$bottomControls: null,
	$progressbar: null,
	$volumeslider: null,
	
	TextTracks: {
		openMenu: function(){
			$('.tt-main-menu').addClass("show");
		}
	},
	textTracks: [],

	TextTrackEditor: {
		element: null
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

	onPlay: function(){
		this.$container.addClass("playing");
	},
	onPause: function(){
		this.$container.removeClass("playing");
	},

	findElements: function(){
		this.$video = this.$container.find('.video');
		this.$bottomControls = this.$container.find('.bottom-controls');
		this.$progressbar = this.$container.find('.progressbar');
		this.$volumeslider = this.$bottomControls.find('.volumeslider')
	}
};

function TextTrack(id, src, lang, label){
	this.id = id;
	this.lang = lang;
	this.label = label;
}


var cueWindowConfig = null;
var cueWindowConfig_ = {};
var sliderHeld = false;
var subtitlesEnabled = false;
var nativeSubtitlesEnabled = false;
var firstPlay = true;
var hidingControls = false;
var pinnedControls = true;

var curCCTrack;
var ccTracks = {};
var ccStatus = {};

var __TRACKID_COUNTER__ = 0;

function main(){
	resetCheckboxValues();

	Video.$container = $('.video-container');
	Video.findElements();	

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
	
	for (var i = 0; i < Video.$video[0].textTracks.length; i++) {
		Video.$video[0].textTracks[i].mode = 'hidden';
	}

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
	
	$(".controls-row").hover(function(){
		if(pinnedControls) return;

		if(hidingControls){
			hidingControls = false;
			$(".controls-row").removeClass("opacity-0");
		}
	}, function(){
		if(pinnedControls) return;

		if(!hidingControls){
			hidingControls = true;
			$(".controls-row").addClass("opacity-0");
		}
	});

	loadCCStatus();
	loadMainSubtitles();

	for(var i = 0; ; i++){
		if(!ccStatus[i]) break;
		updateCueWindowStyle(i);
	}

	ui_togglePin($(".pintoggle input")[0]);
}



function resetCheckboxValues(){
	var ch = $('input[type="checkbox"]');
	for(var i = 0; i < ch.length; i++){
		ch[i].checked = $(ch[i]).hasClass("checked");
	}
}

function updateCueWindowStyle(id){
	var _window = ccTracks[id]['window'];
	var ccs = ccStatus[id];
	var x = ccs['wx'] * 1.0;
	var y = ccs['wy'] * 1.0;
	var w = ccs['ww'] * 0.5;
	var h = ccs['wh'] * 0.5;
	var fs = ccs['fs'] * 1.0;
	_window.css("left",   ( x         - w) + "%");
	_window.css("right",  (-x + 100.0 - w) + "%");
	_window.css("top",    ( y         - h) + "%");
	_window.css("bottom", (-y + 100.0 - h) + "%");
	_window.css("font-size", fs + "pt");
}

function video_togglePlay(){
	var progress_ = Video.$progressbar[0];
	var video_ = Video.$video[0];
	if(firstPlay){
		video_.currentTime = progress_.value * video_.duration / 100.0;
		firstPlay = false;
	}
	if(video_.ended || video_.paused){
		video_.play();
	} else {
		video_.pause();
	}	
}



function video_toggleMute(){
	video.muted = !video.muted;
	if(video.muted){
		videoContainer.addClass("muted");
	} else {
		videoContainer.removeClass("muted");
	}	
}

function video_isFullScreen() {
	return !!(document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement || document.fullscreenElement);
}

function ui_togglePin(ctx){
	pinnedControls = ctx.checked;
	if(pinnedControls){
		if(hidingControls){
			hidingControls = false;	
			$(".controls-row").removeClass("opacity-0");
		} 
	}
}

function loadTextTrack(src, lang, label){
	var id = __TRACKID_COUNTER__++;
	Video.TextTracks[id] = new TextTrack(id, src, lang, label);

	ccTracks[id] = {
		'tracktag': null,
		'texttrack': null,
		'window': null,
		'window-internal': null,
		'label': label
	};
	if(!ccStatus[id]){
		ccStatus[id] = getCCStyleDefaults();
	}	

	var cct = ccTracks[id];
	var ccs = ccStatus[id];

	// Creates Track element under Video tag.
	cct['tracktag'] = templateOf("t_track");
	cct['tracktag'].attr("src", src);
	cct['tracktag'].attr("srclang", lang);
	cct['tracktag'].attr("label", label);
	cct['tracktag'].attr("data-track-id", id);
	Video.$video.append(cct['tracktag']);

	cct['texttrack'] = cct['tracktag'][0].track;

	// Creates subitem on the captions menu on the bottom controls.
	var subitem = templateOf("t_tt-list-item");
	subitem.find(".cc-label").text(label);
	var inputtag = subitem.find(".cc-enable-checkbox")[0];
	inputtag.checked = ccs['en'];
	addListener(inputtag, 'click', function(){
		ccs['en'] = inputtag.checked;
		updateTextTracksStatus();
		saveCCStatus();
	});
	var morebtn = subitem.find(".morebutton");
	morebtn.click(function(){
		curCCTrack = id;
		cueWindowConfig_['title'].text(label);
		cwc_open();
		updateCueWindowStyle(id);
		$(".highlighted").removeClass("highlighted");
		cct['window'].addClass('highlighted');
		cueWindowConfig.removeClass('hide');
	});
	$(".tt-list").append(subitem);

	// Create cues window.
	cct['window'] = templateOf("t_cue-window");
	cct['window-internal'] = cct['window'].children().first()

	$(".cue-windows").append(cct['window']);

	var textTrack = cct['texttrack'];
	var cueWindow = cct['window-internal'];
	textTrack.addEventListener("cuechange", function(){
		updateTrackCues(id, cueWindow, textTrack);
	});
}

function updateTrackCues(id, cueWindow, textTrack){
	cueWindow.empty();

	var ac = textTrack.activeCues.length;
	for(var i = 0; i < ac; i++){
		var cue = textTrack.activeCues[i];
		var liney = cue.line;
		var str = cue.text;
		var cuetag = $('<span class="cue"></span>').html(str.replace('\n', '<br/>'));
		
		cueWindow.append(cuetag);
		if(ccStatus[id]['fy']){
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
}

function getCCStyleDefaults(){
	return {
		'en': 1,
		'wx': 50,
		'wy': 50,
		'ww': 100,
		'wh': 100,
		'fs': 20,
		'fy': 0,
		'ts': 0,
	};
}

function toggleCaptioning(ctx){
	subtitlesEnabled = ctx.checked;
	updateTextTracksStatus();
}

function toggleNativeCaptionsDisplay(ctx){
	nativeSubtitlesEnabled = ctx.checked;
	updateTextTracksStatus();
}

function updateTextTracksStatus(){
	var tracks = $(".subtrack");
	
	for(var i = 0; i < tracks.length; i++){
		var track = $(tracks[i]);
		var textTrack = track[0].track;
		var id = track.attr("data-track-id");
		var cuesWindow = ccTracks[id]['window'];
		if(ccStatus[id]['en'] && subtitlesEnabled){
			if(nativeSubtitlesEnabled){
				textTrack.mode = 'showing';
				cuesWindow.addClass("hide");
			} else {
				textTrack.mode = 'hidden';
				cuesWindow.removeClass("hide");
			}
		} else {
			textTrack.mode = 'disabled';
			cuesWindow.addClass("hide");
		}	
	}
}

/* -- Cue window configurator -- */
function cwc_setup(){
	addSliderChangeListener(cueWindowConfig_['wx'], function(t, e){
		ccStatus[curCCTrack]['wx'] = t.val();
		cueWindowConfig_["val-wx"].text(t.val());
		updateCueWindowStyle(curCCTrack);
	});

	addSliderChangeListener(cueWindowConfig_['wy'], function(t, e){
		ccStatus[curCCTrack]['wy'] = t.val();
		cueWindowConfig_["val-wy"].text(t.val());
		updateCueWindowStyle(curCCTrack);
	});

	addSliderChangeListener(cueWindowConfig_['ww'], function(t, e){
		ccStatus[curCCTrack]['ww'] = t.val();
		cueWindowConfig_["val-ww"].text(t.val());
		updateCueWindowStyle(curCCTrack);
	});

	addSliderChangeListener(cueWindowConfig_['wh'], function(t, e){
		ccStatus[curCCTrack]['wh'] = t.val();
		cueWindowConfig_["val-wh"].text(t.val());
		updateCueWindowStyle(curCCTrack);
	});

	addSliderChangeListener(cueWindowConfig_['font-size'], function(t, e){
		ccStatus[curCCTrack]['fs'] = t.val();
		cueWindowConfig_["val-font-size"].text(t.val());
		updateCueWindowStyle(curCCTrack);
	});

}

function cwc_open(){
	var curStatus = ccStatus[curCCTrack];
	var wx = curStatus['wx'];
	var wy = curStatus['wy'];
	var ww = curStatus['ww'];
	var wh = curStatus['wh'];
	var fs = curStatus['fs'];
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

	cueWindowConfig_["flip-y-line"][0].checked = curStatus['fy'];
	cueWindowConfig_["timing-shift"].val(curStatus['ts']);
}

function cwc_toggleYLineFlip(ctx){
	ccStatus[curCCTrack]['fy'] = ctx.checked;
	var cct = ccTracks[curCCTrack];
	updateTrackCues(curCCTrack, cct['window-internal'], cct['texttrack']);
	saveCCStatus();
}

function cwc_reset(){
	ccStatus[curCCTrack] = getCCStyleDefaults();
	cwc_open();
	updateCueWindowStyle(curCCTrack);
}
function cwc_apply(){
	ccStatus[curCCTrack]['ts'] = parseInt($(".timing-shift").val());
	updateCueWindowStyle(curCCTrack);

	var track_ = ccTracks[curCCTrack]['texttrack'];
	var i = 0;
	var cuesB = [];

	while(track_.cues.length > 0){
		var cue = track_.cues[0];
		var oStart;
		var oEnd;
		if(cue.oStartTime){
			oStart = cue.oStartTime;
			oEnd = cue.oEndTime;
		} else {
			oStart = cue.oStartTime = cue.startTime;
			oEnd = cue.oEndTime = cue.endTime;
		}
		
		track_.removeCue(cue);
		cue.startTime = oStart + ccStatus[curCCTrack]['ts'];
		cue.endTime = oEnd + ccStatus[curCCTrack]['ts'];
		cuesB.push(cue);
		i++;
	}
	for(i = 0; i < cuesB.length; i++){
		track_.addCue(cuesB[i]);
	}
	saveCCStatus();
}
function cwc_ok(){
	cwc_close();
	cwc_apply();
}
function cwc_close(){
	$(".highlighted").removeClass("highlighted");
	cueWindowConfig.addClass('hide');
}

/* -- Save/Load CC status -- */
function saveCCStatus(){
	setCookie("ccstatus", JSON.stringify(ccStatus), 365);
}
function loadCCStatus(){
	var ccStatus_ = getCookie("ccstatus");
	if(ccStatus_){
		ccStatus = JSON.parse(ccStatus_);
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