var contextMenuW = null;

function main(){
	polyfill_util();
	if(!isIE5()) return;

	var wm = document.getElementById("warning-message");
	wm.parentNode.removeChild(wm);

	contextMenu = document.getElementById("context-menu");
	contextMenu_watch = document.getElementById("cm-watch");
	addListener(document, 'click', function(t, event, target){
		if(contextMenuW){
			if(!dom_contains(contextMenuW, target)){
				cm_close();
			}
		}
	});
}

function openContextMenu(ctx){
	if(!isIE5()) return;

	contextMenuW = ctx.parentElement;
	contextMenuW.appendChild(contextMenu);
	contextMenuPath = contextMenuW.getAttribute("data-path");

	if(isVideo(contextMenuPath)){
		contextMenu.className += " watchable";
		contextMenu_watch.setAttribute("href", "javascript:watch();");
	} else {
		removeClass(contextMenu, "watchable");
		contextMenu_watch.removeAttribute("href");
	}
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