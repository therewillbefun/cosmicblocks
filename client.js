// Cosmic Blocks
// by Narcissa Wright

'use strict';

	//   ****  ****   **      ***   ** **  //
	//  **     ** **  **     ** **   ***   //
	//  **     ****   **     ** **    *    //
	//  **     ** **  **     ** **   ***   //
	//   ****  ****   *****   ***   ** **  //

// some global vars...
var menuState; // is the menu disabled?
var global_moveCount; // what turn is it
var standby; // waiting for other player
var you; // socket id.
var yourName; //displayName.
var opponents = []; // who u playin against
var socket; // online multiplayer!
var isGhost; // is this open in a second tab.
var ghostFlow; // are you auto-spectating?
var inGame = false; // are you in a game or in the lobby?
var showWinState = false; // should the winState be shown?
var player = false; // are you a player
var emptyColor = "#d5ccbd"; // this is the empty block color passed in from server later on
var collisionColor = "#202020"; // collision color...
var priorColorList = []; // this will hold all the colors used for highlighting with the .prior-* class.
var audioEnabled = true;
var gameTimer;
var debounce; // used for checking if renderGames function was run multiple times for ghostFlow delay....

// sfx
const hoverAudio = new Audio("sfx/hover.ogg");
const moveAudio = new Audio("sfx/move3.ogg");
const collisionAudio = new Audio("sfx/collision3.ogg");
const beepAudio = new Audio("sfx/beep.ogg");
const newgameAudio = new Audio("sfx/newgame.ogg");
const forfeitAudio = new Audio("sfx/forfeit.ogg");
const drawgameAudio = new Audio("sfx/drawgame.ogg");
const youwinAudio = new Audio("sfx/youwin.ogg");
const gameoverAudio = new Audio("sfx/gameover.ogg");
const drawacceptedAudio = new Audio("sfx/drawaccepted.ogg");
const connectAudio = new Audio("sfx/connect.ogg");
const disconnectedAudio = new Audio("sfx/disconnected.ogg");
const opponentdisconnectedAudio = new Audio("sfx/opponentdisconnected.ogg");
const timeoutAudio = new Audio("sfx/timeover.ogg");
const detonateAudio = new Audio("sfx/detonate2.ogg");


function buildBoard(rows, cols) {
	// clear the board
	$("#board").empty();
	
	// begin building the physical board (as <div>s)
	for (var i = 0; i < rows; i++) {
		var buildstring = '<div class="board_row">';
		for (var j = 0; j < cols; j++) {
			// blocks start as empty blocks
			buildstring += '<div id="x' + (j+1) + 'y' + (i+1) + '" class="block empty"></div>';
		}
		buildstring += '</div>';
		$("#board").append(buildstring);
	}
	
	sizeBoard(rows, cols);
}
function resizeFunction() {
	sidebarsResize();
	if ($("#menuContainer").length > 0) {
		menuResize();
	}
	if ($("#board").length > 0) {
		sizeBoard();
	}
	if ($("#blockListEditor").length > 0) {
		let hWidth = hSpace();
		$("#blockListEditor").css('width', hWidth);
	}
}
function sidebarsResize() {
  if ($(window).width() > 1450) {
    var initialWidth = 222 + (($(window).width() - 1450) / 3);
    if (initialWidth > 300) { initialWidth = 300; }
  } else {
    var initialWidth = 222;
  }
	$('#chatPanel').css('width', initialWidth + 'px');
	$('#leaderboard').css('width', initialWidth + 'px');
  //log(initialWidth);
}
function sizeBoard() {
	
	var arr = []; //populate the length of children into this array.
	$('.board_row').map(function (i) {
		arr[i] = $(this).children().length;
	});
	var cols = Math.max.apply(Math, arr); //get the max value from the array
	var rows = $(".board_row").length;
	
	let blockSize = getBlockSize(rows, cols);
	let boardWidth = (cols * blockSize) + 'px';
	let boardHeight = (rows * blockSize) + 'px';
	
	$("#board").css('width', boardWidth);
	$("#board").css('height', boardHeight);
	$(".board_row").css('height', blockSize);
	$(".block").css('width', blockSize);
	$(".block").css('height', blockSize);
}
function hSpace () {
    // for board/menu sizing.
	let horizontalSpace = $(window).width();
	if ($("#chatPanel").is(":visible")) {
		horizontalSpace -= $("#chatPanel").width();
	}
	return horizontalSpace;
}
function vSpace () {
	let verticalSpace = $(window).height() - 38 - $("#menuContainer").height() - 10; // 38 is $("#gameHead").height() but hardcoded for now.
	return verticalSpace;
}
function getBlockSize(rows, cols) {
	let blockSize = 50;
	
	// find available space
	var horizontalSpace = hSpace();
	var verticalSpace = vSpace();
	
	let windowRatio = horizontalSpace / verticalSpace;
	let boardRatio = cols / rows;
	
	//if board ratio wider than window ratio then horizontally max the board!
	//if board ratio taller than the window ratio then vertically max the board!!
	if (boardRatio > windowRatio) {
		blockSize = Math.floor(horizontalSpace / cols);
	} else {
		blockSize = Math.floor(verticalSpace / rows);
	}

	return blockSize;
}
function buildMenu (blockList) {
	$("#menu").remove();
	$("#menuContainer").append('<div id="menu"></div>');
	// define what blocks are used in the menu.
	var menuBlocks = blockList;
	var buildString = '';
	var ammoString = '';
	buildString += '<div class="menu_row">';
	//<div class="menu_block nohover disabled" style="opacity:0"></div> dummy block
	
	var position = 0;
	var splitPoint = Math.floor(Object.keys(menuBlocks).length / 2);
	
	for (var block in blockList) {
		position++;
		if (position > splitPoint) {
			splitPoint = 9001; // it's over 9000!!!
			buildString += '</div><div class="menu_row">'; // new row
		}
		buildString += '<div class="menu_block';
		if (blockList[block].ammo == 0) {
			buildString += ' disabled nohover noammo';
			ammoString = '';
		}
		// idk why it's "null" but w/e
		if ((blockList[block].ammo !== null) && (blockList[block].ammo !== 'inf')) {
			ammoString = '<div class="ammo" id="'+ block +'-ammo">'+ blockList[block].ammo +'</div>';
		} else {
			ammoString = '';
		}
		var SVGString = getSVG8by8(block);
		buildString += '" id="' + block + '" >' + ammoString + SVGString + '</div>';
	}
	buildString += '</div>';
	$('#menu').append(buildString);
	menuResize();
}
function menuResize () {
	var horizontalSpace = hSpace();
	
	var arr = []; //populate the length of children into this array.
	$('.menu_row').map(function (i) {
		arr[i] = $(this).children().length;
	});
	var menuLength = Math.max.apply(Math, arr); //get the max value from the array
	
	//let menuLength = $(".menu_block").length;
	let menuBlockSize = ((Math.floor(horizontalSpace / menuLength)) * 0.5) - 10;
	if (menuBlockSize > 75) {
		menuBlockSize = 75;
	}
	$(".menu_block").css('height', menuBlockSize);
	$(".menu_block").css('width', menuBlockSize);
	//$(".menu_block").css('margin', menuBlockSize / 15);
	//$("#menu").css('width', horizontalSpace * 0.8);
}
function menuHideBlocksAndResize () {
	$(".menu_block.disabled").addClass('nohover').css('opacity', 0);
	menuResize();
}

function renderBoard(data) {
	for (var i = 0; i < priorColorList.length; i++) {
		$(".block").removeClass(priorColorList[i]);
	}
	$.each(data, function( index, value ) {
		let tempX = value.x + 1;
		let tempY = value.y + 1;
		updateBlock (tempX, tempY, value.type, value.possessionDisplayName, value.moveNum, value.origin, value.color, value.duration, value.history, value.originColor, value.possession, value.possessionColorSpread);
	});
	//log ('<span class="dimMsg">rendered board</span>');
}

