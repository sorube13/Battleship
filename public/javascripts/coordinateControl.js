var squareSize = 10;
/**
 * Converts the piece board position to 3D world position.
 * @param {piece} piece objects.
 * @returns {THREE.Vector3}
 */
function boardPieceToWorld (piece) {
    var x, z;
    var y = squareSize / 2 + 2.48;
    
    if(piece.orientation === 1){
        x = (piece.type / 2 + piece.pos[0]) * squareSize;
        z = piece.pos[1] * squareSize + squareSize / 2;

    } else{
        x = piece.pos[0] * squareSize + squareSize / 2;
        z = (piece.type  / 2 + piece.pos[1]) * squareSize;
    }     
    return new THREE.Vector3(x, y, z);
}

/**
 * Converts the init piece board position to 3D world position.
 * @param {piece} piece objects.
 * @returns {THREE.Vector3}
 */
function initBoardPieceToWorld (piece) {
    var x, z;
    var y = squareSize / 2 + 2.48;

    x = (piece.pos[0] + piece.type / 2) * squareSize - 70;
    z = (piece.pos[1] + 1 / 2 ) * squareSize;
     
    return new THREE.Vector3(x, y, z);
}

function oppBoardToWorld(pos){
    var x, y;
    var z = 0;

    x = pos[0] * squareSize + squareSize / 2;
    y = pos[1] * squareSize + 3 * squareSize / 2;
    y = (squareSize - pos[1]) * squareSize + squareSize / 2
     
    return new THREE.Vector3(x, y, z);
}

/**
 * Converts the board position to 3D world position.
 * @param {Array} pos The board position.
 * @returns {THREE.Vector3}
 */
function boardToWorld(pos){
    var x, y, z;
    y = squareSize / 2 + 2.48;

    x = pos[0] * squareSize + squareSize / 2;
    z = pos[1] * squareSize + squareSize / 2;

    return new THREE.Vector3(x, y, z);
}

/**
 * Converts the 3D world position to the board position.
 * @param {Object} pos The world position.
 * @returns [x, y]
 */
function worldToBoard(pos){
    var i = Math.ceil(pos.x / squareSize) -1;
    var j = 10 - Math.ceil((squareSize * 10 - pos.z) / squareSize);
    
    if (i > 9 || i < 0 || j > 9 || j < 0 || isNaN(i) || isNaN(j)) {
        return false;
    }
 
    return [i, j];
}

/**
 * Converts the 3D world position to the init board position.
 * @param {Object} pos The world position.
 * @returns [x, y]
 */
function worldToInitBoard(pos){
    var i = Math.floor((70 + pos.x) / squareSize);
    var j = 10 - Math.ceil((squareSize * 10 - pos.z) / squareSize);
    
    if (i > 4 || i < 0 || j > 8 || j < 0 || isNaN(i) || isNaN(j)) {
        return false;
    }
 
    return [i, j];
}

/**
 * Finds the coordinates of the mouse in the scene 
 * return position Position of the mouse in perspective with the bottom board (user board)
 */
function getMouse3D(mouseEvent, renderer, camera){
    var x, y;

    if(mouseEvent.offsetX !== undefined){
        x = mouseEvent.offsetX;
        y = mouseEvent.offsetY;
    } else{
        x = mouseEvent.layerX;
        y = mouseEvent.layerY;
    }

    var pos = new THREE.Vector3(0, 0, 1);
    var pMouse = new THREE.Vector3(
        (x / renderer.domElement.clientWidth) * 2 - 1,
        -(y / renderer.domElement.clientHeight) * 2 + 1,
        1
    );
    //projector.unprojectVector(pMouse, camera);
    pMouse.unproject(camera);

    var cam = camera.position;
    var m = pMouse.y / (pMouse.y - cam.y);

    pos.x = pMouse.x + (cam.x - pMouse.x) * m;
    //pos.y = pMouse.y + (cam.y - pMouse.y) * m;
    pos.z = pMouse.z + (cam.z - pMouse.z) * m;

    return pos;
}

