var txtEditor;
var txtLineNumbers;
var lineNumbers = 0;

function main(){
	var ck = getCookie("scroll");
	if(!ck){
		setCookie("scroll", 0, 365);
	} else {
		ck *= 1.0;
	}

	txtEditor = document.getElementById("text").children[0];
	var lf = (TEXT.match(/\n/g) || []).length;
	var crlf = (TEXT.match(/\r\n/g) || []).length;
	if(crlf >= lf){
		document.getElementById("line-endings-crlf").checked = true;
	} else {
		document.getElementById("line-endings-lf").checked = true;
	}
	txtEditor.value = TEXT;
	

	txtEditor.scrollTop = ck;
	txtLineNumbers = document.getElementById("line-numbers").children[0];
	txtLineNumbers.value = "";
	txtLineNumbers.scrollTop = ck;

	addListener(txtEditor, "change", function(){
		onTextChange();
	});
	addListener(txtEditor, "input", function(){
		onTextChange();
	});
	var d = new Date();
	d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
	var expires = "expires=" + d.toUTCString();
	addListener(txtEditor, "scroll", function(){
		txtLineNumbers.scrollTop = txtEditor.scrollTop;
		document.cookie = "scroll=" + txtEditor.scrollTop + ";" + expires + ";samesite=lax;path=/";
	});

	onTextChange();
}

function onTextChange(){
	var linen = txtEditor.value.split('\n').length;

	txtLineNumbers.cols = Math.ceil(log10(linen)) + 2;
	if(linen > lineNumbers){
		var val = [];
		var str = "";
		for(var i = lineNumbers; i < linen; i++){
			str += (i + 1) + '\n';
		}
		txtLineNumbers.value += str;
		lineNumbers = linen;
	}	
}