function getSVG8by8(blockType, where) {
	var SVGString = '';
	if (blockType !== 'blank') {
		var oShape = '<circle fill="none" class="oShape" stroke="#000000" stroke-width="5" cx="40" cy="40" r="30"/>';
		var oOutline = '<path class="outline" d="M40,74.5C20.977,74.5,5.5,59.023,5.5,40S20.977,5.5,40,5.5S74.5,20.977,74.5,40S59.023,74.5,40,74.5L40,74.5 z"/>';
		
		SVGString += '<svg version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/" x="0px" y="0px" width="80px" height="80px" viewBox="0 0 80 80" xml:space="preserve"><defs></defs>';

		if (blockType == 'circle') {
			//SVGString += oOutline;
			SVGString += oShape;
		}
		if (blockType == 'base') {
			SVGString += '<polygon class="shape" points="62.5,45 62.499,34.999 52.071,35 59.445,27.625 52.374,20.555 44.999,27.93 44.999,17.5 35,17.5 35,27.929 27.625,20.555 20.555,27.625 27.928,35 17.5,35 17.5,45 27.929,45 20.555,52.374 27.625,59.445 35,52.072 34.999,62.499 45,62.5 44.999,52.07 52.374,59.445 59.445,52.374 52.071,45 "/>';
			SVGString += '<circle class="jewel" cx="40" cy="40" r="7.5"/>';
		}
		if (blockType == 'star') {
			SVGString += '<polygon class="shape" points="62.5,45 62.499,34.999 52.071,35 59.445,27.625 52.374,20.555 44.999,27.93 44.999,17.5 35,17.5 35,27.929 27.625,20.555 20.555,27.625 27.928,35 17.5,35 17.5,45 27.929,45 20.555,52.374 27.625,59.445 35,52.072 34.999,62.499 45,62.5 44.999,52.07 52.374,59.445 59.445,52.374 52.071,45 "/>';
		}
		if (blockType == 'ostar') {
			SVGString += oShape;
			SVGString += '<polygon class="shape" points="62.5,45 62.499,34.999 52.071,35 59.445,27.625 52.374,20.555 44.999,27.93 44.999,17.5 35,17.5 35,27.929 27.625,20.555 20.555,27.625 27.928,35 17.5,35 17.5,45 27.929,45 20.555,52.374 27.625,59.445 35,52.072 34.999,62.499 45,62.5 44.999,52.07 52.374,59.445 59.445,52.374 52.071,45 "/>';
		}
		if (blockType == 'plus') {
			SVGString += '<polygon class="shape" points="62.5,35 45,35 45,17.5 35,17.5 35,35 17.5,35 17.5,45 35,45 35,62.5 45,62.5 45,45 62.5,45 "/>';
		}
		if (blockType == 'oplus') {
			//SVGString += oOutline;
			SVGString += oShape;
			SVGString += '<polygon class="shape" points="62.5,35 45,35 45,17.5 35,17.5 35,35 17.5,35 17.5,45 35,45 35,62.5 45,62.5 45,45 62.5,45 "/>';
		}
		if (blockType == 'cross') {
			SVGString += '<polygon class="shape" points="59.445,52.374 47.071,40 59.445,27.625 52.374,20.555 40,32.929 27.625,20.555 20.555,27.625 32.929,40 20.555,52.374 27.625,59.445 40,47.071 52.374,59.445 "/>';
		}
		if (blockType == 'ocross') {
			SVGString += oShape;
			SVGString += '<polygon class="shape" points="59.445,52.374 47.071,40 59.445,27.625 52.374,20.555 40,32.929 27.625,20.555 20.555,27.625 32.929,40 20.555,52.374 27.625,59.445 40,47.071 52.374,59.445 "/>';
		}
		if (blockType == 'arrow1') {
			SVGString += '<polygon class="shape" points="22.42,57.58 46.762,52.419 40,47.071 59.445,27.626 52.374,20.555 32.929,40 27.582,33.238 "/>';

		}
		if (blockType == 'arrow11') {
			SVGString += oShape;
			SVGString += '<polygon class="shape" points="22.42,57.58 46.762,52.419 40,47.071 59.445,27.626 52.374,20.555 32.929,40 27.582,33.238 "/>';
		}
		if (blockType == 'arrow2') {
			SVGString += '<polygon class="shape" points="40,64.861 53.563,44 45,45 45,17.5 35,17.5 35,45 26.438,44 "/>';
		}
		if (blockType == 'arrow22') {
			SVGString += oShape;
			SVGString += '<polygon class="shape" points="40,64.861 53.563,44 45,45 45,17.5 35,17.5 35,45 26.438,44 "/>';
		}
		if (blockType == 'arrow3') {
			SVGString += '<polygon class="shape" points="57.58,57.58 52.419,33.238 47.071,40 27.626,20.555 20.555,27.626 40,47.071 33.238,52.419 "/>';
		}
		if (blockType == 'arrow33') {
			SVGString += oShape;
			SVGString += '<polygon class="shape" points="57.58,57.58 52.419,33.238 47.071,40 27.626,20.555 20.555,27.626 40,47.071 33.238,52.419 "/>';
		}
		if (blockType == 'arrow4') {
			SVGString += '<polygon class="shape" points="15.139,40 36,53.563 35,45 62.5,45 62.5,35 35,35 36,26.438 "/>';
		}
		if (blockType == 'arrow44') {
			SVGString += oShape;
			SVGString += '<polygon class="shape" points="15.139,40 36,53.563 35,45 62.5,45 62.5,35 35,35 36,26.438 "/>';
		}
		if (blockType == 'arrow6') {
			SVGString += '<polygon class="shape" points="64.861,40 44,26.438 45,35 17.5,35 17.5,45 45,45 44,53.563 "/>';
		}
		if (blockType == 'arrow66') {
			SVGString += oShape;
			SVGString += '<polygon class="shape" points="64.861,40 44,26.438 45,35 17.5,35 17.5,45 45,45 44,53.563 "/>';
		}
		if (blockType == 'arrow7') {
			SVGString += '<polygon class="shape" points="22.42,22.42 27.582,46.762 32.929,40 52.374,59.445 59.445,52.374 40,32.929 46.762,27.582 "/>';
		}
		if (blockType == 'arrow77') {
			SVGString += oShape;
			SVGString += '<polygon class="shape" points="22.42,22.42 27.582,46.762 32.929,40 52.374,59.445 59.445,52.374 40,32.929 46.762,27.582 "/>';
		}
		if (blockType == 'arrow8') {
			SVGString += '<polygon class="shape" points="40,15.139 26.438,36 35,35 35,62.5 45,62.5 45,35 53.563,36 "/>';
		}
		if (blockType == 'arrow88') {
			SVGString += oShape;
			SVGString += '<polygon class="shape" points="40,15.139 26.438,36 35,35 35,62.5 45,62.5 45,35 53.563,36 "/>';
		}
		if (blockType == 'arrow9') {
			SVGString += '<polygon class="shape" points="57.58,22.42 33.238,27.581 40,32.929 20.555,52.374 27.626,59.445 47.071,40 52.419,46.762 "/>';
		}
		if (blockType == 'arrow99') {
			SVGString += oShape;
			SVGString += '<polygon class="shape" points="57.58,22.42 33.238,27.581 40,32.929 20.555,52.374 27.626,59.445 47.071,40 52.419,46.762 "/>';
		}
		if (blockType == 'hbar') {
			SVGString += '<rect class="shape" x="17.5" y="35" width="45" height="10"/>';
		}
		if (blockType == 'ohbar') {
			SVGString += oShape;
			SVGString += '<rect class="shape" x="17.5" y="35" width="45" height="10"/>';
		}
		if (blockType == 'vbar') {
			SVGString += '<rect class="shape" x="35" y="17.5" width="10" height="45"/>';
		}
		if (blockType == 'ovbar') {
			SVGString += oShape;
			SVGString += '<rect class="shape" x="35" y="17.5" width="10" height="45"/>';
		}
		if (blockType == 'tlbr') {
			SVGString += '<rect class="shape" x="17.5" y="35" transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 40 96.5684)" width="45" height="10"/>';
		}
		if (blockType == 'otlbr') {
			SVGString += oShape;
			SVGString += '<rect class="shape" x="17.5" y="35" transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 40 96.5684)" width="45" height="10"/>';
		}
		if (blockType == 'bltr') {
			SVGString += '<rect class="shape" x="17.5" y="34.999" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -16.5682 40.0007)" width="45" height="10"/>';
		}
		if (blockType == 'obltr') {
			SVGString += oShape;
			SVGString += '<rect class="shape" x="17.5" y="34.999" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -16.5682 40.0007)" width="45" height="10"/>';
		}
		if (blockType == 'ice') {
			SVGString += '<rect fill="#B6E3FF" width="80" height="80"/>';
			SVGString += '<polygon fill="#CFF1FF" points="80,38.375 0,29.375 0,17.125 80,24 "/>';
			SVGString += '<polygon fill="#CFF1FF" points="80,65 0,49.375 0,37.125 80,50.5 "/>';
			SVGString += '<polygon fill="#FFFFFF" stroke="#B6E3FF" points="25.536,43.786 28.788,54.874 39.875,58.125 28.788,61.377 25.536,72.464 22.285,61.377 11.197,58.125 22.285,54.874 "/>';
			SVGString += '<polygon fill="#FFFFFF" stroke="#B6E3FF" points="53.339,11.322 56.591,22.41 67.678,25.661 56.591,28.913 53.339,40 50.088,28.913 39,25.661 50.088,22.41 "/>';
		}
		if (blockType == 'knight') {
			SVGString += '<path d="M24.457,70.447c0,0,0.238-11.977,6.288-17.872C43.651,40,41.666,37.022,41.666,37.022s-4.964-1.986-11.694,4.082 c-6.729,6.066-11.692,8.493-12.134,3.86c0,0-6.288,0.221-5.957-3.86c0.331-4.082,13.127-19.084,14.893-24.159 c1.765-5.074,1.985-7.391,1.985-7.391s5.185,2.427,6.839,5.074c0,0,3.751-5.185,6.73-5.074l1.103,4.412 c0,0,12.024,1.765,16.988,14.672c4.964,12.907,4.964,41.809,4.964,41.809"/>';
			SVGString += '<path fill="#AD0000" d="M31.347,22.019c0,0-6.067,3.162-6.067,7.281c0,0.184,0,0.441,0,0.441s4.964-1.765,5.516-4.743"/>';
		}
		if (blockType == 'mine') {
			SVGString += `
				<g class="mineMetal">
					<circle cx="40" cy="40" r="4.2"/>
					<path d="M59.7,49.5C59.7,49.5,59.7,49.5,59.7,49.5c0.2-0.4,0.3-0.7,0.5-1.1c0,0,0-0.1,0-0.1c0.1-0.3,0.3-0.6,0.4-1
					c0-0.1,0.1-0.2,0.1-0.3c0.1-0.3,0.2-0.5,0.3-0.8c0-0.1,0.1-0.3,0.1-0.4c0.1-0.2,0.1-0.5,0.2-0.7c0-0.1,0.1-0.3,0.1-0.4
					c0.1-0.2,0.1-0.5,0.1-0.7c0-0.1,0.1-0.3,0.1-0.4c0-0.2,0.1-0.5,0.1-0.7c0-0.1,0-0.3,0.1-0.4c0-0.3,0.1-0.5,0.1-0.8
					c0-0.1,0-0.3,0-0.4c0-0.4,0-0.8,0-1.2c0-0.4,0-0.8,0-1.2c0-0.1,0-0.3,0-0.4c0-0.3,0-0.5-0.1-0.8c0-0.1,0-0.3-0.1-0.4
					c0-0.3-0.1-0.5-0.1-0.8c0-0.1,0-0.3-0.1-0.4c0-0.3-0.1-0.5-0.2-0.8c0-0.1-0.1-0.3-0.1-0.4c-0.1-0.3-0.1-0.5-0.2-0.8
					c0-0.1-0.1-0.2-0.1-0.3c-0.1-0.3-0.2-0.6-0.3-0.9c0-0.1,0-0.1-0.1-0.2c-0.3-0.7-0.6-1.5-0.9-2.2c0,0,0,0,0,0
					c-2.5-5.1-6.9-9.1-12.3-11c0,0,0,0,0,0c-0.4-0.1-0.7-0.2-1.1-0.4c-0.1,0-0.2,0-0.2-0.1c-0.3-0.1-0.6-0.2-0.9-0.2
					c-0.1,0-0.2-0.1-0.3-0.1c-0.3-0.1-0.5-0.1-0.8-0.2c-0.1,0-0.3,0-0.4-0.1c-0.3,0-0.5-0.1-0.8-0.1c-0.1,0-0.3,0-0.4-0.1
					c-0.3,0-0.6-0.1-0.8-0.1c-0.1,0-0.2,0-0.4,0c-0.4,0-0.8,0-1.2,0c-0.4,0-0.8,0-1.2,0c-0.1,0-0.3,0-0.4,0c-0.3,0-0.5,0-0.8,0.1
					c-0.1,0-0.3,0-0.4,0.1c-0.2,0-0.5,0.1-0.7,0.1c-0.1,0-0.3,0.1-0.4,0.1c-0.2,0-0.5,0.1-0.7,0.1c-0.1,0-0.3,0.1-0.4,0.1
					c-0.2,0.1-0.5,0.1-0.7,0.2c-0.1,0-0.3,0.1-0.4,0.1c-0.3,0.1-0.5,0.2-0.8,0.3c-0.1,0-0.2,0.1-0.3,0.1c-0.3,0.1-0.6,0.2-1,0.4
					c0,0-0.1,0-0.1,0c-6,2.5-10.6,7.6-12.5,13.9c0,0.1,0,0.1-0.1,0.2c-0.1,0.3-0.2,0.6-0.2,0.9c0,0.1,0,0.2-0.1,0.3
					c-0.1,0.3-0.1,0.6-0.2,0.8c0,0.1,0,0.3-0.1,0.4c0,0.3-0.1,0.5-0.1,0.8c0,0.1,0,0.3-0.1,0.4c0,0.3-0.1,0.6-0.1,0.8
					c0,0.1,0,0.2,0,0.4c0,0.4,0,0.8,0,1.2c0,0.4,0,0.8,0,1.2c0,0.1,0,0.2,0,0.4c0,0.3,0,0.6,0.1,0.8c0,0.1,0,0.3,0.1,0.4
					c0,0.3,0.1,0.5,0.1,0.8c0,0.1,0,0.3,0.1,0.4c0,0.3,0.1,0.5,0.2,0.8c0,0.1,0.1,0.2,0.1,0.3c0.1,0.3,0.1,0.6,0.2,0.9
					c0,0.1,0,0.2,0.1,0.2c0.1,0.4,0.2,0.7,0.4,1.1c0,0,0,0,0,0c1.9,5.4,5.9,9.8,11,12.3c0,0,0,0,0,0c0.7,0.3,1.4,0.7,2.2,0.9
					c0.1,0,0.1,0,0.2,0.1c0.3,0.1,0.6,0.2,0.9,0.3c0.1,0,0.2,0.1,0.3,0.1c0.3,0.1,0.5,0.1,0.8,0.2c0.1,0,0.3,0.1,0.4,0.1
					c0.3,0.1,0.5,0.1,0.8,0.2c0.1,0,0.3,0.1,0.4,0.1c0.3,0,0.5,0.1,0.8,0.1c0.1,0,0.3,0,0.4,0.1c0.3,0,0.5,0.1,0.8,0.1
					c0.1,0,0.3,0,0.4,0c0.4,0,0.8,0,1.2,0c0.4,0,0.8,0,1.2,0c0.1,0,0.2,0,0.4,0c0.3,0,0.6,0,0.8-0.1c0.1,0,0.3,0,0.4-0.1
					c0.3,0,0.5-0.1,0.8-0.1c0.1,0,0.3,0,0.4-0.1c0.3-0.1,0.6-0.1,0.8-0.2c0.1,0,0.2,0,0.3-0.1c0.3-0.1,0.6-0.2,0.9-0.2
					c0.1,0,0.1,0,0.2-0.1c1.2-0.4,2.3-0.8,3.4-1.3c0,0,0,0,0,0C54,57.4,57.5,53.9,59.7,49.5z M40,46.2c-3.4,0-6.2-2.8-6.2-6.2
					s2.8-6.2,6.2-6.2s6.2,2.8,6.2,6.2S43.4,46.2,40,46.2z"/>
					<path fill="#1C1C1C" d="M18.9,51.1l-1,1c-1.6,1.6-1.6,4.1,0,5.7l4.4,4.4c1.6,1.6,4.1,1.6,5.7,0l1-1C24.7,58.9,21.2,55.4,18.9,51.1z "/>';
					<path fill="#1C1C1C" d="M61.1,29l1.3-1.3c1.6-1.6,1.6-4.1,0-5.7L58,17.7c-1.6-1.6-4.1-1.6-5.7,0l-1.3,1.3 C55.4,21.2,58.9,24.7,61.1,29z"/>';
					<path fill="#1C1C1C" d="M61.1,51c-2.2,4.3-5.7,7.8-10,10.1l1.1,1.1c1.6,1.6,4.1,1.6,5.7,0l4.4-4.4c1.6-1.6,1.6-4.1,0-5.7L61.1,51z" />';
					<path fill="#1C1C1C" d="M18.9,28.9c2.3-4.3,5.8-7.8,10.1-10l-1.2-1.2c-1.6-1.6-4.1-1.6-5.7,0L17.8,22c-1.6,1.6-1.6,4.1,0,5.7 L18.9,28.9z"/>';
				</g>
				<circle class="mineLights" cx="30" cy="30" r="2"/>
				<circle class="mineLights" cx="50" cy="30" r="2"/>
				<circle class="mineLights" cx="30" cy="50" r="2"/>
				<circle class="mineLights" cx="50" cy="50" r="2"/>
				`;
		}
		if (blockType == 'reclaim') {
			SVGString += `<polygon fill="#E3FFE1" points="13.2,21.3 15.1,27.8 21.5,29.7 15.1,31.6 13.2,38 11.3,31.6 4.8,29.7 11.3,27.8 	"/>
			<polygon fill="#E3FFE1" points="40.8,60 42.7,66.4 49.2,68.3 42.7,70.2 40.8,76.7 38.9,70.2 32.5,68.3 38.9,66.4 	"/>
			<polygon fill="#E3FFE1" points="64.5,37.2 66.3,43.6 72.8,45.5 66.3,47.4 64.5,53.8 62.6,47.4 56.1,45.5 62.6,43.6 	"/>
			<polygon fill="#E3FFE1" points="62.7,11.2 64.6,17.6 71,19.5 64.6,21.4 62.7,27.8 60.8,21.4 54.3,19.5 60.8,17.6 	"/>
			<polygon fill="#E3FFE1" points="32.5,3.8 34.4,10.3 40.8,12.2 34.4,14.1 32.5,20.5 30.6,14.1 24.1,12.2 30.6,10.3 	"/>
			<polygon fill="#E3FFE1" points="15.5,50.3 17.4,56.8 23.9,58.7 17.4,60.6 15.5,67 13.7,60.6 7.2,58.7 13.7,56.8 	"/>
			<path fill="#006616" d="M45.5,62.8l-0.4-0.6c-0.5-0.8-1.3-2.7-3.1-10.3c-1.1-5-2.6-5.8-5.7-5.9h-1.6v16.8H22.6V18.3l1-0.2
			c3.5-0.6,8.3-0.9,13.1-0.9c6.9,0,11.4,1.1,14.6,3.6c2.9,2.3,4.4,5.7,4.4,9.9c0,5-2.9,8.7-6.3,10.7c2.6,2,3.7,5.2,4.4,7.6
			c0.4,1.3,0.7,2.7,1.1,4c0.9,3.3,1.8,6.7,2.3,7.8l0.9,1.8H45.5z M37.2,36.5c4,0,6.4-1.8,6.4-4.9c0-3.1-2-4.6-5.9-4.7
			c-1.2,0-2.2,0.1-3.1,0.1v9.4H37.2z"/>
			<path fill="#B3FFC1" d="M36.7,18.5c6.3,0,10.8,1,13.8,3.4c2.5,2,3.9,5,3.9,8.9c0,5.4-3.9,9.2-7.5,10.5v0.2c3,1.2,4.6,4.1,5.7,8
			c1.3,4.8,2.7,10.4,3.5,12h-9.9c-0.7-1.2-1.7-4.7-3-9.9c-1.1-5.3-3-6.8-6.9-6.8h-2.9v16.8h-9.6V19.4C27,18.9,31.6,18.5,36.7,18.5
			 M33.4,37.8h3.8c4.8,0,7.7-2.4,7.7-6.1c0-3.9-2.7-5.9-7.1-6c-2.3,0-3.7,0.2-4.4,0.3V37.8 M36.7,16c-4.8,0-9.7,0.3-13.3,0.9
			l-2.1,0.3v2.1v42.1V64h2.5h9.6h2.5v-2.5V47.2h0.4c2.3,0,3.5,0.3,4.5,4.9l0,0l0,0c1.8,7.6,2.7,9.7,3.2,10.6l0.7,1.2h1.4h9.9h4
			l-1.8-3.6c-0.5-1-1.4-4.5-2.2-7.5c-0.4-1.3-0.7-2.7-1.1-4.1c-0.6-2.2-1.6-5-3.6-7.2c3.1-2.3,5.5-6.1,5.5-10.9
			c0-4.6-1.7-8.3-4.9-10.9C48.7,17.2,44,16,36.7,16L36.7,16z M35.9,28.2c0.6,0,1.2,0,1.9,0c4.6,0.1,4.6,2.4,4.6,3.5
			c0,3.2-3.2,3.6-5.2,3.6h-1.3V28.2L35.9,28.2z"/>`;
		}
		SVGString += '<path class="border" d="M80,80H0V0h80V80L80,80z M2.5,77.5h75v-75h-75V77.5L2.5,77.5z"/>';
		
		if (!(blockType === 'mine' && where === 'board')) {
			SVGString += '<rect class="border2" x="2.5" y="2.5" fill="none" stroke-width="1.5" width="75" height="75"/>';
		}
		SVGString += '</svg>';
	}
	return SVGString;
}

