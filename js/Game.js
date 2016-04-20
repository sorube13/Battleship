var BATTLESHIP = {
    SUBMARINE : 1,
    DESTROYER : 2,
    CRUISER : 3,
    BATTLESHIP : 4,
    CARRIER : 5
};

BATTLESHIP.Game = function(options){
    'use strict';

    var id =  Math.floor(Math.random() * 1000000000 );
    var oppId;
    var myTurn = false;

    options = options || {};

    /** @type BATTLESHIP.BoardController */
    var boardController = null;

    /** @type BATTLESHIP.CommunicationsController */
    var communicationsController = null;

    /**
     * The user board representation.
     * @type Array
     */
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

    /**
     * The opponent board representation.
     * @type Array
     */
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

    /**
     * Initialize boardController object
     */
    function init(){
        boardController = new BATTLESHIP.BoardController({
            containerEl: options.containerEl,
            assetsUrl: options.assetsUrl,
            callbacks: {
                pieceCanDrop : isMoveLegal,
                pieceCanRotate: isRotationLegal,
                pieceDropped : pieceMoved,
                selectTarget: sendTarget,
                sendId: sendId 
            }
        });

        boardController.drawBoard(onBoardReady);
    }

    /**
     * Create objects for the board.
     */
    function onBoardReady(){
        var piece;

        piece = {
            id: 1,
            type: BATTLESHIP.CARRIER,
            orientation: 1, // 1: horizontal 0: vertical
            pos: [0, 0]
        };
        boardController.addPiece(piece);
       
        piece = {
            id : 2,
            type: BATTLESHIP.BATTLESHIP,
            orientation: 1,  // 1: horizontal 0: vertical
            pos: [0, 2]
        };
        boardController.addPiece(piece);

        piece = {
            id: 3,
            type: BATTLESHIP.CRUISER,
            orientation: 1, // 1: horizontal 0: vertical
            pos: [0, 4]
        };
        boardController.addPiece(piece);

        piece = {
            id : 4,
            type: BATTLESHIP.DESTROYER,
            orientation: 1, // 1: horizontal 0: vertical
            pos: [0, 6]
        };
        boardController.addPiece(piece);

        piece = {
            id : 5,
            type: BATTLESHIP.DESTROYER,
            orientation: 1, // 1: horizontal 0: vertical
            pos: [3, 6]
        };
        boardController.addPiece(piece);

        piece = {
            id : 6,
            type: BATTLESHIP.SUBMARINE,
            orientation: 1, // 1: horizontal 0: vertical
            pos: [0, 8]
        };
        boardController.addPiece(piece);

        piece = {
            id : 7,
            type: BATTLESHIP.SUBMARINE,
            orientation: 1, // 1: horizontal 0: vertical
            pos: [2, 8]
        };
        boardController.addPiece(piece);
    }

    /**
     * Saves piece in the board according to the piece's position.
     * @param {Object} piece The piece object.
     */
    function placePiece(piece){
        var x = piece.pos[0];
        var y = piece.pos[1];
        for(var i = 0; i < piece.type; i++ ){
            if (piece.orientation === 1){
                myBoard[x + i][y] = piece;
            } else{
                myBoard[x][y + i] = piece;
            }       
        }
    }

    /**
     * Removes piece and mesh from the board according to the piece's previous position.
     * @param {Object} piece The piece object.
     * @param {boolean} orientation The original orientation of the piece object.
     * @param {Array} from The original position of the piece object [x,y]
     */
    function removePiece(piece, orientation, from){
        var x = from[0];
        var y = from[1];
        for(var i = 0; i < piece.type; i++ ){
            if (orientation === 1){
                myBoard[x + i][y] = 0;
            }else{
                myBoard[x][y + i] = 0;
            }       
        }
    }

    /**
     * Creates a random set of coordinates inside the board where there are no other 
     * pieces. 
     * Checks whethere there are other pieces in the length of the piece given.
     * @param {Object} piece The piece object.
     * @return {Array} [x,y] Random coordiantes inside board
     */
    function setRandomPos(piece){
        var length = piece.type;
        var tries = 0;
        var done = false;
        do{
            if(piece.orientation === 1){
                var x = Math.max(Math.floor((Math.random() * 10 - length)), 0);
                var y = Math.floor((Math.random() * 10));
            } else {
                var x = Math.floor((Math.random() * 10));
                var y = Math.max(Math.floor((Math.random() * 10 - length)), 0);
            }
            for(var i=0; i<length; i++) {
                if(piece.orientation === 1 && myBoard[x+i][y] !== 0){
                    done = false;
                    break;
                } else if(piece.orientation === 0 && myBoard[x][y + i] !== 0){
                    done = false;
                    break;
                } else{
                    done = true;
                }
            }
            tries++;
        } while(tries < 10 && !done);
        return [x,y];
    }

     /**
     * Checks whether the piece can be moved to the to position.
     * @param {Array} to Target position fot he piece object.
     * @param {Object} piece The piece object.
     * @return {boolean} 
     */
    function isMoveLegal(to, piece){
        var length = piece.type;
        var orientation = piece.orientation;
        var toRow = to[1];
        var toCol = to[0];
        var l2 = Math.floor(length/2);
        if(toRow < 0 || toRow >= myBoard.length || toCol < 0 || toCol >= myBoard.length){
            console.log("legalNo1", piece);
            return false
        }else if(length%2){ // odd
            if(orientation === 1){
                if(toCol < l2 || toCol >= myBoard.length - l2){
                    console.log("legalNo2", piece);
                    return false;
                } 
                for(var i = toCol - l2; i < toCol + l2 + 1; i++){
                    if((myBoard[i][toRow]) && (myBoard[i][toRow].id != piece.id)){
                        console.log("legalNo3", i, toRow, myBoard[i][toRow]);
                        return false;
                    }
                }
            } else if(orientation === 0){
                if (toRow < l2 || toRow >= myBoard.length - l2){
                    console.log("legalNo4", piece);
                    return false;
                } 
                for(var i = toRow - l2; i < toRow + l2 + 1; i++){
                    if((myBoard[toCol][i])&& (myBoard[toCol][i].id != piece.id)){
                        console.log("legalNo5", toCol, i, myBoard[toCol][i]);
                        return false;
                    }
                }
            }
        }else{ // even
            if(orientation === 1){
                if(toCol < l2 - 1 || toCol >= myBoard.length - l2){
                    console.log("legalNo6", piece);
                    return false;
                }
                for(var i = toCol - l2 + 1; i < toCol + l2 + 1; i++){
                    if((myBoard[i][toRow])&& (myBoard[i][toRow].id != piece.id)){
                        console.log("legalNo7", i, toRow, myBoard[i][toRow]);
                        return false;
                    }
                }
            } else if(orientation === 0){
                if(toRow < l2 - 1 || toRow >= myBoard.length - l2){
                    console.log("legalNo8", piece);
                    return false;
                } 
                for(var i = toRow - l2 + 1; i < toRow + l2 + 1; i++){
                    if((myBoard[toCol][i]) && (myBoard[toCol][i].id != piece.id)){
                        console.log("legalNo9", toCol, i, myBoard[toCol][i]);
                        return false;
                    }
                }
            }
        }
        return true;
    }

     /**
     * Removes piece and mesh from the board according to the piece's previous position.
     * @param {Array} from The original position of the piece.
     * @param {boolean} orientation The orientation of the piece object.
     * @param {Array} to The target position of the piece object [x,y]
     * Removes the piece from it's original position and places it in it's new position.
     */
    function pieceMoved(piece, orientation, from, to, initSet){
        var toCol = to[0]
        var toRow = to[1];

        if(!initSet){
            removePiece(piece, orientation, from);
        }

        placePiece(piece);
    }

    /**
     * Checks whether the piece can be rotated.
     * @param {Object} piece The piece object.
     * @param {Array} center Center coordinates of the piece.
     * @return {boolean} 
     */
    function isRotationLegal(piece, center){
        var length = piece.type;
        var l2 = Math.floor(length / 2);
        var orientation = piece.orientation;
        var pos = JSON.parse(JSON.stringify(center));

        if(length%2){
            if(orientation === 0){
                if(center[0] < l2){
                    pos[0] = l2;
                } else if(center[0] >= myBoard.length - l2){
                    pos[0] = myBoard.length - l2 -1;
                }
            }else{
                if(center[1] < l2){
                    pos[1] = l2; 
                } else if(center[1] >= myBoard.length - l2){
                    pos[1] = myBoard.length - l2 - 1;
                }
            }
        } else{
            if(orientation === 0){
                if(center[0] < l2 - 1){
                    pos[0] = l2 - 1;
                    pos[1] = center[1] + 1;
                } else if(center[0] >= myBoard.length - l2){
                    pos[0] = myBoard.length - l2 -1;
                    pos[1] = center[1] + 1;
                }
            }else{
                if(center[1] < l2 - 1){
                    pos[1] = l2 - 1; 
                } else if(center[1] >= myBoard.length - l2){
                    pos[1] = myBoard.length - l2 - 1;
                }
            }
        }

        if(length % 2){ // odd       
            if(orientation === 1){ // piece is going to rotate and we have to check the positions on top and bottom of center
                for(var i = pos[1] - l2; i <= pos[1] + l2; i++){
                    if((myBoard[pos[0]][i]) && (myBoard[pos[0]][i].id !== piece.id)){
                        console.log("ilegalRotation1");
                        return false;
                    }
                }

            }else{
                for(var i = pos[0] - l2; i <= pos[0] + l2; i++){
                    if((myBoard[i][pos[1]]) && (myBoard[i][pos[1]].id !== piece.id)){
                        console.log("ilegalRotation2");
                        return false;
                    }
                }
            }
        } else{ // even
            if(orientation === 1){ // piece is going to rotate and we have to check the positions on top and bottom of pos
                for(var i = pos[1] - l2 + 1; i <= pos[1] + l2; i++){
                    if((myBoard[pos[0]][i]) && (myBoard[pos[0]][i].id !== piece.id)){
                        console.log("ilegalRotation3");
                        return false;
                    }
                }

            }else{
                for(var i = pos[0] - l2 + 1; i <= pos[0] + l2; i++){
                    if((myBoard[i][pos[1]]) && (myBoard[i][pos[1]].id !== piece.id)){
                        console.log("ilegalRotation4");
                        return false;
                    }
                }
            }
        }

        return true;

    }

    function sendTarget(pos){
        console.log('target:', pos);
        sendData(pos);
    }

    function sendId(){
        console.log('Sending data: ', data);
        var data = id;
        sendData(data);
    }

    this.startCommunication = function(){
        boardController.startCommunication();
    }

    this.receiveFromOpponent = function(data){
        console.log('data', data);
        if(!oppId){
            oppId = Number(data);
            if(id > oppId){
                myTurn = true;
            } else{
                myTurn = false;
            }
            boardController.setTurn(myTurn);
        } else{
            if(myTurn){
                console.log("hit : true or false?")
            } else{
                console.log('check hit')
            }
        }
    }


    

    init();

}

// Game.prototype.receiveTarget = function(pos){
//     console.log('target from other person is:' , pos)
// } 
