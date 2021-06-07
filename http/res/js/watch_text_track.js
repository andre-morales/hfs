function Text_Track(id, src, lang, label){
	var self = this;
	this.id = id;
	this.lang = lang;
	this.label = label;

	// Creates track tag under video tag.
	this.$track = templateOf("t_track", null);
	this.$track.load(function(){
		self.applyTimingShift();
	});
	this.$track.attr("src", src);
	this.$track.attr("srclang", lang);
	this.$track.attr("label", label);
	Video.$video.append(this.$track);
	this.webvtt = this.$track[0].track;

	// Create cues window.
	this.$window = templateOf("t_tt-window", Video.TextTracks.$ttWindowContainer);
	this.$insideWindow = this.$window.find(".tt-window-internal");

	this.$ttListItem = templateOf("t_tt-list-item", Video.TextTracks.$ttList);
	this.$ttListItem.find(".cc-label").text(label);
	this.$enableCheckbox = this.$ttListItem.find(".cc-enable-checkbox");

	this.$enableCheckbox.bind('click', function(){		
		self.setEnabled(this.checked);
		saveCCStatus();
	});
	this.setEnabled = function(bool){
		this.config.enabled = bool;
		this._updateMode();
	};
	this._updateMode = function(){
		var webvtt = this.webvtt;
		if(this.config.enabled && Video.TextTracks.enabled){
			if(Video.TextTracks.nativeTTDisplay){
				webvtt.mode = 'showing';
				this.$window.addClass("hide");
			} else {
				webvtt.mode = 'hidden';
				this.$window.removeClass("hide");
			}
		} else {
			webvtt.mode = 'disabled';
			this.$window.addClass("hide");
		}
	};
	this.applyTimingShift = function(){
		if(this.currentTimingShift === this.config.timingShift) return;
		if(!this.webvtt.cues) return;
		if(this.webvtt.cues.length === 0) return;
		this.currentTimingShift = this.config.timingShift;
		var i = 0;
		/*var cuesB = [];*/
		while(i < this.webvtt.cues.length){
			var cue = this.webvtt.cues[i];
			var oStart;
			var oEnd;
			if(!cue.oStartTime){
				cue.oStartTime = cue.startTime;
				cue.oEndTime = cue.endTime;
			}
			oStart = cue.oStartTime;
			oEnd = cue.oEndTime;

			/*this.webvtt.removeCue(gcbi);*/
			cue.cStartTime = oStart + this.config.timingShift;
			cue.cEndTime = oEnd + this.config.timingShift;
			try{
				cue.startTime = cue.cStartTime;
				cue.endTime = cue.cEndTime;
			} catch(ex){}
			/*cuesB.push(cue);*/
			i++;
		}
		/*for(i = 0; i < cuesB.length; i++){
			this.webvtt.addCue(cuesB[i]);
		}*/

	};
	this.updateCues = function(){
		var webvtt = this.webvtt;
		if(!webvtt || !webvtt.cues || webvtt.cues.length === 0){
			/*Console.log("Subtitles not updating.");*/
			return;
		}
		

		var videoTime = Video.$video[0].currentTime;
		var cues = [];
		var cuesLength = webvtt.cues.length;
		for(var i = 0; i < cuesLength; i++){
			var cue = webvtt.cues[i];
			if(videoTime >= cue.cStartTime && videoTime <= cue.cEndTime){
				cues.push(cue);
			}
		}

		if(eqArray(cues, this.activeCues)){
			return;
		}

		this.activeCues = cues;
		this._updateCues();			
	};
	this._updateCues = function(){
		this.$insideWindow.empty();
		for(var i = 0; i < this.activeCues.length; i++){
			var cue = this.activeCues[i];
			var liney = cue.line;
			if(!liney){
				liney = 75;
			}
			var str = cue.text;
			var cuetag = $('<span class="cue"></span>').html(str.replace('\n', '<br/>'));
			
			this.$insideWindow.append(cuetag);				
			var m = this.config.lineYSpread / 50;
			liney = (liney - 50) * m + 50 + this.config.lineYShift;

			if(liney <= 50){
				cuetag.css("bottom", "auto");
				cuetag.css("top",    liney + "%");
				cuetag.css("color", "white");
			} else {
				cuetag.css("top", "auto");
				cuetag.css("bottom", (100-liney) + "%");
				cuetag.css("color", "white");
			}
		}	
	};
	this.config = new Text_TrackConfig();
	this.config.id = id;

	this.$ttListItem.find(".morebutton").click(function(){
		Video.TextTrackEditor.openFor(self.id);
		updateCueWindowStyle(self.id);
	});
}