function updateBlock (x, y, blockType, possessionDisplayName, moveNum, origin, color, duration, history, originColor, possession, possessionColorSpread) {
    
	
	
	var id = '#x' + x + 'y' + y;
	if (blockType == "blank") {
		$(id).empty().addClass('empty').css('background-color', '');
	} else if (blockType == "blockade") {
		$(id).empty().addClass('blockade').removeClass('empty').css('background-color', '#000000');
		if (duration !== false) {
			if (typeof moveNum !== 'undefined' && moveNum > 0) {
				$(id).append('<span class="duration">' + (duration) + '</span>');
			}
		}
	} else if (blockType != "blank") {
		var SVGString = getSVG8by8(blockType, 'board');
		
		// newly added mine code.
		if (blockType !== 'mine') {
			$(id).html(SVGString).removeClass('empty');
		} else {
			$(id).html(SVGString).addClass('empty');
		}
		
		if (blockType == 'ice') {
			$(id).addClass('ice');
		}
		
		if (typeof color != 'undefined') {
			if (color == emptyColor && blockType !== 'mine') { // not sure what's going on here with if color == emptyColor... kind of weirdness.
				$(id).css('background-color', ColorLuminance(color, 0.1));
			} else {
				$(id).css('background-color', '');
			}
		}
	}
	
	// set data attr
	$(id).data("blockType", blockType); 
	$(id).data("possession", possession); 
	$(id).data("possessionDisplayName", possessionDisplayName); 
	$(id).data("moveNum", moveNum); 
	$(id).data("x", x); 
	$(id).data("y", y); 
	$(id).data("history", history); 
	$(id).data("possessionColorSpread", possessionColorSpread);
	
	if (typeof color !== 'undefined') {
		
		$(id).data("possessionColor", color); 
		// remove any prior color class
		
		$(id).removeClass(function (index, css) {
			return (css.match (/\bcolor-\S+/g) || []).join(' ');
		});
		
		if ($('#color-' + color.substr(1)).length < 1) {
			addNewStyle(color);
		}
		
		if (typeof possessionColorSpread !== 'undefined') {
			if (possessionColorSpread.length > 0) {
				for (var i = 0; i < possessionColorSpread.length; i++) {
					
					var colorClass = 'color-' + possessionColorSpread[i].color.substr(1);
					var tempColor = possessionColorSpread[i].color;
					$(id).addClass('color-d5ccbd');
					if (blockType !== 'blank') {
						$(id).css('background-color', ColorLuminance(emptyColor, 0.1));
					}
					setTimeout(function(){ 
						// add the new one
						$(id).removeClass('color-d5ccbd');
						var mixed = mix(emptyColor, tempColor, 60);
						$(id).css('background-color', mixed); 
						$(id).addClass(colorClass);
						setTimeout(function() {
							$(id).css('background-color', '');
						}, 100);
					}, ((possessionColorSpread[i].layer+1) * 100) + 100);
				}
			} else {
				$(id).addClass('color-' + color.substr(1));
			}
		} else {
			$(id).addClass('color-' + color.substr(1));
		}
		
		
		if ((moveNum == global_moveCount) && (global_moveCount > 0) && (showWinState == false)) {
			if (origin == 'collision' || origin == 'collision fade') {
				$(id).addClass("prior-" + collisionColor.substr(1));
				/*
				$(id).addClass("newMove");
				setTimeout(function(){ 
					$(id).removeClass("newMove");
				}, 1000);
				*/
			} else {
				$(id).addClass("prior-" + originColor.substr(1));
				/*
				$(id).addClass("newMove");
				setTimeout(function(){ 
					$(id).removeClass("newMove");
				}, 1000);
				*/
			}
		}
		
		/*
		if (typeof origin == 'string') {
			if ((moveNum == global_moveCount) && (global_moveCount > 0) && (showWinState == false)) {
				if (origin == 'collision') {
					origin = collisionColor;
				}
				$(id).addClass("prior-" + origin.substr(1));
			} else {
				$(id).removeClass("prior-" + origin.substr(1));
			}
		}*/
	}
}
function obtainID (object) {
	//this gets the ID from the object. this is hard because x/y can be 1 or 2 characters long.
	var id = $(object).attr('id');
	var index = id.indexOf("y");  // breaks the ID into two sections at the "y" symbol
	var x = parseInt(id.substr(1, index), 10); // Gets the first part as an int
	var y = parseInt(id.substr(index + 1), 10);  // Gets the second part as an int
	return [x,y];
}
function get_pos(x,y,cols) {
	return (y - 1) * cols + x - 1;
}
function highlight(x,y, someType, rows, cols) {
	var dir = [];
	dir = getMoves(someType);
	
	// for each direction,
	$.each(dir, function( index, value ) {
		
		//get the actual x/y coord from the relative position
		var newX = x + value[0];
		var newY = y + value[1];
			
		// if we're not out of bounds
		if (((newX >= 1) && (newX <= cols)) && ((newY >= 1) && (newY <= rows))) {
			$('#x' + newX + 'y' + newY).addClass('highlighted'); // highlight the block
		}
	});
}
function getMoves(blockType) { // used for highlighting blocks
	var blockList = {
		'base': function () { return [[-1,-1], [0,-1], [1,-1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]; },
		'star': function () { return [[-1,-1], [0,-1], [1,-1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]; },
		'ostar': function () { return [[-2,-2], [0,-2], [2,-2], [-2, 0], [2, 0], [-2, 2], [0, 2], [2, 2]]; },
		'p1': function () { return [[-1,-1], [0,-1], [1,-1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]; },
		'p2': function () { return [[-1,-1], [0,-1], [1,-1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]; },
		'plus': function () { return [[0,-1], [-1, 0], [1, 0], [0, 1]]; },
		'oplus': function () { return [[0,-2], [-2, 0], [2, 0], [0, 2]]; },
		'cross': function () { return [[-1,-1], [1,-1], [-1, 1], [1, 1]]; },
		'ocross': function () { return [[-2,-2], [2,-2], [-2, 2], [2, 2]]; },
		'hbar': function () { return [[-1, 0], [1, 0]]; },
		'ohbar': function () { return [[-2, 0], [2, 0]]; },
		'vbar': function () { return [[0, -1], [0, 1]]; },
		'ovbar': function () { return [[0, -2], [0, 2]]; },
		'tlbr': function () { return [[-1, -1], [1, 1]]; },
		'otlbr': function () { return [[-2, -2], [2, 2]]; },
		'bltr': function () { return [[-1, 1], [1, -1]]; },
		'obltr': function () { return [[-2, 2], [2, -2]]; },
		'arrow1': function () { return [[-1, 1]]; },
		'arrow11': function () { return [[-2, 2]]; },
		'arrow2': function () { return [[0, 1]]; },
		'arrow22': function () { return [[0, 2]]; },
		'arrow3': function () { return [[1, 1]]; },
		'arrow33': function () { return [[2, 2,]]; },
		'arrow4': function () { return [[-1, 0]]; },
		'arrow44': function () { return [[-2, 0]]; },
		'arrow6': function () { return [[1, 0]]; },
		'arrow66': function () { return [[2, 0]]; },
		'arrow7': function () { return [[-1, -1]]; },
		'arrow77': function () { return [[-2, -2]]; },
		'arrow8': function () { return [[0, -1]]; },
		'arrow88': function () { return [[0, -2]]; },
		'arrow9': function () { return [[1, -1]]; },
		'arrow99': function () { return [[2, -2,]]; },
		'blockade': function () { return [[]]; },
		'blank': function () { return [[]]; },
		'ice': function () { return [[]]; },
		'knight': function () { return [[1, 2], [2, 1], [-1, 2], [2, -1], [1, -2], [-2, 1], [-1, -2], [-2, -1]]; },
		'mine': function () { return [[]]; },
		'reclaim': function () { return [[]]; }
	};

	if (typeof blockList[blockType] !== 'function') {
		console.log ("SHIT! SHIT!");
		throw new Error('Invalid action.');
	}

	return blockList[blockType]();
}
function getCircleType (initialType) {
	if (initialType == 'star') { return 'ostar'; }
	else if (initialType == 'plus') { return 'oplus'; }
	else if (initialType == 'cross') { return 'ocross'; }
	else if (initialType == 'hbar') { return 'ohbar'; }
	else if (initialType == 'vbar') { return 'ovbar'; }
	else if (initialType == 'tlbr') { return 'otlbr'; }
	else if (initialType == 'bltr') { return 'obltr'; }
	else if (initialType == 'arrow1') { return 'arrow11'; }
	else if (initialType == 'arrow2') { return 'arrow22'; }
	else if (initialType == 'arrow3') { return 'arrow33'; }
	else if (initialType == 'arrow4') { return 'arrow44'; }
	else if (initialType == 'arrow6') { return 'arrow66'; }
	else if (initialType == 'arrow7') { return 'arrow77'; }
	else if (initialType == 'arrow8') { return 'arrow88'; }
	else if (initialType == 'arrow9') { return 'arrow99'; }
	else { return false; }
}

// joinGame sets things up for in-game play
// only called from 'all players ready', so joining in-progress will not call this function.
function joinGame(gameID, moveCount, timeLeft, players, rows, cols, board, gameType) {
	$(".menu_block").removeClass('nohover');
	function youArePlaying() {
		for (var id in players) {
			if (id == you) {
				return true;
			}
		}
		return false;
	}
	opponents = [];
	if (youArePlaying()) {
		$(".block").removeClass('nohover');
		player = true;
		for (var id in players) {
			if (id != you) {
				opponents.push(id);
			}
		}
		
		if (gameType === 'practice') {
			if ($("#reset").length === 0) {
				$("#gameButtons").prepend('<div class="buttonStyle" id="reset">Reset</div>');
				$("#reset").on("click",function() {
					if (global_moveCount > 1) {
						socket.emit('practice reset');
					}
				});
			}
		} else {
			$("#gameButtons").prepend('<div class="buttonStyle" id="forfeit">Forfeit</div>');
			$("#forfeit").on("click",function() {
				socket.emit('forfeit');
			});
		}
		
		/*
		if (players[you].offeredDraw) {
			$("#sidebar").prepend('<div id="offerDraw">Offered Draw</div>');
		} else {
			
			for (var i = 0; i < opponents.length; i++) {
				if (opponent[i].offeredDraw) {
					$("#sidebar").prepend('<div class="sideButton" id="offerDraw">Offer Draw</div>')
					drawOffered(gameID);
				}
			}
			
			opponent(trackPlayerNum) == offeredDraw) {
			$("#sidebar").prepend('<div class="sideButton" id="offerDraw">Offer Draw</div>')
			drawOffered(gameID);
		} else {
			$("#sidebar").prepend('<div class="sideButton" id="offerDraw">Offer Draw</div>')
			$("#offerDraw").on("click",function() {
				socket.emit('offer draw', gameID);
				$("#offerDraw").html('Offered Draw');
				$("#offerDraw").removeClass('sideButton');
				$("#offerDraw").off();
			});
		}
		*/
		//buildMenu();
		
		var x = false, y = false, xy = false, type, initialType = 'blank';
		
		$(document).off('click');
		$(document).on("click", function(e) {
			if ((standby == false) && (menuState == true)) {
				if ($(e.target).closest(".block").length === 0) {
					if ($(e.target).closest(".menu_block:not(.nohover)").length === 0) {
						outsideClick();
					}
				}
			}
		});
		
		function outsideClick() {
			$('#x' + x + 'y' + y).removeClass('prior-' + players[you].color.substr(1)).removeClass('highlighted');
			$(".menu_block").addClass("disabled");
			menuState = false;
			//log('<span class="dimMsg">outside click</span>');
		}
		$('.block').off();
		$('.block').on("click",function() {
			//log(standby + " " + menuState + " " + players[you].color);
			// if the game is active
			if (standby == false) {
				xy = obtainID($(this));
				x = xy[0];
				y = xy[1];
				$(".highlighted").removeClass('highlighted');
				$(this).addClass('highlighted');
				$('.prior-' + collisionColor.substr(1)).removeClass('prior-' + collisionColor.substr(1));
				
				if ($(this).hasClass('prior-' + players[you].color.substr(1))) {
				// if this block is already activated by you, deactivate it.
				
					$('.prior-' + players[you].color.substr(1)).removeClass('prior-' + players[you].color.substr(1)).removeClass('highlighted');
					$(".menu_block").addClass("disabled");
					menuState = false;
					
				} else {
				// else, activate this block.
				
					$('.prior-' + players[you].color.substr(1)).removeClass('prior-' + players[you].color.substr(1));
					$(this).addClass('prior-' + players[you].color.substr(1));
					
					if ($(this).hasClass('empty')) {
						$(".menu_block:not(.nohover)").removeClass("disabled");
						$("#circle").addClass("disabled");
						$("#reclaim").addClass("disabled");
						menuState = true;
						//type = $(this).data('blockType');
						//highlight(x, y, type, rows, cols);
					} else {
						initialType = $('#x' + x + 'y' + y).data('blockType');
						$(".menu_block").addClass('disabled');
						menuState = true;
						if (getCircleType(initialType) != false) {
							$("#circle:not(.nohover)").removeClass('disabled');
						}
						var possession = $('#x' + x + 'y' + y).data('possession');
						if (possession.length == 1) {
							if ((possession[0] == you) && (initialType !== 'base') && (initialType !== 'blockade')) {
								$("#reclaim:not(.nohover)").removeClass('disabled');
							}
						}
					}
				}
				for (var i = 0; i < opponents.length; i++) {
					$('.prior-' + players[opponents[i]].color.substr(1)).removeClass('prior-' + players[opponents[i]].color.substr(1));
					// this put undefined?? idk.
				}
			}
		});
		
		$( ".block" ).hover(function() {
			if (standby == false) {
				let tempXY = obtainID($(this));
				let tempX = tempXY[0];
				let tempY = tempXY[1];
				type = $(this).data('blockType');
				highlight(tempX, tempY, type, rows, cols); // show what moves are possible from that block
			}
		}, function() {
			if (standby == false) {
				// remove prior highlight
				$('.highlighted').removeClass('highlighted');
			}
		});
		
		//log("off2");
		//$( ".menu_block" ).off(); // remove prior click handlers if needed....
		
		$("#menuContainer").on({
			mouseenter: function () {
				//stuff to do on mouse enter
				if ($(this).hasClass('disabled') || (menuState == false)) {
					//log ('hover failed');
				} else {
					type = $(this).attr('id');
					initialType = $('#x' + x + 'y' + y).data('blockType');
					var pos = get_pos(x, y, cols);
					if (type == 'circle') {
						type = getCircleType(initialType);
					}
					updateBlock (x,y,type);
					highlight(x, y, type, rows, cols); // show what moves are possible from that block
					var hoverAudio = new Audio("sfx/hover.ogg");
					if (audioEnabled) {
						hoverAudio.play(); // play audio
					}
				}
			},
			mouseleave: function () {
				// this is a mouse out function for when the hover ends
				if ($(this).hasClass('disabled') || (menuState == false)) {
					// no hover.
				} else {
					updateBlock(x,y,initialType);
					$(".highlighted").not('#x' + x + 'y' + y).removeClass("highlighted"); // remove the highlighted moves, keep the selected square highlighted though.
				}
			}
		}, ".menu_block:not(.nohover)"); //pass the element as an argument to .on
		
		/*
		// hover over a menu block
		$("#menuContainer").on("mouseover", ".menu_block:not(.nohover)", function() {
		//$( ".menu_block:not(.nohover)" ).hover(function() {
			if ($(this).hasClass('disabled') || (menuState == false)) {
				//log ('hover failed');
			} else {
				type = $(this).attr('id');
				initialType = $('#x' + x + 'y' + y).data('blockType');
				var pos = get_pos(x, y, cols);
				if (type == 'circle') {
					type = getCircleType(initialType);
				}
				updateBlock (x,y,type);
				highlight(x, y, type, rows, cols); // show what moves are possible from that block
				var hoverAudio = new Audio("sfx/hover.ogg");
				if (audioEnabled) {
					hoverAudio.play(); // play audio
				}
			}
		}, function() {
			// this is a mouse out function for when the hover ends
			if ($(this).hasClass('disabled') || (menuState == false)) {
				// no hover.
			} else {
				updateBlock(x,y,initialType);
				$(".highlighted").not('#x' + x + 'y' + y).removeClass("highlighted"); // remove the highlighted moves, keep the selected square highlighted though.
			}
		});
		*/
		
		// when a menu block is clicked
		$('#menuContainer').on("click", ".menu_block:not(.nohover)", function() {
		//$('.menu_block:not(.nohover)').on("click",function() {
			if (menuState == true && standby == false) { // if menu and game are both active
				if ($(this).hasClass('disabled')) {
					outsideClick();
				} else {
					renderStandby();
					type = $(this).attr('id');
					if ($(this).find('.ammo').length != 0) {
						var ammo = parseInt($('#' + type + '-ammo').html());
						ammo--;
						$('#' + type + '-ammo').html(ammo);
						if (ammo == 0) {
							$(this).addClass('nohover disabled noammo'); //.css('opacity', '0.5'); //.off();
							// the css opacity 0.5 doesn't work anymore cause that's set in the disabled class now.
							// off doesn't seem to matter bc i check for 0 ammo anyway, it only interferes w/ blockHoverData();
						}
					}
					socket.emit('attempt move', x, y, type, global_moveCount); // moveCount to check if it was placed at the last split second before the turn: returns invalid move.
				}
			}
		});
		
		var opponent = false;
		
		if (opponents.length < 1) {
			// practice mode.
			standby = false;
		} else {
			
			// dunno if this chunk of code matters anymore, players cannot quit a game in progress anymore..?
			if (players[you].onStandBy) {
				standby = true;
				//$('#x' + tempBlock[0] + 'y' + tempBlock[1]).removeClass('prior1').removeClass('prior2').removeClass('prior3').addClass('prior' + playerNum);
				var pos = get_pos(tempBlock[0], tempBlock[1], numCols);
				updateBlock(tempBlock[0],tempBlock[1],tempBlock[2], undefined, undefined, boardData[pos].randInt); // show what block you selected
				renderStandby();
			} else if (opponents[0].onStandBy) {
				standby = true;
				// really need to work in more than 2 players for this.
				//waitMsg(opponent(trackPlayerNum));
			} else {
				standby = false;
			}
		}
		
	} else {
		renderExitButton();
		$(".block").addClass('nohover');
	}
	
	menuState = false;
	
}

/* function changeFavIcon(src) {
	$('link[rel="shortcut icon"]').attr('href', src + '?v=' + Date.now());
	//$('link[rel="shortcut icon"]').attr('href', src);
}
*/
function timeLimitUpdate(timeLimit) {
	if (timeLimit == false) {
			$("#timeLimit").html('&infin;');
		} else {
			$("#timeLimit").html(timeLimit);
		}
	log ('<span class="dimMsg">time limit set to ' + ($('#timeLimit').html()));
}
function collisionUpdate(collisionMode) {
	if (typeof collisionMode !== 'undefined') {
		if (collisionMode.permanence === true) {
			$("#collisionSetting").html('Permanent');
			log('<span class="dimMsg">permanent collisions</span>');
		} else {
			var sString = 's';
			if (collisionMode.permanence === 1) {
				sString = '';
			}
			$("#collisionSetting").html('<span class="collisionTurnCount">' + collisionMode.permanence.toString() + '</span> Turn' + sString);
			log('<span class="dimMsg">collisions last ' + collisionMode.permanence.toString() + ' turn' + sString);
		}
	}
}
function renderStandby() {
	standby = true;
	$("#container").removeClass("timeWarning");
	$(".menu_block").addClass("disabled");
	$(".block").addClass("nohover").removeClass('highlighted').addClass('disabled');
	menuState = false; // disable the menu, because a move was made.
}
function drawOffered(gameID) {
	$("#offerDraw").off(); // remove clickhandler from offerDraw
	$("#offerDraw").addClass('offered');
	$("#offerDraw").html('Accept Draw');
	$("#offerDraw").on('click', function() {
		cleanup(3, 'drawAccepted');
		socket.emit('draw accepted', gameID); // let the other players know the draw was accepted.
	});
}
function cleanup(winners, reason) {
	//log('The game is over.');
	$("#container").removeClass("timeWarning");
	clearInterval(gameTimer);
	
	if (winners.length > 1) {
		if (audioEnabled) {
			drawgameAudio.play();
		}
	} else {
		if (winners[0] == you) {
			if (audioEnabled) {
				youwinAudio.play();
			}
		} else {
			if (audioEnabled) {
				gameoverAudio.play();
			}
		}
	}
	
	if (player) {
		if (reason !== 'dc' && reason !== 'practice') {
			$('<div class="buttonStyle" id="rematch"><span>Rematch</span></div>').insertBefore('#toggleAudio');
			$("#rematch").on('click', function() {
				socket.emit('yes rematch');
				$("#rematch").off()
				$("#rematch > span").text("Offered Rematch").addClass("blinkText");
			});
		}
	}

	$(".block", "#board").addClass('disabled').off();
	for (var i = 0; i < priorColorList.length; i++) {
		$(".block").removeClass(priorColorList[i]); // this is longer than it needs to be for each game, oh well maybe fix later.
	}
	$(".highlighted").removeClass('highlighted');
	//$("#menu").css('opacity', '0.5'); // dim the menu
	//$("#menuContainer").off();
	$(".menu_block").addClass('disabled');
	$("#offerDraw").remove();
	$("#forfeit").remove();
	$(".moveStatus").remove(); // remove the move status
	$("#timer").remove();
	$(".waitMsg").parent().remove();
	//blockHoverData();
	renderExitButton();
	
	debounce = Math.random();
	var temp = debounce;
	if (ghostFlow) {
		setTimeout(function(){ 
			if (debounce == temp) {
				exitGame();
			}
		}, 60000);
	}
}

function readableBlockName(blockType) { // returns blocknames for hover info that don't suck
	var blockList = {
		'base': 'source',
		'ostar': 'jump star',
		'plus': '+',
		'oplus': 'jump +',
		'cross': 'x',
		'ocross': 'jump x',
		'ohbar': 'jump hbar',
		'ovbar': 'jump vbar',
		'otlbr': 'jump tlbr',
		'obltr': 'jump bltr',
		'arrow1': 'arrow1',
		'arrow11': 'jump arrow1',
		'arrow2': 'arrow2',
		'arrow22': 'jump arrow2',
		'arrow3': 'arrow3',
		'arrow33': 'jump arrow3',
		'arrow4': 'arrow4',
		'arrow44': 'jump arrow4',
		'arrow6': 'arrow6',
		'arrow66': 'jump arrow6',
		'arrow7': 'arrow7',
		'arrow77': 'jump arrow7',
		'arrow8': 'arrow8',
		'arrow88': 'jump arrow8',
		'arrow9': 'arrow9',
		'arrow99': 'jump arrow9',
		'mine': 'stealthy mine'
	}
	
	if (blockList.hasOwnProperty(blockType)) {
		return blockList[blockType];
	} else {
		return blockType;
	}
}

function blockHoverData() {
	
	$("#board").on({
		mouseenter: function () {
			//stuff to do on mouse enter
			var blockType = ($(this).data('blockType'));
			blockType = readableBlockName(blockType);
			var history = $(this).data('history');
			var possessionColor = $(this).data('possessionColor');
			var xx = $(this).data('x'); //x pos
			var yy = $(this).data('y'); //y pos
			var showHistory = true;
			
			var possessionDisplayName = $(this).data('possessionDisplayName');
			var possessionSpread = $(this).data('possessionColorSpread');

			if (blockType == 'source') {
				if (typeof history[0] !== 'undefined') {
					blockType = '<span style="color: ' + history[0].playerColor + ';">' + history[0].playerDisplayName + '\'s source</span>';
					showHistory = false;
				} else {
					blockType = 'unclaimed source';
					showHistory = false;
				}
			}
			
			var appendString = '<div class="dimMsg">x: <b>' + xx + '</b>,&ensp;y: <b>' + yy + '</b></div>';
			appendString += '<div style="font-weight: bold; color:white; font-size:15px;">' + blockType + '</div>';
			
			if (showHistory && possessionDisplayName !== false && blockType !== 'blockade') {
				appendString += '<div>possessed by <b style="color: ' + possessionColor + '">' + possessionDisplayName + '</b></div>';
			}
			
			if (showHistory) {
				for (var i = 0; i < history.length; i++) {
					
					appendString += history[i];
					
					/*
					appendString += '<div><b>' + readableBlockName(history[i].blockType) + '</b>';
					if (history[i].cause == 'player') {
						appendString += ' placed by <b style="color: ' + history[i].playerColor + '">' + history[i].playerDisplayName + '</b>';
					} else {
						appendString += ' caused by <b>' + history[i].cause + '</b>';
					}
					appendString += ' on turn <b>' + history[i].turn + '</b>.</div>'
					*/
				}
			}
			
			$("#bottomInfo").append(appendString);
		},
		mouseleave: function () {
			// this is a mouse out function for when the hover ends
			$("#bottomInfo").html('');
		}
	}, ".block"); //pass the element as an argument to .on
	
	
	$("#menuContainer").on({
		mouseenter: function () {
			//stuff to do on mouse enter
			var type = $(this).attr('id');
			var blockType = readableBlockName(type);
			var appendString = '';
			if (player) {
				appendString += '<div>' + yourName + '\'s stockpile</div>';
			} else {
				appendString += '<div class="dimMsg">starting stockpile</div>';
			}
			appendString += '<div style="font-weight: bold; color:white; font-size:15px;">' + blockType + '</div>';
			var ammo;
			if ($(this).find('.ammo').length != 0) {
				ammo = parseInt($('#' + type + '-ammo').html());
				appendString += '<div><b>' + ammo + '</b> remaining</div>';
			}
			/*
			if (type == 'star') {
				appendString += `<div>a <i>star</i>, similar to the player's <i>source</i>, spreads color to all 8 adjacent squares.</div>`;
			}
			if (type == 'plus') {
				appendString += `<div>a <i>+</i> is a basic block that spreads color to the 4 adjacent non-diagonal squares.</div>`;
			}
			if (type == 'cross') {
				appendString += `<div>an <i>x</i> is a basic block that spreads color to the 4 adjacent diagonal squares.</div>`;
			}
			if (type == 'circle') {
				appendString += `<div>a <i>circle</i> turns an uncircled block into a jump block. a circle may be placed on any uncircled block already on the board, 
				including blocks placed by the opponent. you may not circle a <i>source</i>, however.</div>`;
			}
			if (type == 'reclaim') {
				appendString += `<div>you may <i>reclaim</i> any block that you have sole possession over, including blocks placed by the opponent. 
				a reclaimed block becomes a blank space on the board, and will add to your stockpile. you cannot reclaim your <i>source</i>.</div>`;
			}
			if (type == 'mine') {
				appendString += `<div>a <i>stealthy mine</i> may be placed on any blank space. it is invisible to the opponent and spectators. 
				attempting to place a block where a mine is will result in a blockade being formed. mines are un-reclaimable.</div>`;
			}
			*/
			$("#bottomInfo").append(appendString);
		},
		mouseleave: function () {
			// this is a mouse out function for when the hover ends
			$("#bottomInfo").html('');
		}
	}, ".menu_block"); //pass the element as an argument to .on
}

function renderExitButton() {
	if ($("#exit").length === 0) {
		$("#gameButtons").prepend('<div id="exit" class="buttonStyle">Exit to Lobby</div>');
		$("#exit").on('click', function() {
			exitGame();
		});
	}
}
function exitGame() {
	$("#sidebar").empty();
	$("#container").removeClass("timeWarning");
	clearInterval(gameTimer);
	$(".waitMsg").parent().remove();
	inGame = false;
	showWinState = false;
	socket.emit('exit to lobby');
}
function showPath(winPath, color) {
	
	var winAnimation1, winAnimation2;
	
	$.each(winPath, function( index, value ) {
		$( '.block:eq(' + value + ')' ).removeClass('disabled').addClass('nohover');
		winAnimation1 = setTimeout(function(){
			if (showWinState == true) {
				$( '.block:eq(' + value + ')' ).addClass('prior-' + color.substr(1));
			} else {
				$('.block').removeClass('prior' + color.substr(1));
				clearTimeout(winAnimation1);
				clearTimeout(winAnimation2);
			}
		}, 500 * index);
		winAnimation2 = setTimeout(function(){
			$( '.block:eq(' + value + ')' ).removeClass('prior-' + color.substr(1));
			if (index == winPath.length - 1) {
				if (showWinState == true) {
					showPath(winPath, color);
				} else {
					clearTimeout(winAnimation1);
					clearTimeout(winAnimation2);
				}
			}
		}, 500 * (index + 1));
	});
}

function ColorLuminance(hex, lum) { // thanks Craig Buckler for this function

	//hex � a hex color value such as �#abc� or �#123456� (the hash is optional)
	//lum � the luminosity factor, i.e. -0.1 is 10% darker, 0.2 is 20% lighter, etc.
	
	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	}
	lum = lum || 0;

	// convert to decimal and change luminosity
	var rgb = "#", c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i*2,2), 16);
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
		rgb += ("00"+c).substr(c.length);
	}

	return rgb;
}
function mix (color_1, color_2, weight) {
	color_1 = color_1.slice(1);
	color_2 = color_2.slice(1);
	function d2h(d) { return d.toString(16); }  // convert a decimal value to hex
	function h2d(h) { return parseInt(h, 16); } // convert a hex value to decimal
	weight = (typeof(weight) !== 'undefined') ? weight : 50; // set the weight to 50%, if that argument is omitted
	var color = "#";
	for(var i = 0; i <= 5; i += 2) { // loop through each of the 3 hex pairs�red, green, and blue
		var v1 = h2d(color_1.substr(i, 2)), // extract the current pairs
			v2 = h2d(color_2.substr(i, 2)),
			// combine the current pairs from each source color, according to the specified weight
			val = d2h(Math.floor(v2 + (v1 - v2) * (weight / 100.0)));
		while(val.length < 2) { val = '0' + val; } // prepend a '0' if val results in a single digit
		color += val; // concatenate val to our new color string
	}
	return color;
};
function addNewStyle(color) {
	
	// I will sometimes call this not just when setting up the page
	// but also when a new color mix is found on a block.
	// because I don't want to pre-generate those
	// I'll do it on the spot.
	// in the updateBlock() function.
	
	var styleID = "color-" + color.substr(1);
	$("head").append('<style class="dynamicStyle" id="' + styleID + '"></style>');
	var rule = ''
	
	// BLOCK
	rule += '.' + styleID + ' { background-color: ' + color + '; } ';
	
	/*box-shadow: inset 0 0 0 1px '+ ColorLuminance(color, -0.3) +', inset 0 0 0 2px '+ ColorLuminance(color, -0.01) +', inset 0 0 0 4px '+ ColorLuminance(color, -0.05) + ';}';*/
	
	// SVG BORDER
	//rule += '.' + styleID + ' svg .border { stroke: '+ ColorLuminance(color, 0.25) +'; fill: '+ ColorLuminance(color, -0.45) + ' }';
	
	rule += '.' + styleID + ' svg .border { fill: '+ ColorLuminance(color, -0.65) +' }';
	rule += '.' + styleID + '.empty svg .border { opacity: 0; }';
	rule += '.' + styleID + ' svg .border2 { stroke: '+ ColorLuminance(color, 0.125) +' }';
	
	if (color !== emptyColor) {
		// SVG OUTLINE
		rule += '.' + styleID + ' svg .outline { fill: '+ ColorLuminance(color, 0.125) +'; }';
		//rule += '.' + styleID + ' svg .circleoutline { stroke: '+ ColorLuminance(color, 0.25) +'; }';
		
		// SVG BASE JEWEL
		rule += '.' + styleID + ' svg .jewel { fill: '+ color +'; animation: jewel-' + color.substr(1) +' 1s infinite alternate ease-in-out; }';
		rule += '@keyframes jewel-'+ color.substr(1) +' { 0% { opacity: 0.2; } 100% { opacity: 1; } }';

	}
	
	// EMPTY
	var mixed = mix(color, emptyColor, 55); // old was 35
	//var mixed2 = mix(color, emptyColor, 50);
	//mixed2 = ColorLuminance(mixed2, -0.09);
	var mixed2 = ColorLuminance(color, -0.09);
	rule += '.' + styleID + '.empty { background-color: ' + mixed + '; box-shadow: inset 0 0 0 1px '+ mixed2 +';  }';
	//rule += '.' + styleID + '.empty { box-shadow: inset 0 0 0 1px '+ mixed2 +'; }';
	
	// HOVER
	rule += '.' + styleID + ':hover:not(.nohover):not(.disabled), .' + styleID + '.highlighted { background-color: ' + ColorLuminance(mixed, 0.125) +'; cursor:pointer; }';
	
	// PRIOR
	//rule += '.prior-' + color.substr(1) + ' {  }';
	rule += '.prior-' + color.substr(1) + '::before { animation: origin-' + color.substr(1) + ' 0.25s infinite alternate; content:""; display: block; height: 100%; width: 100%; position: absolute; left: 0; top: 0; background-color: '+ hex2rgba(mix(color, '#ffffff', 50), 50) +'; box-shadow: inset 0 0 0 1px '+ ColorLuminance(color,-0.3) +', inset 0 0 0 3px '+ color +'; }';
	priorColorList.push('prior-' + color.substr(1)); // global var holds all prior classes.
	
	// ANIMATION
	rule += '@keyframes origin-' + color.substr(1) +' { 0% { opacity: 0.2; } 40% { opacity: 0.25; } 60% { opacity: 0.95; } 100% { opacity: 1 } }';
	
	$("#" + styleID).append(rule);
}
function hex2rgba(hex,opacity){
 hex = hex.replace('#','');
 var r = parseInt(hex.substring(0,2), 16);
 var g = parseInt(hex.substring(2,4), 16);
 var b = parseInt(hex.substring(4,6), 16);

 var result = 'rgba('+r+','+g+','+b+','+opacity/100+')';
 return result;
}

