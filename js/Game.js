var BATTLESHIP = {
    SUBMARINE : 1,
    DESTROYER : 2,
    CRUISER : 3,
    BATTLESHIP : 4,
    CARRIER : 5
};

BATTLESHIP.Game = function(options){
    'use strict';

    options = options || {};

    var boardController = null;

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

    function init(){
        boardController = new BATTLESHIP.BoardController({
            containerEl: options.containerEl,
            assetsUrl: options.assetsUrl
        });

        boardController.drawBoard(onBoardReady);
    }

    function onBoardReady(){
        var piece;

        piece = {
            type: BATTLESHIP.CARRIER,
            orientation: 1, // 1: horizontal 0: vertical
        };
        piece.pos = setRandomPos(piece);
        placePiece(piece);
       
        piece = {
            type: BATTLESHIP.BATTLESHIP,
            orientation: 0, // 1: horizontal 0: vertical
        };
        piece.pos = setRandomPos(piece);
        placePiece(piece);

        piece = {
            type: BATTLESHIP.CRUISER,
            orientation: 1, // 1: horizontal 0: vertical
        };
        piece.pos = setRandomPos(piece);
        placePiece(piece);

        piece = {
            type: BATTLESHIP.DESTROYER,
            orientation: 1, // 1: horizontal 0: vertical
        };
        piece.pos = setRandomPos(piece);
        placePiece(piece);

        piece = {
            type: BATTLESHIP.DESTROYER,
            orientation: 0, // 1: horizontal 0: vertical
        };
        piece.pos = setRandomPos(piece);
        placePiece(piece);

        piece = {
            type: BATTLESHIP.SUBMARINE,
            orientation: 1, // 1: horizontal 0: vertical
        };
        piece.pos = setRandomPos(piece);
        placePiece(piece);

        piece = {
            type: BATTLESHIP.SUBMARINE,
            orientation: 1, // 1: horizontal 0: vertical
        };
        piece.pos = setRandomPos(piece);
        placePiece(piece);
    }

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
        boardController.addPiece(piece);
    }

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
                    break;
                } else if(piece.orientation === 0 && myBoard[x][y + i] !== 0){
                    break;
                } else{
                    done = true;
                }
            }
            tries++;
        } while(tries < 10 && !done);
        return [x,y];
    }

    init();
}