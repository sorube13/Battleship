var BATTLESHIP = {
    SUBMARINE : 1,
    DESTROYER : 2,
    CRUISER : 3,
    BATTLESHIP : 4,
    CARRIER : 5
};

BATTLESHIP.Game = function(options){
    'use strict';

    function randomId() {
      return Math.floor((1 + Math.random()) * 0x100000000)
        .toString(16)
        .substring(1);
    }

    var id =  randomId();//Math.floor(Math.random() * 1000000000 );
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

    var myShipsHit = {
        carrier: 0,
        battleship: 0,
        cruiser: 0,
        destroyer1: 0,
        destroyer2: 0,
        submarine1: 0,
        submarine2: 0
    };


    var oppShipsHit = {
        carrier: 0,
        battleship: 0,
        cruiser: 0,
        destroyer1: 0,
        destroyer2: 0,
        submarine1: 0,
        submarine2: 0
    };

    var numShips = 7;

    var numMyShipsHit = 0;
    var numOppShipsHit = 0;

    var targetPos;


    ///////////////////////////////////////////////////////////////////////

    /**
     * Initialize boardController object
     */
    function init(){
        boardController = new BATTLESHIP.BoardController({
            containerEl: options.containerEl,
            assetsUrl: options.assetsUrl,
            callbacks: {
                pieceDropped : pieceMoved,
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


    this.sendTarget = function(pos){
        targetPos = pos;
        sendData(pos);
    }

    function sendId(){
        var data = id;
        sendData(data);
    }

    this.startCommunication = function(){
        boardController.startCommunication();
    }

    this.receiveFromOpponent = function(data){
        if(!oppId){
            oppId = data;
            if(id > oppId){
                myTurn = true;
            } else{
                myTurn = false;
            }
            boardController.setTurn(myTurn);
        } else{
            if(myTurn){
                data = data.split(" ");
                if(data[0] == 'true'){
                    addHit(data[1], oppShipsHit);
                    boardController.oppBoardHit(targetPos);
                }else{
                    boardController.oppBoardMiss(targetPos);
                }
                myTurn = false;
            } else{
                data = data.split(",");
                var target = [Number(data[0]), Number(data[1])];
                checkTarget(target);

            }
        }
    }

    function checkTarget(target){
        if((myBoard[target[0]][target[1]] !== 1) && (myBoard[target[0]][target[1]] !== 'x')){
            if(myBoard[target[0]][target[1]] !== 0){
                sendData(true + " " +myBoard[target[0]][target[1]].id);
                var totalSink = addHit(myBoard[target[0]][target[1]].id, myShipsHit);
                myBoard[target[0]][target[1]] = 1;
                boardController.myBoardHit(target, totalSink);
            } else{
                sendData(false);
                myBoard[target[0]][target[1]] = "x";
                boardController.myBoardMiss(target);
            }
            myTurn = true;
        }
    }

    function addHit(type, myList){
        type = Number(type);
        switch(type){
            case 1:
                myList.carrier++;
                if(myList.carrier === BATTLESHIP.CARRIER){
                    console.log("carrier sunk");
                    addNumHits(myList);
                    return true;
                }
                break;
            case 2:
                myList.battleship++;
                if(myList.battleship === BATTLESHIP.BATTLESHIP){
                    console.log("battleship sunk");
                    addNumHits(myList);
                    return true;
                }
                break;
            case 3:
                myList.cruiser++;
                if(myList.cruiser === BATTLESHIP.CRUISER){
                    console.log("cruiser sunk");
                    addNumHits(myList);
                    return true;
                }
                break;
            case 4:
                myList.destroyer1++;
                if(myList.destroyer1 === BATTLESHIP.DESTROYER){
                    console.log("destroyer 1 sunk");
                    addNumHits(myList);
                    return true;
                }
                break;
            case 5:
                myList.destroyer2++;
                if(myList.destroyer2 === BATTLESHIP.DESTROYER){
                    console.log("destroyer 2 sunk");
                    addNumHits(myList);
                    return true;
                }
                break;
            case 6:
                myList.submarine1++;
                if(myList.submarine1 === BATTLESHIP.SUBMARINE){
                    console.log("submarine 1 sunk");
                    addNumHits(myList);
                    return true;
                }
                break;
            case 7:
                myList.submarine2++;
                if(myList.submarine2 === BATTLESHIP.SUBMARINE){
                    console.log("submarine 2 sunk");
                    addNumHits(myList);
                    return true;
                }
                break;
            default:
                break;
        }
        return false;

    }

    function addNumHits(myList){
        if(myList === myShipsHit){
            numMyShipsHit++;
            if(numMyShipsHit === numShips){
                boardController.endGame(false);
            }
        } else{
            numOppShipsHit++;
            console.log("numOppShipsHit:", numOppShipsHit);
            if(numOppShipsHit === numShips){
                boardController.endGame(true);
            }
        }
    }

    this.updateBoard = function(board){
        boardController.updateBoard(board);
        console.log('reached game');
    }
    
    this.getTurn = function(){
        return myTurn;
    }

    init();

}