function renderRoomTitle(title) {
	$("#sidebar").prepend('<div id="roomTitle"><span>' + title + '</span></div>');
	$("body").append('<span id="titleWidth">'+ title +'</span>')
	let width = $("#titleWidth").width();
	$("#titleWidth").remove();
	let maxwidth = 211; // sidebar width minus margin... minus one.
	let ratio = maxwidth / width;
	if (ratio <= 1) {
		$("#roomTitle > span").css('transform', 'scale(' + ratio +',1)');
	}
}

function addHeadingOld (user, name, color, x) {
	var blockWidth = $('.block').width();
	var marginLeft = blockWidth * (x - 1);
	$("#gameHead").append('<div class="heading-'+user+'" style="left: '+ marginLeft +'px; color: ' + color + ';">' + name + '</div>');
	var textWidth = $('.heading-' + user).width() + 40; // 40 for the padding;
	var difference = textWidth - $('.block').width();
	var marginLeft = marginLeft - (difference / 2);
	$('.heading-' + user).css('left', marginLeft);
}

function addHeading (user, name, color, elo) {
	var headingLocation = '#playerRight';
	if ($('#playerLeft').is(':empty')){
		headingLocation = '#playerLeft';
	}
	var appendString = '<div class="heading-'+user+'" style="color: ' + color + ';">' + name + ' <span style="font-weight:normal; color:white;">';
	if (elo > 0) {
		appendString += '(' + elo + ')';
	}
	appendString += '</span></div>';
	$(headingLocation).append(appendString);
}