/**
 * Finds the coordinates of the mouse in the scene 
 * return position Position of the mouse in perspective with the bottom board (user board)
 */
function getYMouse3D(mouseEvent, renderer, camera){
    var x,y;
    if(mouseEvent.offsetX !== undefined){
        x = mouseEvent.offsetX;
        y = mouseEvent.offsetY;
    } else{
        x = mouseEvent.layerX;
        y = mouseEvent.layerY;
    }

    var vector = new THREE.Vector3();

    vector.set(
        ( x / renderer.domElement.clientWidth ) * 2 - 1,
        - ( y / renderer.domElement.clientHeight ) * 2 + 1,
        0.5 );

    vector.unproject(camera);

    var dir = vector.sub( camera.position ).normalize();

    var distance = - camera.position.z / dir.z;

    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) )
    return pos;
}

function getTouch3D(event, renderer, camera){
    var x, y;

    event.preventDefault();
    x = event.targetTouches[0].pageX - offsets.left;
    y = event.targetTouches[0].pageY - offsets.top;

    var pos = new THREE.Vector3(0, 0, 1);
    var pMouse = new THREE.Vector3(
        (x / renderer.domElement.clientWidth) * 2 - 1,
        -(y / renderer.domElement.clientHeight) * 2 + 1,
        1
    );
    //projector.unprojectVector(pMouse, camera);
    pMouse.unproject(camera);
    var cam = camera.position;
    var m = pMouse.y / (pMouse.y - cam.y);

    pos.x = pMouse.x + (cam.x - pMouse.x) * m;
    pos.z = pMouse.z + (cam.z - pMouse.z) * m;

    return pos;
}

function isStartOnMousePosition(pos){
    if((pos.x >= -75 && pos.x<=-25) && (pos.y >= 40 && pos.y <= 60)){
        return true;
    }
    return false;
}

/**
 * Given a piece and coordinates of the center of the piece(to),
   returns the left hand coordinate of the piece, corresponding to the pos attribute.
 * @param {Object} piece Piece whose left hand coordinates it is going to return 
 * @param {Array} to The center coordinates of the piece chosen.
 * return {Array} [x, y] piece pos.
 */
function centerToPos(piece, to){
    var x, y;
    if(piece.type % 2){ // if odd
       if(piece.orientation === 1){
            x = to[0] - Math.floor(piece.type / 2);
            y = to[1];
        } else{
            x = to[0];
            y = to[1] - Math.floor(piece.type / 2);
        }
        
    } else{
        if(piece.orientation === 1){
            x = to[0] - piece.type / 2 + 1;
            y = to[1];
        } else{
            x = to[0];
            y = to[1] - piece.type / 2 + 1;
        }
    }
    return [x, y];
}

/**
 * Checks whether the mouse is on the opponent's board.
 * @param {Array} pos The coordinates of the mouse position in the scene.
 * return {boolean}.
 */
function isMouseOnOppBoard(pos) {
    if (pos.x >= 0 && pos.x <= squareSize * 10 &&
        ((pos.y >= squareSize && pos.y <= (squareSize + 1) * 10))){ 
        return true;
    } else {
        return false;
    }
}

/**
 * Checks whether the mouse is on the initial board.
 * @param {Array} pos The coordinates of the mouse position in the scene.
 * return {boolean}.
 */
function isMouseOnInitBoard(pos){
    if(pos.x >= -70 && pos.x <= -20 &&
        ((pos.z >= 0 && pos.z <= 90))){
        return true;
    } else{
        return false;
    }
}

/**
 * Checks whether the mouse is on the user's board.
 * @param {Array} pos The coordinates of the mouse position in the scene.
 * return {boolean}.
 */
function isMouseOnBoard(pos) {
    if (pos.x >= 0 && pos.x <= squareSize * 10 &&
        ((pos.z >= 0 && pos.z <= squareSize * 10))){ 
        return true;
    } else {
        return false;
    }
}