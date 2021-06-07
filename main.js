"use strict";

function main(){
	loadCore();
}

function loadCore(){
	const core = requireUncached("./core.js");
	core.init({
		'loadCore': loadCore
	});
}

function requireUncached(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}

main();