function menuBlockEnableDisable() {
	$(".menu_block:not(.nohover)").on('click', function() {
		if ($(this).hasClass('disabled')) {
			$(this).removeClass('disabled');
			socket.emit('blocklist update', this.id, true);
		} else {
			$(this).addClass('disabled');
			socket.emit('blocklist update', this.id, false);
		}
	});
}

function renderLeaderboard(leaderData) {
	for (var i = 0; i < leaderData.length; i++) {
		$("#eloRank").append('<tr><td>'+ (i+1) +'</td><td style="color:'+ leaderData[i].color + '">' + leaderData[i].displayName + '</td><td class="alignRight">' + leaderData[i].elo + '</td></tr>');
	}
}

function renderGames(lobbyData) {

	// RENDER GAMES!
	for (var i = 0; i < lobbyData.length; i++) {
		var gameLocation = '#' + lobbyData[i].gameState;
		var appendString = '<div class="lobbyGame" style="border: 2px ' + lobbyData[i].creatorColor + ' solid" data-gameid=' + lobbyData[i].id + '>';
		appendString += '<span class="WhoVsWho"><b>' + lobbyData[i].creator + '</b>';
		if (lobbyData[i].creatorElo > 0) {
			appendString += '&ensp;(' + lobbyData[i].creatorElo + ')';
		}
		
		if (lobbyData[i].gameType === 'practice') {
			appendString += '&emsp;<span class="dimMsg">[practice room]</span>';
		} else if (lobbyData[i].full) {
			appendString += '&emsp;<span class="dimMsg">vs</span>&emsp;<b>' + lobbyData[i].opponent + '</b>';
			if (lobbyData[i].opponentElo > 0) {
				appendString += '&ensp;(' + lobbyData[i].opponentElo + ')';
			}
		}
		appendString += '</span>'

		
		if (lobbyData[i].gameType === 'random') {
			appendString += '<span class="gameSettings">Random</span>';
		}
		
		appendString += '<div class="lobbyButtons"><span class="lobbyButton spectateGameButton">Spectate</span>';
		if (isGhost == false) {
			if ((lobbyData[i].gameState !== 'inprogress') && (lobbyData[i].full == false)) {
				appendString += '<span class="lobbyButton joinGameButton">Play</span>';
			}
		}
		appendString += '</div></div>';
		$(gameLocation).append(appendString);
	}
	
	$("#open").prepend('<div class="lobbyLabel">open games:</div>');
	$("#inprogress").prepend('<div class="lobbyLabel">in progress:</div>');
	
	if (isGhost == false) {
		$(".joinGameButton").on('click', function () {
			var tempID = $(this).parent().parent().data("gameid");
			socket.emit('join game', tempID);
			// should remove click handlers here or somethin.
		});
	}
		
	$(".spectateGameButton").on('click', function() {
		var tempID = $(this).parent().parent().data("gameid");
		socket.emit('join game', tempID, 'spec');
	});
	
	debounce = Math.random();
	var temp = debounce;
	if (ghostFlow) {
		setTimeout(function(){ 
			var enticingGame = 'none';
			var combinedElo = -9999999;
			for (var i = 0; i < lobbyData.length; i++) {
				if ((lobbyData[i].gameState == 'open') || (lobbyData[i].gameState == 'inprogress')) {
					if ((lobbyData[i].full) && (lobbyData[i].creatorElo + lobbyData[i].opponentElo > combinedElo)) {
						if (lobbyData[i].creatorElo + lobbyData[i].opponentElo > combinedElo) {
							if (lobbyData[i].gameType !== 'practice') {
								combinedElo = lobbyData[i].creatorElo + lobbyData[i].opponentElo;
								enticingGame = i;
							}
						}
					}
				}
			}
			if (enticingGame !== 'none') {
				if (debounce = temp) {
					socket.emit('join game', lobbyData[enticingGame].id, 'spec');
				}
			}
		}, 3000);
	}
}

