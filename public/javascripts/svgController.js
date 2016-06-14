'use strict'

var selectedPiece = null;
var bMouseDragging = true;
var nMouseOffsetX = 0;
var nMouseOffsetY = 0;
var tapped = false;
var numShips = 0;

var target = null;
var myTurn = false;

var myBoard = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

var oppBoard = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

var pieces={};

function onMouseDown(event){
	selectedPiece = {};
    selectedPiece.obj = event.target;
    selectedPiece.posX = parseFloat(selectedPiece.obj.getAttribute("x"));
    selectedPiece.posY = parseFloat(selectedPiece.obj.getAttribute("y"));
	if(!tapped){
		tapped=setTimeout(function(){
			single_tap(event);
			tapped=null;
		},200); //wait 200ms
    } else {
    	clearTimeout(tapped);
    	tapped=null;
    	doubletap();
  	}
}

function single_tap(event){
	bMouseDragging = true;

	if(selectedPiece){
		var p = document.getElementById('svg').createSVGPoint();
	    p.x = event.targetTouches[0].pageX;
		p.y = event.targetTouches[0].pageY;

	    var m = selectedPiece.obj.getScreenCTM();
	    p = p.matrixTransform(m.inverse());
	    nMouseOffsetX = p.x - parseFloat(selectedPiece.obj.getAttribute("x"));
	    nMouseOffsetY = p.y - parseFloat(selectedPiece.obj.getAttribute("y"));
	    selectedPiece.obj.addEventListener('touchmove', mouseMove, false);
	    selectedPiece.obj.addEventListener('touchend', mouseUp, false);
	}
}

function doubletap(){
	if(selectedPiece){
		var x = selectedPiece.obj.getAttribute('x');
		var y = selectedPiece.obj.getAttribute('y')
		var w = selectedPiece.obj.getAttribute('width');
		var h = selectedPiece.obj.getAttribute('height')
		var orient = selectedPiece.obj.getAttribute('orientation');
		var prevPos = svgToBoard(selectedPiece.posX, selectedPiece.posY);
		var pos = svgToBoard(x, y);
		if(checkRotation(pos, 1 - orient)){
		// if(otherPiece(pos, h, w)){
			selectedPiece.obj.setAttribute("width", h);
			selectedPiece.obj.setAttribute("height", w);
			selectedPiece.obj.setAttribute("orientation", 1 - orient);
			removePiece(prevPos, selectedPiece.obj, orient);
			placePiece(pos, selectedPiece.obj);
		}

		nMouseOffsetX = nMouseOffsetY = 0;
		selectedPiece = null;

	}
	
}

function mouseUp(evt) { 
	if(selectedPiece && !tapped){
		bMouseDragging = false;
		checkPosition();
	    nMouseOffsetX = nMouseOffsetY = 0;
	    selectedPiece = null;	
	}
    
}
function mouseMove(evt) { 
    var p = document.getElementById('svg').createSVGPoint();
    p.x = event.targetTouches[0].pageX;
    p.y = event.targetTouches[0].pageY;
    
    if(bMouseDragging) {
        if(selectedPiece) {
    
            var m = selectedPiece.obj.getScreenCTM();
            p = p.matrixTransform(m.inverse());

            selectedPiece.obj.setAttribute("x", p.x - nMouseOffsetX);
            selectedPiece.obj.setAttribute("y", p.y - nMouseOffsetY);
        }
    }
}    

function coordinates(event){
	var p = document.getElementById('svg').createSVGPoint();
    // p.x = event.targetTouches[0].pageX;
    // p.y = event.targetTouches[0].pageY;
    p.x = event.offsetX;
    p.y = event.offsetY;
    var x = Math.floor(10*(p.x -240)/345);
    var y = Math.floor(10*(p.y -10)/345);
    console.log('x:', x, 'y:', y);
    // console.log('X:', x, 'Y:', y, " = ", myBoard[x][y]);
    target = [x,y];
    if(myTurn){
    	if(oppBoard[target[0]][target[1]] === 0){
	    	socket.emit('hitTarget', target);
	    	myTurn = false;
	    }
	}

}