function eqArray(a, b){
	if(a === undefined || b === undefined) return false;
	if(a.length != b.length) return false;

	for(var i = 0; i < a.length; i++){
		if(a[i] !== b[i]) return false;
	}

	return true;
}

var __TT_CONFIG_PROP_MAP__ = {
	enabled: ['en', 1],
	window_x: ['wx', 0],
	window_y: ['wy', 0],
	window_w: ['ww', 100],
	window_h: ['wh', 100],
	lineYSpread: ['ys', 100],
	lineYShift: ['ysh', 0],
	fontSize: ['fs', 20],
	timingShift: ['ts', 0],
};
function Text_TrackConfig(){
	var self = this;
	this.reset = function(){
		for(var pk in __TT_CONFIG_PROP_MAP__){
			this[pk] = __TT_CONFIG_PROP_MAP__[pk][1];
		}
	};
	this.toJSON = function(){
		var obj = {};

		for(var pk in __TT_CONFIG_PROP_MAP__){
			obj[__TT_CONFIG_PROP_MAP__[pk][0]] = this[pk];
		}
		return obj;
	};
	this.fromJSON = function(src){
		var tt = Video.textTracks[this.id];

		for(var pk in __TT_CONFIG_PROP_MAP__){
			this[pk] = src[__TT_CONFIG_PROP_MAP__[pk][0]];
		}

		tt.$enableCheckbox[0].checked = this.enabled;
	};
	this.reset();
}

function Text_TrackEditor(){
	this.ttId = 0;
	this.init = function(){
		this.$container = $('.cue-window-config');
		this.$title = this.$container.find(".title");
	};
	this.currentConfig = function(){
		return Video.textTracks[this.ttId].config;
	};
	this.openFor = function(trId){
		this.ttId = trId;
		var tt = Video.textTracks[trId];
		var ttc = tt.config;

		this.$title.text(tt.label);
		$(".highlighted").removeClass("highlighted");
		
		var wx = ttc.window_x;
		var wy = ttc.window_y;
		var ww = ttc.window_w;
		var wh = ttc.window_h;
		var ys = ttc.lineYSpread;
		var ysh = ttc.lineYShift;
		var fs = ttc.fontSize;
		cueWindowConfig_["wx"][0].setValue(wx);
		cueWindowConfig_["val-wx"].text(wx);

		cueWindowConfig_["wy"][0].setValue(wy);
		cueWindowConfig_["val-wy"].text(wy);

		cueWindowConfig_["ww"][0].setValue(ww);
		cueWindowConfig_["val-ww"].text(ww);

		cueWindowConfig_["wh"][0].setValue(wh);
		cueWindowConfig_["val-wh"].text(wh);

		cueWindowConfig_["ys"][0].setValue(ys);
		cueWindowConfig_["val-ys"].text(ys);

		cueWindowConfig_["ysh"][0].setValue(ysh);
		cueWindowConfig_["val-ysh"].text(ysh);

		cueWindowConfig_["font-size"][0].setValue(fs);
		cueWindowConfig_["val-font-size"].text(fs);

		cueWindowConfig_["timing-shift"].val(ttc.timingShift);
		tt.$window.addClass('highlighted');
		this.$container.removeClass('hide');
	};
	this.windowClose = function(){
		$(".highlighted").removeClass("highlighted");
		this.$container.addClass('hide');
	};
	this.windowSave = function(){
		this.windowClose();
		this.windowApply();
		saveCCStatus();
	};
	this.windowApply = function(){
		var tt = Video.textTracks[this.ttId];
		tt.config.timingShift = parseInt($(".timing-shift").val());
		tt.applyTimingShift();
		updateCueWindowStyle(this.ttId);
	}
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
	localStorage.setItem("ttc", cookie);
}

function loadCCStatus(){
	var cookie = localStorage.getItem("ttc");
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