function toggleAudioButton() {
	if (audioEnabled == false) {
		$(".audioOn").hide();
		$(".audioOff").show();
	}
	
	$("#toggleAudio").on("click",function() {
		if (audioEnabled) {
			audioEnabled = false;
			log('<span class="dimMsg">Audio disabled.</span>');
			//$("#toggleAudio > span").html("OFF");
			$(".audioOn").hide();
			$(".audioOff").show();
		} else {
			audioEnabled = true;
			log('<span class="dimMsg">Audio enabled.</span>');
			moveAudio.play();
			//$("#toggleAudio > span").html("ON");
			$(".audioOn").show();
			$(".audioOff").hide();
		}
	});
}

function updateTimer(timerValue, turnCount) {
	$("#container").removeClass("timeWarning");
	if (timerValue == false) {
		$('#timer').html('Turn <b>' + turnCount + '</b>, Time <b>&infin;</b>');
	} else {
		$('#timer').html('Turn <b>' + turnCount + '</b>, Time <b>' + timerValue + '</b>');
		
		clearInterval(gameTimer);
		// set global "gameTimer" to a setInterval.
		gameTimer = setInterval( function () { 
			timerValue--;
			if (timerValue == 0) {
				clearInterval(gameTimer);
			} else if ((timerValue <= 10) && (standby == false)) {
				$('#timer').html('Turn <b>' + turnCount + '</b>, Time <b class="redMsg">' + timerValue + '</b>');
				if (timerValue == 10) {
					 $("#container").addClass("timeWarning");
				}
				if (audioEnabled) {
					var timeRunningOutAudio = new Audio("sfx/beep.ogg");
					timeRunningOutAudio.volume = 1 - (timerValue / 15); // set volume
					timeRunningOutAudio.play(); // play audio
				}
			} else {
				$('#timer').html('Turn <b>' + turnCount + '</b>, Time <b>' + timerValue + '</b>');
			}
		}, 1000);
	}
}