function svgToBoard(sX, sY){
	var x = Math.floor(10 * (sX - 11) / 17);
	var y = Math.floor(10 * (sY - 0.5) / 17);
	return [x, y];
}

function boardToSVG(bX, bY){
	var x = 11 + 17 * bX / 10;
	var y = 0.5 + 17 * bY / 10;
	return [x, y];
}

function checkPosition(){
	if(selectedPiece){
		var x = selectedPiece.obj.getAttribute('x');
		var y = selectedPiece.obj.getAttribute('y');
		var width = getLength(parseFloat(selectedPiece.obj.getAttribute('width')));
		var height = getLength(parseFloat(selectedPiece.obj.getAttribute('height')));
		var orient = parseInt(selectedPiece.obj.getAttribute('orientation'));
		var pos = svgToBoard(x, y);
		if(pos[0] < 0 || pos[0] + width > 10 || pos[1] < 0 || pos[1] + height > 10){
			selectedPiece.obj.setAttribute('x', selectedPiece.posX);
			selectedPiece.obj.setAttribute('y', selectedPiece.posY);	
		} else{
			if(!otherPiece(pos, width, height, orient)){
				selectedPiece.obj.setAttribute('x', selectedPiece.posX);
				selectedPiece.obj.setAttribute('y', selectedPiece.posY);
			}else{
				var posSVG = boardToSVG(pos[0], pos[1]);
				selectedPiece.obj.setAttribute('x', posSVG[0] + 0.2);
				selectedPiece.obj.setAttribute('y', posSVG[1] + 0.2);
				var prevPos = svgToBoard(selectedPiece.posX, selectedPiece.posY);
				if(!(prevPos[0] < 0)){
					removePiece(prevPos, selectedPiece.obj, selectedPiece.obj.getAttribute('orientation'));
				}else{
					numShips++;
					checkShips();
				}
				placePiece(pos, selectedPiece.obj);
			}
		}
	}
}

function getLength(length){
	switch(length){
		case 8:
			return 5;
			break;
		case 6.5:
			return 4;
			break;
		case 4.75:
			return 3;
			break;
		case 3:
			return 2;
			break;
		case 1.25:
			return 1;
			break;
		default:
			return;
	}
}

function placePiece(pos, piece){
    var x = pos[0];
    var y = pos[1];
    var w = getLength(parseFloat(piece.getAttribute('width')));
    var h = getLength(parseFloat(piece.getAttribute('height')));
    if(w > h){
	    for(var i = 0; i < w; i++ ){
	        myBoard[x+i][y] = piece;     
	    }
	}else{
		for(var i = 0; i < h; i++ ){
	        myBoard[x][y+i] = piece;   
	    }
	}
	updatePieces(piece, pos);
}

function removePiece(pos, piece, orient){
	var x = pos[0];
    var y = pos[1];
    var w = getLength(parseFloat(piece.getAttribute('width')));
    var h = getLength(parseFloat(piece.getAttribute('height')));
    if(w>h) {var l=w;}
    else{var l = h;}

   	if(parseInt(orient) === 1){
	    for(var i = 0; i < l; i++ ){
	        myBoard[x+i][y] = 0;   
	    }
    }else{
    	for(var i = 0; i < l; i++ ){
	        myBoard[x][y+i] = 0;  
	    }
    }
}

