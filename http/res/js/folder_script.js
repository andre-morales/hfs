var contextMenuW = null;
var contextMenu_watch = null;
var contextMenu_edit = null;

function main(){
	if(!IE5_OR_NEWER) return;

	var wm = document.getElementById("warning-message");
	wm.parentNode.removeChild(wm);

	polyfill_util();

	contextMenu = document.getElementById("context-menu");
	contextMenu_watch = document.getElementById("cm-watch");
	contextMenu_edit = document.getElementById("cm-edit");

	addListener(document, 'click', function(t, event, target){
		if(contextMenuW){
			if(!dom_contains(contextMenuW, target)){
				cm_close();
			}
		}
	});
}



function openContextMenu(ctx){
	if(!IE5_OR_NEWER) return;

	contextMenuW = ctx.parentElement;
	contextMenuW.appendChild(contextMenu);
	contextMenuPath = contextMenuW.getAttribute("data-path");

	if(isVideo(contextMenuPath)){
		addClass(contextMenu, "watchable");
		contextMenu_watch.setAttribute("href", "javascript:watch();");
	} else {
		removeClass(contextMenu, "watchable");
		contextMenu_watch.removeAttribute("href");
	}
	if(isFolder(contextMenuPath)){
		var rc = removeClass(contextMenu, "editable");
		contextMenu_edit.removeAttribute("href");
	} else {
		addClass(contextMenu, "editable");
		contextMenu_edit.setAttribute("href", "javascript:edit();");
	}
}

function isFolder(file){
	return endsWith(file, '/');
}

function isVideo(file){
	return endsWith(file, ".mp4") || endsWith(file, ".webm");
}

function cm_close(){
	document.body.appendChild(contextMenu);
	contextMenuW = null;
}

function watch(){
	var link = "/v/watch?p=" + encodeURIComponent(folder + contextMenuPath);
	window.location.href = link;
}

function edit(){
	var link = "/v/edit?p=" + encodeURIComponent(folder + contextMenuPath);
	window.location.href = link;
}