function onlinePlay() {  // hooray! hooray! for online play!
	socket = io();
	socket.on('connect', function() {
		//log('<span class="greenMsg" style="font-weight:bold">Connected</span>');
		//$("#disconnected").remove();
	});
	socket.on('disconnect', function() {
		log('<b class="redMsg">Disconnected</b>');
		$("#username").remove();
		$(".dynamicStyle").remove();
		inGame = false;
		showWinState = false;
		$("#sidebar").empty();
		$("#container").empty();
		if (audioEnabled) {
			disconnectedAudio.play();
		}
		//changeFavIcon('img/favico.png');
		//location.reload();
		socket = false;
	});
	socket.on('update user count', function(totalusers){
		if (totalusers == 1) {
			log('<span class="greenMsg">1 user online.</span>');
		} else {
			log('<span class="greenMsg">' + totalusers + ' users online.</span>');
		}
		
	});
	/* unused
	socket.on('choose name', function(userID) {
		$("#flexcontainer").append('<div style="color:white; margin: auto auto;">What is your name?<div id="nameEntry"><form id="nameform"><input id="ne" type="text" maxlength="16" value="' + userID + '" autocomplete="off" /><button id="sendName">Send</button></form></span></div>');
		$("#ne").mousedown('mousedown', function() {
			$("#ne").off('mousedown').val(''); // first time you click, empty the default name.
		});
		
		let name = $("#ne").val();
		$("#ne").keyup(function() {
			keyPress();
		});
		$("#ne").keypress(function() {
			keyPress();
		});
		function keyPress() {
			if (name != $("#ne").val()) { // if the name has been updated
				name = $("#ne").val(); // set it
				name = name.replace(/\s+/g, ' '); // remove multi spaces
				if (name.charAt(0) == ' ') {
					name = name.substr(1); // remove initial space
				}
				$("#ne").val(name); // update input value
			}
		}
		
		// when the button is clicked, say if it is a valid name or not!
		$("#sendName").on('click', function(e) {
			e.preventDefault();
			name = $("#ne").val();
			name = $.trim(name); // for remove trailing spaces.
			name = name.replace(/\s+/g, ' ');
			$("#ne").val(name);
			
			if (name.search(/^[\w\-\s]+$/) == -1) {
				log('<span class="redMsg">invalid name</span>');
			} else {
				//log('valid name "' + name + '"');
				$("#flexcontainer").empty();
				socket.emit('name chosen', name);
				$("#container").append('<div id="username">' + name + '</div>');
			}
		});
	});
	*/
	socket.on('make chat available', function(username) {
		$("#chat").remove();
		$("#chatPanel").append('<div id="chat"><input id="chatInput" type="text" maxlength="140" value="" autocomplete="off" /></div>');
		$("#chatInput").on('keydown', function (e) {
			if (e.keyCode == 13) {
				let chatMessage = $("#chatInput").val();
				$("#chatInput").val('');
				if (!$.trim(chatMessage)) {
					// no msg
				} else {
					socket.emit('send chat message', chatMessage);
				}
			}
		});
	});
	socket.on('update lobby', function(lobbyData, leaderData) {
		$("#open").empty();
		$("#inprogress").empty();
		
		$("#eloRank").empty();
		
		renderLeaderboard(leaderData);
		renderGames(lobbyData);
	});
	
	socket.on('render lobby', function(lobbyData, leaderData, lobbyUserData) {
		player = false;
		$("#lobby").remove();
		$("#leaderboard").remove();
		$("#headBoardContainer").remove();

		var appendString = '<div id="lobby"><h1><span style="color:' + lobbyUserData.color + '">' + lobbyUserData.username + '</span>, ';
		appendString += "welcome to Cosmic Blocks!";
		appendString += '</h1><div style="padding:20px;"><div id="optionButtons">';
		if (!isGhost) {
			appendString += '<div id="newgame" class="buttonStyle">Create Game</div><div id="randgame" class="buttonStyle">Random Game</div><div id="practice" class="buttonStyle">Practice Mode</div>';
		}
		appendString += '<a id="howToPlay" class="buttonStyle" href="https://docs.google.com/document/d/1c_rIYxdl2udNHXPFnHj5ELoYPjtej4hDjy7nCHnceG0/edit" target="_blank">How to Play</a><a class="buttonStyle" href="https://docs.google.com/document/d/1cIwGEWhQYZUPRn1sBzatFuVSNau3VPHxOu9ffszejU4/edit" target="_blank">Documentation</a><div id="toggleAudio" class="buttonStyle">' + audioButtonSVG() +'</div></div>';
		if (!isGhost) {
			appendString += '<div id="playerStats"></div>';
		}
		appendString += '<div id="gameTypes"><div id="open"></div><div id="inprogress"></div></div></div></div>	<div id="leaderboard"><h1>World Ranking</h1><div id="rankingContainer"><table id="eloRank"></table></div></div>'
		$("#container").append(appendString);
				
		$('#newgame').on("click",function() {
			socket.emit('new game'); // send the server new game command
		});
		$('#randgame').on("click",function() {
			socket.emit('new game', 'random'); // send the server new game [random board] command
		});
		$('#practice').on("click",function() {
			socket.emit('practice mode');
		});	
		
		
		toggleAudioButton();
		
		// RENDER LEADERBOARD!
		renderLeaderboard(leaderData);
		
		// RENDER GAMES!
		renderGames(lobbyData);
		
		// RENDER PLAYER STATS (not a separate function because it is only called within renderLobby();
		if (!isGhost) {
			if (lobbyUserData.gamesPlayed !== 0) {
				var appendString = '<ul id="lobbyUserData">';
				appendString += '<li>Games Played<span class="stat">' + lobbyUserData.gamesPlayed + '</span></li>';
				
				if (lobbyUserData.wins !== 0) {
					appendString += '<li>Games Won<span class="stat">' + lobbyUserData.wins + '</span></li>';
				}
				
				if (lobbyUserData.draws !== 0) {
					appendString += '<li>Games Drawn<span class="stat">' + lobbyUserData.draws + '</span></li>';
				}
				
				if (lobbyUserData.losses !== 0) {
					appendString += '<li>Games Lost<span class="stat">' + lobbyUserData.losses + '</span></li>';
				}
				
				if (lobbyUserData.displayElo > 0) {
					appendString += '<li>Points<span class="stat">' + lobbyUserData.displayElo + '</span></li>';
				}
				appendString += '</ul>';
				$("#playerStats").append(appendString);
			}
			if (lobbyUserData.remainingRerolls !== 0) {
				$("#optionButtons").append('<div class="buttonStyle" id="rerollColor">New Color</div>');
				$("#rerollColor").on('click', function() {
					socket.emit('attempt color reroll');
				});
			}
		}
		resizeFunction(); // visually shows the resize, would be ideal to not have it be visible
	});
/*
	socket.on('render lobby user data', function(lobbyUserData) {
		//$("#container").css('background-color', lobbyUserData.color); //experimental
		var appendString = '<div class="lobbyName" style="color: ' + lobbyUserData.color + '">'+ lobbyUserData.username +'</div>';
		if (lobbyUserData.gamesPlayed !== 0) {
			appendString += '<ul id="lobbyUserData">';
			appendString += '<li>Games Played<span class="stat">' + lobbyUserData.gamesPlayed + '</span></li>';
			
			if (lobbyUserData.wins !== 0) {
				appendString += '<li>Games Won<span class="stat">' + lobbyUserData.wins + '</span></li>';
			}
			
			if (lobbyUserData.draws !== 0) {
				appendString += '<li>Games Drawn<span class="stat">' + lobbyUserData.draws + '</span></li>';
			}
			
			if (lobbyUserData.losses !== 0) {
				appendString += '<li>Games Lost<span class="stat">' + lobbyUserData.losses + '</span></li>';
			}
			
			if (lobbyUserData.elo != -99999) {
				appendString += '<li>Elo<span class="stat">' + Math.round(lobbyUserData.elo) + '</span></li>';
			}
			appendString += '</ul>';
		}
		$("#sidebar").prepend(appendString);
		if (lobbyUserData.remainingRerolls !== 0) {
			$("#sidebar").append('<div class="sideButton" id="rerollColor">New Color</div>');
			$("#rerollColor").on('click', function() {
				socket.emit('attempt color reroll');
			});
		}
	});
	*/
	socket.on('ran out of rerolls', function (color) {
		$("#rerollColor").remove();
	});
	socket.on('update lobby name color', function(color) {
		$(".lobbyName").css('color', color);
	});
	socket.on('remove player heading', function() {
		$("#playerRight").empty();
	});
	socket.on('setup game', function(gameID, joinStatus, title, rows, cols, board, players, gameState, blockList, timeLimit, collisionMode, moveCount, timerValue, gameType) {
		// this runs when:
		// - a game is started
		// - a game is joined in progress.
		
		inGame = true;
		
		setupGame(); // why is this a function? 
		function setupGame() {
			$("#lobby").remove();
			$("#leaderboard").remove();
			$("#container").append(`
				<div id="headBoardContainer">
					<div id="gameHead">
						<div id="playerLeft"></div>
						<div id="timeRemaining"></div>
						<div id="playerRight"></div>
					</div>
					<div id="board"></div>
					<div id="menuContainer">
						<div id="menuRightContainer">
							<div id="gameButtons"></div>
							<div id="bottomInfo"></div>
						</div>
					</div>
				</div>`);
			buildMenu(blockList);
			$(".winState").remove(); // ??
			buildBoard(rows, cols);
			renderBoard(board);
			$(".block").addClass('nohover');
			blockHoverData();
			renderExitButton();
			//renderRoomTitle(title);
			for (var playerID in players) {
				addHeading(playerID, players[playerID].username, players[playerID].color, players[playerID].displayElo);
			}
			
			// IF THE GAME IS OPEN, AND HAS NOT STARTED YET:
			if (gameState == 'open') {
				if (gameType === 'practice') {
					socket.emit('ready');
				} else if (joinStatus !== 'spectator') {
					// you are a player in the game
					$("#gameButtons").append('<div class="buttonStyle notready" id="ready">Ready Up</div>');
					$("#ready").on('click', function() {
						if ($(this).hasClass("unbound")) {
							log('<span class="redMsg">cannot ready as spectator</span>');
						} else {
							if ($(this).hasClass("notready")) {
								socket.emit('ready');
								$(this).html('Unready').removeClass('notready');
							} else {
								socket.emit('not ready');
								$(this).html('Ready Up').addClass('notready');
							}
						}
					});
				}
				
				/*
				// TIME LIMIT
				if (timeLimit == false) { timeLimit = '&infin;'}
				//$("#sidebar").append('<div id="timeLimitContainer">Time Limit: <span id="timeLimit">' + timeLimit + '</span></div>');
				
				// COLLISION MODE
				var collisionString = '<div id="collisionContainer">Collisions: <span id="collisionSetting">';
				if (collisionMode.permanence === true) {
					collisionString += 'Permanent';
				} else {
					collisionString += '<span class="collisionTurnCount">' + collisionMode.permanence.toString() + '</span> Turn';
				}
				collisionString += '</span></div>';
				//$("#gameButtons").append(collisionString);
				*/
				
				
				// CREATOR SETTINGS:
				
				function creatorSettings() {
				
					if (joinStatus == 'creator') {
						
						// TIME LIMIT
						$("#timeLimit").addClass('creatorHighlight');
						$("#timeLimit").on('click', function() {
							socket.emit('time limit setting', 'infin');
						});
						$("#timeLimitContainer").append('<div class="plusMinusButtons"><span id="moreTime" class="greenMsg">[+]</span><span id="lessTime" class="redMsg">[&minus;]</span></div>');
						$('#moreTime').on('click', function() {
							socket.emit('time limit setting', 'more');
						});
						$('#lessTime').on('click', function() {
							socket.emit('time limit setting', 'less');
						});
						
						// COLLISION PERMANENCE
						$("#collisionSetting").addClass('creatorHighlight');
						$("#collisionSetting").on('click', function() {
							if ($(this).html() == 'Permanent') {
								socket.emit('collision setting', 5);
							} else {
								var collisionTurnCount = parseInt($(".collisionTurnCount").html());
								if (collisionTurnCount == 5) {
									socket.emit('collision setting', 'Permanent');
								}
								//else {
								//	socket.emit('collision setting', collisionTurnCount + 1);
								//}
							}
						});
						
						// CLASSIC
						//$("#sidebar").append('<div class="sideButton" id="classic">Classic</div>');
						$("#classic").on('click', function() {
							socket.emit('classic mode');
						});
						
						// ADVANCED
						//$("#sidebar").append('<div class="sideButton" id="circlemode">Advanced</div>');
						$("#circlemode").on('click', function() {
							socket.emit('advanced mode');
						});
						
						// RANDOMIZE
						//$("#sidebar").append('<div class="sideButton" id="randomize">Randomize</div>');
						$("#randomize").on('click', function (){
							socket.emit('randomize');
						});
						
						// BOARD EDITOR
						//$("#sidebar").append('<div class="sideButton" id="boardEditor">Board Editor</div>');
						$("#boardEditor").on('click', function() {
							$("#sidebar > *:not('#roomTitle')").remove();
							//$("#sidebar > *:not('#roomTitle')").css('display','none');
							$("#sidebar").append('<div class="sideButton" id="doneEditingBlockList">Done Editing</div>');
							/*
							$("#sidebar").append('<div>Cols: <span id="numCols">' + cols + '</span><div class="rowcolButtons"><span id="moreCols" class="greenMsg">[+]</span><span id="lessCols" class="redMsg">[&minus;]</span></div>');
							$("#sidebar").append('<div>Rows: <span id="numRows">' + rows + '</span><div class="rowcolButtons"><span id="moreRows" class="greenMsg">[+]</span><span id="lessRows" class="redMsg">[&minus;]</span></div>');
							let minRows = 5;  // I suppose these should have come from the server
							let maxRows = 20; // cause I'll wanna validate their legitness later on server.
							let minCols = 7;
							let maxCols = 30;
							let greyOut = "#888";
							
							$("#lessRows").on("click",function() {
								if (rows > minRows) {
									rows--;
									customUpdate();
									if (rows == minRows) { $("#lessRows").css('color', greyOut); }
									if (rows == maxRows - 1) { $("#moreRows").css('color', ''); }
								}
							});
							
							$("#moreRows").on("click",function() {
								if (rows < maxRows) {
									rows++;
									customUpdate();
									if (rows == minRows + 1) { $("#lessRows").css('color', ''); }
									if (rows == maxRows) { $("#moreRows").css('color', greyOut); }
								}
							});
							
							$("#lessCols").on("click",function() {
								if (cols > minCols) {
									cols--;
									customUpdate();
									if (cols == minCols) { $("#lessCols").css('color', greyOut); }
									if (cols == maxCols - 1) { $("#moreCols").css('color', ''); }
								}
							});
							
							$("#moreCols").on("click",function() {
								if (cols < maxCols) {
									cols++;
									customUpdate();
									if (cols == minCols + 1) { $("#lessCols").css('color', ''); }
									if (cols == maxCols) { $("#moreCols").css('color', greyOut); }
								}
							});
							
							function customUpdate() {
								$("#numRows").html(rows);
								$("#numCols").html(cols);
								rebuildBoard(rows, cols);
								socket.emit('update board size', rows, cols);
							}
							*/
							
							
							$("#doneEditingBlockList").on('click', function() {
								//$("blockListEditor").remove();
								$(".block").off();
								$(".menu_block").off();
								socket.emit('done editing');
							});
							
							let boardEditorBlockList = {
								'blank' : { ammo: false },
								'blockade' : { ammo: false },
								'ice' : { ammo: false }
							};
							
							buildMenu(boardEditorBlockList);
							var currentType = 'blank';
							
							$("#blank").addClass('active');
							$("#blockade").css('background', '#000');
							
							$("#menu").on('click', '.menu_block', function() {
								if (!($(this).hasClass('active'))) {
									$('.active').removeClass('active');
									$(this).addClass('active');
									currentType = $(this).attr('id');
									log ('now painting with ' + currentType);
								}
							});
							$("#board").on('click', '.block', function () {
								let xy = obtainID($(this));
								let x = xy[0];
								let y = xy[1];
								let blockType = $(this).data("blockType");
								if (blockType != currentType && (blockType != 'base')) {
									updateBlock(x,y,currentType);
									socket.emit('board edit', x, y, currentType);
								}
							});
						});
						
						// BLOCKLIST EDITOR
						//$("#sidebar").append('<div class="sideButton" id="blockListEditorBtn">BlockList Editor</div>');
						$("#blockListEditorBtn").on('click', function() {
							$("#sidebar > *:not('#roomTitle')").remove();
							//$("#sidebar > *:not('#roomTitle')").css('display','none');
							$("#sidebar").append('<div class="sideButton" id="doneEditingBlockList">Done Editing</div>');
							$("#doneEditingBlockList").on('click', function() {
								//$("blockListEditor").remove();
								socket.emit('done editing');
							});
							//$("#headBoardContainer").remove();
							$("#headBoardContainer").css('display','none');
							let hWidth = hSpace();
							$("#container").append('<div id="blockListEditor" style="width: '+ hWidth +'px"></div>');
							
							let fullSet = [
								'plus',
								'oplus',
								'cross',
								'ocross',
								'arrow1',
								'arrow2',
								'arrow3',
								'arrow4',
								'arrow6',
								'arrow7',
								'arrow8',
								'arrow9',
								'arrow11',
								'arrow22',
								'arrow33',
								'arrow44',
								'arrow66',
								'arrow77',
								'arrow88',
								'arrow99',
								'hbar',
								'vbar',
								'tlbr',
								'bltr',
								'ohbar',
								'ovbar',
								'otlbr',
								'obltr',
								'star',
								'ostar',
								'ice',
								'knight',
								'circle'
							];
							
							let blockListForEditor = {};
							for (var i = 0; i < fullSet.length; i++) {
								let block = fullSet[i];
								if (typeof blockList[block] === 'undefined') {
									blockListForEditor[block] = false;
								} else {
									if (blockList[block].ammo == false) { // if ammo is unlimited
										blockListForEditor[block] = true; // set true in the list
										// I know this is kinda wonky, w/e.
									} else {
										blockListForEditor[block] = blockList[block].ammo;
									}
								}
							}
							
							/*
							for (block in blockList) {
								if (!(fullSet.indexOf(block) > -1)) {
								// if it doesn't exist
									blockListForEditor[block] = false;
								} else {
									if (blockList[block].ammo == false) { // if ammo is unlimited
										blockListForEditor[block] = true; // set true in the list
										// I know this is kinda wonky, could fix this mess later.
									} else {
										blockListForEditor[block] = blockList[block].ammo;
									}
								}
							}
							*/
							
							/*
							let blockListForEditor = {
								//'blank' : false,
								//'blockade' : false,
								//'base' : false,
								'ice' : false,
								'circle' : false,
								'knight' : false,
								'star' : false,
								'ostar' : false,
								'plus' : true,
								'oplus' : true,
								'cross' : true,
								'ocross' : true,
								'hbar': false,
								'ohbar': false,
								'vbar' : false,
								'ovbar' : false,
								'tlbr' : false,
								'otlbr' : false,
								'bltr' : false,
								'obltr' : false,
								'arrow1' : true,
								'arrow11' : false,
								'arrow2' : true,
								'arrow22' : false,
								'arrow3' : true,
								'arrow33' : false,
								'arrow4' : true,
								'arrow44' : false,
								'arrow6' : true,
								'arrow66' : false,
								'arrow7' : true,
								'arrow77' : false,
								'arrow8' : true,
								'arrow88' : false,
								'arrow9' : true,
								'arrow99' : false
							};
							*/
							
							for (block in blockListForEditor) {
								let blockSVGString = getSVG8by8(block);
								let appendString = '<div class="blockInfoContainer"><div class="blockInList';
								if (blockListForEditor[block] === false) {
									appendString += ' disabled';
								}
								if (block === 'blockade') {
									appendString += '" style="background-color:#000';
								}
								appendString += '" data-blockType="'+ block +'">' + blockSVGString + '</div><br/><span data-blockType="'+ block +'">&minus;</span><span ';
								
								if (blockListForEditor[block] === false) {
									appendString += 'style="color:#777">0';
								} else if (blockListForEditor[block] === true) {
									appendString += '>&infin;';
								} else {
									appendString += '>' + blockListForEditor[block];
								}
								
								appendString += '</span><span data-blockType="'+ block +'">+</span></div>';
								$("#blockListEditor").append(appendString);
							}
							
							$(".blockInList").on('click', function(evt) {
								blockType = ($(this).attr('data-blockType'));
								let blockDisabled = false;
								if ($(this).hasClass('disabled')) {
									blockDisabled = true;
								}
								socket.emit('blocklist update', blockType, blockDisabled);
								blockDisabled = !blockDisabled;
								if (blockDisabled) {
									$(this).addClass('disabled');
									$(this).siblings("span:nth-of-type(2)").html('0').css('color', '#777');
								} else {
									$(this).removeClass('disabled');
									$(this).siblings("span:nth-of-type(2)").html('&infin;').css('color', '');
								}
							});
							
							var maxAmmo = 20;
							$(".blockInfoContainer > span:nth-of-type(1)").on('click', function(evt) {
								// subtracting
								let value = $(this).siblings("span:nth-of-type(2)").html();
								if (parseInt(value) !== 0) {
									let blockType = $(this).attr("data-blockType");
									if (value == '\u221E') { // if &infin;
										value = maxAmmo;
									} else {
										if (parseInt(value) === 1) {
											value = '&infin;';
										} else {
											value = (parseInt(value) - 1);
										}
									}
									$(this).siblings("span:nth-of-type(2)").html(value);
									socket.emit('ammo update', blockType, value);
								}
							});
							$(".blockInfoContainer > span:nth-of-type(3)").on('click', function(evt) {
								// adding
								let value = $(this).siblings("span:nth-of-type(2)").html();
								if (parseInt(value) !== 0) {
									let blockType = $(this).attr("data-blockType");
									if (value == '\u221E') { //if &infin;
										value = 1;
									} else {
										if (parseInt(value) === maxAmmo) {
											value = '&infin;';
										} else {
											value = (parseInt(value) + 1);
										}
									}
									$(this).siblings("span:nth-of-type(2)").html(value);
									socket.emit('ammo update', blockType, value);
								}
							});
							
							/*
							$("#blockListEditor").on('click', function(evt) {
								if (evt.target === document.getElementById("blockListEditor")) {
									// didn't click relevant area
								} else {
									let parentElement = evt.target.parentNode;
									while (!$(parentElement).hasClass("blockInList")) {
										parentElement = parentElement.parentNode;
									}
									let blockType = ($(parentElement).attr('data-blockType'));
									let blockDisabled = false;
									if ($(parentElement).hasClass('disabled')) {
										blockDisabled = true;
									}
									socket.emit('blocklist update', blockType, blockDisabled);
									blockDisabled = !blockDisabled;
									if (blockDisabled) {
										$(parentElement).addClass('disabled');
										$(parentElement).siblings("span:nth-of-type(2)").html('0').css('color', '#777');
									} else {
										$(parentElement).removeClass('disabled');
										$(parentElement).siblings("span:nth-of-type(2)").html('&infin;').css('color', '');
									}
								}
							});
							*/
						});
						
						/*
						//$("#sidebar").append('<div class="sideButton" id="customize">Customize</div>');
						$("#customize").on('click', function (){
							$("#customize").off();
							
							// change board size (rows/cols)
							$("#sidebar").append('<div>Cols: <span id="numCols">' + cols + '</span><div class="rowcolButtons"><span id="moreCols" class="greenMsg">[+]</span><span id="lessCols" class="redMsg">[&minus;]</span></div>');
							$("#sidebar").append('<div>Rows: <span id="numRows">' + rows + '</span><div class="rowcolButtons"><span id="moreRows" class="greenMsg">[+]</span><span id="lessRows" class="redMsg">[&minus;]</span></div>');
							let minRows = 5;  // I suppose these should have come from the server
							let maxRows = 20; // cause I'll wanna validate their legitness later on server.
							let minCols = 7;
							let maxCols = 30;
							let greyOut = "#888";
							
							$("#lessRows").on("click",function() {
								if (rows > minRows) {
									rows--;
									customUpdate();
									if (rows == minRows) { $("#lessRows").css('color', greyOut); }
									if (rows == maxRows - 1) { $("#moreRows").css('color', ''); }
								}
							});
							
							$("#moreRows").on("click",function() {
								if (rows < maxRows) {
									rows++;
									customUpdate();
									if (rows == minRows + 1) { $("#lessRows").css('color', ''); }
									if (rows == maxRows) { $("#moreRows").css('color', greyOut); }
								}
							});
							
							$("#lessCols").on("click",function() {
								if (cols > minCols) {
									cols--;
									customUpdate();
									if (cols == minCols) { $("#lessCols").css('color', greyOut); }
									if (cols == maxCols - 1) { $("#moreCols").css('color', ''); }
								}
							});
							
							$("#moreCols").on("click",function() {
								if (cols < maxCols) {
									cols++;
									customUpdate();
									if (cols == minCols + 1) { $("#lessCols").css('color', ''); }
									if (cols == maxCols) { $("#moreCols").css('color', greyOut); }
								}
							});
							
							function customUpdate() {
								$("#numRows").html(rows);
								$("#numCols").html(cols);
								rebuildBoard(rows, cols);
								socket.emit('update board size', rows, cols);
							}
						
						});
						 */
						 
						//$(".menu_block").removeClass('disabled');
						
						// UPDATE BLOCKLIST:
						//menuBlockEnableDisable();
						
						// change blocklist, and ammo
						// change start position
						// change time limit (inc. infinite)
						// change start positions and terrain
						// choose to spectate or play
						// choose color
						// ready up
						
						// when you edit anything
						// it sends the change to the server
						// and updates it on everyone else in the room
						// and maybe unreadies them, like worms
					}
				
				}
			} else if (gameState == 'inprogress') {
				global_moveCount = moveCount;
				$("#timeRemaining").append('<div id="timer">Turn <b>' + moveCount + '</b>, Time <b>' + timerValue + '</b></div>');
				updateTimer(timerValue, moveCount);
			}
			$("#gameButtons").append('<div id="toggleAudio" class="buttonStyle">' + audioButtonSVG() + '</div>');
			toggleAudioButton();
			$(".menu_block").addClass('nohover disabled');
			//menuHideBlocksAndResize();
		}
	});
	socket.on('detonate', function() {
		if (audioEnabled) {
			detonateAudio.play(); // play the audio for placing a block onto the board.
		}
	});
	socket.on('time limit update', function(timeLimit) {
		timeLimitUpdate(timeLimit);
	});
	socket.on('collision update', function(collisionMode) {
		collisionUpdate(collisionMode);
	});
	socket.on('game preset', function(board, timeLimit, rows, cols, blockList, creator, collisionMode) {
		timeLimitUpdate(timeLimit);
		collisionUpdate(collisionMode);
		buildBoard(rows, cols);
		renderBoard(board);
		buildMenu(blockList);
		$(".block").addClass('nohover');
		if (you == creator) {
			menuBlockEnableDisable();
		} else {
			$("#menu").css('opacity', '0.5'); // dim the menu
		}
	});
	socket.on('blocklist updated', function(blockType, active, ammo) {
		if (active) {
			$("#" + blockType).removeClass('disabled');
		} else {
			$("#" + blockType).addClass('disabled');
		}
	});
	socket.on('rebuild board', function(rows, cols) {
		rebuildBoard(rows, cols);
	});
	function rebuildBoard(rows, cols) {
		buildBoard(rows, cols);
		log('<span class="dimMsg">New dimensions: ' + cols + ' x ' + rows + '</span>');
		$(".block").addClass('nohover');
	}
	socket.on('kill game', function() {
		exitGame();
	});

	socket.on('build menu', function(blockList) {
		buildMenu(blockList);
	});
	
	/*	function baseChosen(gameID, pnum) {
		// this is a waiting function
		$(".p1base").off();
		$(".p2base").off();
		$("#chooseBase").remove();
		console.log ("player chose base " + pnum);
		socket.emit('base chosen', gameID, pnum);
	}
	*/
	socket.on('add to heading', function(id, username, color, elo) {
		addHeading(id, username, color, elo);
	});
	socket.on('remove from heading', function(user) {
		$(".heading-" + user).remove();
		$("#ready").html('[ ] Ready').addClass('notready');
	});
	socket.on('update lobby welcome name color', function(color) {
		$("#lobby > h1 > span").css('color', color);
	});
	socket.on('all players ready', function(gameID, timeLimit, players, rows, cols, board, gameType) {
		$(".block", "#board").off(); // for joinGame();
		$("#menuContainer").off(); // for joinGame() && blockHoverData();
		$("#board").off(); // for blockHoverData(); I could combine (".block, #board") and ("#board") together.
		blockHoverData();
		if (gameType !== 'practice') {
			$("#gameButtons > *:not('#toggleAudio')").remove();
		} else {
			// practice mode reset cleanup:
			for (var i = 0; i < priorColorList.length; i++) {
				$(".block").removeClass(priorColorList[i]); // this is longer than it needs to be for each game, oh well maybe fix later.
			}
			$(".highlighted").removeClass('highlighted');
			//$("#menu").css('opacity', '0.5'); // dim the menu
			$(".menu_block").addClass('disabled');
		}
		if (timeLimit == false) {
			timeLimit = '&infin;';
		}
		if ($("#timer").length === 0) {
			$("#timeRemaining").append('<div id="timer">Turn <b>1</b>, Time <b>' + timeLimit + '</b></div>');
		}
		global_moveCount = 1;
		$("#menu").css('opacity', '1'); // dim the menu
		if (audioEnabled) {
			newgameAudio.play();
		}
		joinGame(gameID, global_moveCount, timeLimit, players, rows, cols, board, gameType);
	});
	socket.on('new move', function(board, noMove, blockList) {
		global_moveCount++;
		$(".waitMsg").parent().remove();
		$(".block").removeClass("nohover").removeClass('disabled');
		if (typeof blockList !== 'undefined') {
			buildMenu(blockList);
		}
		$(".menu_block").addClass('disabled');
		menuState = false; // disable the menu, because a move was made.
		/*
		//$(".block").removeClass(function (index, css) {
		//	return (css.match (/\bprior-\S+/g) || []).join(' ');
		//
		*/
		$(".highlighted").removeClass("highlighted"); // remove the highlighted moves
		if (noMove == false) {
			if (audioEnabled) {
				moveAudio.play(); // play the audio for placing a block onto the board.
			}
		}
		renderBoard(board);
		standby = false;
		//checkForVictory(players);
	});
	socket.on('victory', function(winners, winPaths, color, gameType) {
		if (showWinState == false) {
			cleanup(winners, gameType);
			showWinState = true;
			for (var i = 0; i < winners.length; i++) {
				showPath(winPaths[i], color);
			}
		}
	});
	socket.on('log', function(msg, special) {
		log(msg, special); // special messages don't have padding built in so I can alter BGcolor without it looking bad lol
	});
	socket.on('store id', function(id, displayName, ghost) {
		you = id;
		yourName = displayName;
		isGhost = ghost;
		ghostFlow = isGhost;
	});
	socket.on('connect audio', function() {
		if (audioEnabled) {
			connectAudio.play();
		}
	});
/*	socket.on('opponent disconnected', function() {
		log('<span style="color:red">opponent disconnected</span>');
		opponentdisconnectedAudio.play();
	});
	*/
	socket.on('remove rematch button', function(){
		//log('<span class="dimMsg">remove rematch button</span>');
		$("#rematch").remove();
		if (ghostFlow) {
			setTimeout(function(){ 
				exitGame();
			}, 3000);
		}
	});
	socket.on('render board', function(data) {
		renderBoard(data);
	});
	socket.on('collision', function() {
		//log('<span style="dimMsg">collision</span>');
		if (audioEnabled) {
			collisionAudio.play();
		}
	});
	socket.on('update timer', function(timerValue, turnCount) {
		updateTimer(timerValue, turnCount);
	});
	socket.on('time out', function(playerWhoMoved) {
		log('<span class="dimMsg">time out</span>');
		// we're passing in the player who moved
		// ideally this would only send to the player who disconnected but this was an easy hacky way
		// of getting it to work quickly. by sending to all players. and checking ID.
		//log (playerWhoMoved);
		if (you != playerWhoMoved) {
			// opponent function gets opposite player.
			if (audioEnabled) {
				timeoutAudio.play(); // play audio
			}
		}
	});
	/*
	socket.on('game over', function(winner, reason) {
		log(winner + ' wins because of ' + reason + '.');
		cleanup(winner, reason);
	});
	*/
	socket.on('rematch offered', function() {
		$("#rematch > span").text("Accept Rematch").addClass("blinkText");
	});
	socket.on('setup rematch', function(blockList, creatorElo, playerElo) {
		debounce = Math.random();
		$(".block").removeClass('nohover disabled ice');
		buildMenu(blockList);
		showWinState = false;
		if ((typeof creatorElo !== 'undefined') && (creatorElo > 0)) {
			$("#playerLeft > div > span").html('(' + creatorElo + ')');
		}
		if ((typeof playerElo !== 'undefined') && (playerElo > 0)) {
			$("#playerRight > div > span").html('(' + playerElo + ')');
		}
	});
	socket.on('draw offered', function(gameID) {
		log('Draw Offered');
		drawOffered(gameID);
	});
	socket.on('console log', function(data) {
		console.log(data);
	});
}
$( document ).ready(function() {
	// any preloading I want to do, I should do here.
});
$( window ).on("load", function() {
	$("#container").append(`
		<h1 id="chatToggle">&laquo;</h1>
		<div id="chatPanel">
			<h1>Chat</h1>
			<div id="logContainer">
				<div id="log"></div>
			</div>
		</div> `);
	sidebarsResize();
	addNewStyle(collisionColor); // for collisions
	$( window ).resize(function() {
		resizeFunction();
	});
	$("#chatToggle").on('click', function() {
		if ($("#chatPanel").is(":visible")) {
			$("#chatPanel").hide();
			$("#chatToggle").html('&raquo;');
			resizeFunction();
		} else {
			$("#chatPanel").show();
			$("#chatToggle").html('&laquo;');
			resizeFunction();
		}
	});
	onlinePlay();
	console.log("hello world");
});
function log(str, special) {
	if ($(".logLine").length >= 500) {
		// don't let the DOM get out of control.
		$(".logLine").first().remove();
	}
	if (special) {
		$("#log").append('<div class="logLine special">' + str + '</div>');
	} else {
		$("#log").append('<div class="logLine">' + str + '</div>');
	}
	$("#logContainer").scrollTop($('#log')[0].scrollHeight);
}
function audioButtonSVG() {
	var SVGString = '<svg version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 400 400" overflow="scroll" xml:space="preserve">';
	
	SVGString += '<path d="M159,226.5c0,11-9,20-20,20H71c-11,0-20-9-20-20V174c0-11,9-20,20-20h68c11,0,20,9,20,20V226.5z"/><path d="M75.3,189.3c-9.3,5.9-9.3,15.7,0,21.6l126.8,81.5c9.3,5.9,16.8,1.8,16.8-9.2V117c0-11-7.6-15.1-16.8-9.2L75.3,189.3z"/>'; // speaker icon
	
	SVGString += '<path class="audioOn" fill="none" stroke="#2652AA" stroke-width="20" stroke-linecap="round" stroke-miterlimit="10" d="M314,126c0,0,90,74,0,148" /><circle class="audioOn" fill="#061059" cx="254" cy="200" r="21"/><path class="audioOn" fill="none" stroke="#123A89" stroke-width="20" stroke-linecap="round" stroke-miterlimit="10" d="M279,153c0,0,70,47,0,94"/>'; // audio ON
	
	SVGString += '<line class="audioOff" fill="none" stroke="#890303" stroke-width="20" stroke-linecap="round" stroke-miterlimit="10" x1="249" y1="166" x2="318" y2="235"/><line class="audioOff" fill="none" stroke="#890303" stroke-width="20" stroke-linecap="round" stroke-miterlimit="10" x1="318" y1="166" x2="249" y2="235"/>'; // audio OFF

    SVGString += '</svg>';
	
	return SVGString;
}

// eof