function otherPiece(pos, width, height, orientation){
	if(selectedPiece){
		if(orientation === 1){
			for(var i = 0; i < width; i++){
				if(myBoard[pos[0]+i][pos[1]] && myBoard[pos[0]+i][pos[1]]!== 0 &&
					myBoard[pos[0]+i][pos[1]].getAttribute('id') !== selectedPiece.obj.getAttribute('id')){
					selectedPiece.obj.setAttribute('x', selectedPiece.posX);
					selectedPiece.obj.setAttribute('y', selectedPiece.posY);
					return false;
				}
			}
		}else{
			for(var i = 0; i < width; i++){
				if(myBoard[pos[0]][pos[1]+i] && myBoard[pos[0]][pos[1]+i] !== 0 &&
					myBoard[pos[0]][pos[1]+i].getAttribute('id') !== selectedPiece.obj.getAttribute('id')){
					selectedPiece.obj.setAttribute('x', selectedPiece.posX);
					selectedPiece.obj.setAttribute('y', selectedPiece.posY);
					return false;
				}
			}
		}
		return true;
	}
}

function checkShips(){
	if(numShips === 7){
		document.getElementById('start').style = "display:true";
	}
}

function checkRotation(pos, orient){
	if(selectedPiece){
		var x = pos[0];
		var y = pos[1];
		var w = getLength(parseFloat(selectedPiece.obj.getAttribute('width')));
		var h = getLength(parseFloat(selectedPiece.obj.getAttribute('height')));
		
		if(orient === 1){
			if(x + h > myBoard.length - 1){
				x = myBoard.length - h;
				selectedPiece.obj.setAttribute('x', boardToSVG(x, y)[0] + 0.2);
			}
		}else{
			if(y + w > myBoard.length){
				y = myBoard.length - w;
				selectedPiece.obj.setAttribute('y', boardToSVG(x, y)[1] + 0.2);
			}
		}
		if(!(otherPiece(pos, w, h, orient))){
			selectedPiece.obj.setAttribute('x', selectedPiece.posX);
			selectedPiece.obj.setAttribute('y', selectedPiece.posY);
			return false;
		}
		
		return true;	
	}else{
		return false;
	}
}

function updatePieces(piece, pos){
	var id = piece.getAttribute('id');
	var orientation = parseInt(piece.getAttribute('orientation'));
	var length;
	if(orientation === 1){
		length = getLength(parseFloat(piece.getAttribute('width'))); 
	} else{
		length = getLength(parseFloat(piece.getAttribute('height')));
	}
	pieces[id] = {
		'id': id,
		'type': length,
		'orientation': orientation,
		'pos': pos
	}
}

function startGame(){
	socket.emit('startGame', pieces);
	console.log('Game Started', pieces);
	document.getElementById('p1').style = "display:none"
    document.getElementById('p2').style = "display:true"

}

socket.on('checkRes', function(res){
	if(target){
		var svg = document.getElementById('svg2');
		var pathSVG = boardToSVG(target[0], target[1]);
		var pathSVGend = [];
		pathSVGend[0] = pathSVG[0] + 1.7;
		pathSVGend[1] = pathSVG[1] + 1.7;
		var pathSVG = "M " + pathSVG[0] + " " + pathSVG[1] + " L " + pathSVGend[0] + " " + pathSVGend[1];
		var hit = document.createElementNS("http://www.w3.org/2000/svg", 'path'); //Create a path in SVG's namespace
		hit.setAttribute("d", pathSVG); //Set path's data
		hit.style.strokeWidth = "0.1"; //Set stroke width
		if(res === "true"){
			// add hit
			oppBoard[target[0]][target[1]] = 1;
			hit.style.stroke = "#F00"; //Set stroke colour
		} else{
			// add miss 
			oppBoard[target[0]][target[1]] = 'x';
			hit.style.stroke = "#00F"; //Set stroke colour
		}
		svg.appendChild(hit);
		target = null;
		myTurn = false;
	}
});

socket.on('setTurn',function(turn){
	myTurn = turn;
});

socket.on('checkWin', function(win){
	document.getElementById('p2').style = "display:none"
	if(win){
    	document.getElementById('pwin').style = "display:true"
	} else{
    	document.getElementById('ploose').style = "display:true"
	}
})
