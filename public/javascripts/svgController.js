'use strict'

var selectedPiece = null;
var bMouseDragging = true;
var nMouseOffsetX = 0;
var nMouseOffsetY = 0;
var tapped = false;
var numShips = 0;

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
    // console.log('posX:',selectedPiece.posX, 'posY:',selectedPiece.posY);

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
		selectedPiece.obj.setAttribute("transform", "translate(" + selectedPiece.obj.getAttribute('width') + ") rotate(90)");
		console.log('double tap', selectedPiece.obj);
		nMouseOffsetX = nMouseOffsetY = 0;
		selectedPiece = null;	
	}
	
}

function mouseUp(evt) { 
	if(selectedPiece){
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
    p.x = event.targetTouches[0].pageX;
    p.y = event.targetTouches[0].pageY;
    console.log('X:', Math.floor(10*(p.x -240)/345), 'Y:', Math.floor(10*(p.y -10)/345));

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
		var pos = svgToBoard(x, y);
		if(pos[0] < 0 || pos[0] + width > 10 || pos[1] < 0 || pos[1] > 9){
			selectedPiece.obj.setAttribute('x', selectedPiece.posX);
			selectedPiece.obj.setAttribute('y', selectedPiece.posY);	
		} else{
			if(!otherPiece(pos, width)){
				selectedPiece.obj.setAttribute('x', selectedPiece.posX);
				selectedPiece.obj.setAttribute('y', selectedPiece.posY);
			}else{
				var posSVG = boardToSVG(pos[0], pos[1]);
				selectedPiece.obj.setAttribute('x', posSVG[0] + 0.2);
				selectedPiece.obj.setAttribute('y', posSVG[1] + 0.2);
				var prevPos = svgToBoard(selectedPiece.posX, selectedPiece.posY);
				if(!(prevPos[0] < 0)){
					removePiece(prevPos, selectedPiece.obj);
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
   
    for(var i = 0; i < w; i++ ){
        myBoard[x+i][y] = piece;     
    }
}

function removePiece(pos, piece){
	var x = pos[0];
    var y = pos[1];
    var w = getLength(parseFloat(piece.getAttribute('width')));
   
    for(var i = 0; i < w; i++ ){
        myBoard[x+i][y] = 0;     
    }
}

function otherPiece(pos, width){
	if(selectedPiece){
		for(var i = 0; i < width; i++){
			if(myBoard[pos[0]+i][pos[1]] !== 0 &&
				myBoard[pos[0]+i][pos[1]].getAttribute('id') !== selectedPiece.obj.getAttribute('id')){
				selectedPiece.obj.setAttribute('x', selectedPiece.posX);
				selectedPiece.obj.setAttribute('y', selectedPiece.posY);
				return false;
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

function startGame(){
	console.log('Game Started');
}