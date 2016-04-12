BATTLESHIP.BoardController = function (options) {
    'use strict';
    
    options = options || {};

    /**********************************************************************************************/
    /* Private properties *************************************************************************/

    /**
     * Store the instance of 'this' object.
     * @type BATTLESHIP.BoardController
     */
    var instance = this;

    /**
     * The DOM Element in which the drawing will happen.
     * @type HTMLDivElement
     */
    var containerEl = options.containerEl || null;
    
    /** @type String */
    var assetsUrl = options.assetsUrl || '';
    
    /** @type THREE.WebGLRenderer */
    var renderer;

    /** @type THREE.Projector */
    var projector;

    /** @type THREE.Scene */
    var scene;
    
    /** @type THREE.PerspectiveCamera */
    var camera;
    
    /** @type THREE.OrbitControls */
    var cameraController;
    
    /** @type Object */
    var lights = {};
        
    /** @type Object */
    var materials = {};
    
    /** @type THREE.Geometry */
    var carrierGeom = null;
    /** @type THREE.Geometry */
    var battleshipGeom = null;
    /** @type THREE.Geometry */
    var cruiserGeom = null;
    /** @type THREE.Geometry */
    var destroyerGeom = null;
    /** @type THREE.Geometry */
    var submarineGeom = null;
    
    /** @type THREE.Mesh */
    var boardModel;
    
    /** @type THREE.Mesh */
    var groundModel;
    
    /**
     * The board square size.
     * @type Number
     * @constant
     */
    var squareSize = 10;
    
    /**
     * The board representation.
     * @type Array
     */
    var board = [
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

    /** @type Object */
    var selectedPiece = null;

    /** @type Object */
    var callbacks = options.callbacks || {};
    
    
    /**********************************************************************************************/
    /* Public methods *****************************************************************************/
    
    /**
     * Draws the board.
     */
    this.drawBoard = function (callback) {
        initEngine();
        initLights();
        initMaterials();
        
        initObjects(function () {
            onAnimationFrame();
            
            callback();
        });

        initListeners();
    };

    this.addPiece = function (piece){
        var pieceMesh;
        switch(piece.type){
            case 1:
                pieceMesh = new THREE.Mesh(submarineGeom, materials.blackPieceMaterial);
                break;
            case 2:
                pieceMesh = new THREE.Mesh(destroyerGeom, materials.blackPieceMaterial);
                break;
            case 3:
                pieceMesh = new THREE.Mesh(cruiserGeom, materials.blackPieceMaterial);
                break;
            case 4:
                pieceMesh = new THREE.Mesh(battleshipGeom, materials.blackPieceMaterial);
                break;
            case 5:
                pieceMesh = new THREE.Mesh(carrierGeom, materials.blackPieceMaterial);
                break;
            default:
                break;
        }
        pieceMesh.position = boardPieceToWorld(piece);
        if(piece.orientation === 0){
            pieceMesh.rotation.y = 90 * Math.PI / 180; 
        }

        placePiece(piece, pieceMesh);

        scene.add(pieceMesh);

    }

    this.movePiece = function(from, to){
        var pieceMesh = board[from[0]][from[1]].pieceMesh;
        var piece = board[from[0]][from[1]].piece;
        var toWorldPos = boardToWorld(to);

        // // Delete piece from previous position + add piece to new position
        removePiece(piece);
        
        if(piece.type % 2){ // if odd
            pieceMesh.position.x = toWorldPos.x;
            pieceMesh.position.z = toWorldPos.z; 
        } else{
            if(piece.orientation === 1){
                pieceMesh.position.x = toWorldPos.x + squareSize / 2;
                pieceMesh.position.z = toWorldPos.z; 
            } else{
                pieceMesh.position.x = toWorldPos.x ;
                pieceMesh.position.z = toWorldPos.z + squareSize / 2; 
            }
        }
        
        if(piece.orientation === 1){
            piece.pos[0] = Math.ceil(to[0] - piece.type / 2);
            piece.pos[1] = to[1];

        } else{
            piece.pos[0] = to[0];
            piece.pos[1] = Math.ceil(to[1] - piece.type / 2);
        }
        placePiece(piece, pieceMesh);

        //pieceMesh.children[0].position.y = 0;
    }
    
    
    
    /**********************************************************************************************/
    /* Private methods ****************************************************************************/

    /**
     * Initialize some basic 3D engine elements. 
     */
    function initEngine() {
        var viewWidth = containerEl.offsetWidth;
        var viewHeight = containerEl.offsetHeight;
        
        // instantiate the WebGL Renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        renderer.setSize(viewWidth, viewHeight);

        projector = new THREE.Projector();
        
        // create the scene
        scene = new THREE.Scene();
        
        // create camera
        camera = new THREE.PerspectiveCamera(35, viewWidth / viewHeight, 1, 1000);
        camera.position.set(squareSize * 5, 200, 300);
        cameraController = new THREE.OrbitControls(camera, containerEl);
        cameraController.center = new THREE.Vector3(squareSize * 5, squareSize * 2, 0);
        //
        scene.add(camera);
        
        containerEl.appendChild(renderer.domElement);
    }
    
    /**
     * Initialize the lights.
     */
    function initLights() {
        // top light
        lights.topLight = new THREE.PointLight();
        lights.topLight.position.set(squareSize * 5, 150, squareSize * 5);
        lights.topLight.intensity = 0.4;
        
        // white's side light
        lights.whiteSideLight = new THREE.SpotLight();
        lights.whiteSideLight.position.set( squareSize * 5, 100, squareSize * 5 + 200);
        lights.whiteSideLight.intensity = 0.8;
        lights.whiteSideLight.shadowCameraFov = 55;

        // black's side light
        lights.blackSideLight = new THREE.SpotLight();
        lights.blackSideLight.position.set( squareSize * 5, 100, squareSize * 5 - 200);
        lights.blackSideLight.intensity = 0.8;
        lights.blackSideLight.shadowCameraFov = 55;
        
        // light that will follow the camera position
        lights.movingLight = new THREE.PointLight(0xf9edc9);
        lights.movingLight.position.set(0, 10, 0);
        lights.movingLight.intensity = 0.5;
        lights.movingLight.distance = 500;
        
        // add the lights in the scene
        scene.add(lights.topLight);
        scene.add(lights.whiteSideLight);
        scene.add(lights.blackSideLight);
        scene.add(lights.movingLight);
    }
    
    /**
     * Initialize the materials.
     */
    function initMaterials() {
        // board material
        materials.boardMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080
        });
     
        // ground material
        materials.groundMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map: THREE.ImageUtils.loadTexture(assetsUrl + 'ground.png')
        });
        // grid
        materials.squareMaterial = new THREE.MeshPhongMaterial({
            color: 0xd3d3d3,
            wireframe   : true,
            side: THREE.DoubleSide
        });
        
     
        // white piece material
        materials.whitePieceMaterial = new THREE.MeshPhongMaterial({
            color: 0xe9e4bd,
            shininess: 20
        });
     
        // black piece material
        materials.blackPieceMaterial = new THREE.MeshPhongMaterial({
            color: 0x9f2200,
            shininess: 20
        });
     
        // pieces shadow plane material
        materials.pieceShadowPlane = new THREE.MeshBasicMaterial({
            transparent: true,
            map: THREE.ImageUtils.loadTexture(assetsUrl + 'piece_shadow.png')
        });
    }
    
    /**
     * Initialize the objects.
     * @param {Object} callback Function to call when the objects have been loaded.
     */
    function initObjects(callback) {

        var boardModel = new THREE.Mesh(new THREE.CubeGeometry(squareSize * 10 + 20, 5, squareSize * 10 + 20), materials.boardMaterial);
        boardModel.position.set(squareSize * 5, -0.02, squareSize * 5);
        scene.add(boardModel);
      

        // add ground
        groundModel = new THREE.Mesh(new THREE.PlaneGeometry(squareSize * 10, squareSize * 10, 1, 1), materials.groundMaterial);
        groundModel.position.set(squareSize * 5, -0.02, squareSize * 5);
        groundModel.rotation.x = -90 * Math.PI / 180;
        //        
        scene.add(groundModel);

        // create the board squares
        var squareMaterial = materials.squareMaterial;

        for (var row = 0; row < 10; row++) {
            for (var col = 0; col < 10; col++) {
               // squareMaterial = materials.squareMaterial;
         
                var square = new THREE.Mesh(new THREE.PlaneGeometry(squareSize, squareSize, 1, 1), squareMaterial);
         
                square.position.x = col * squareSize + squareSize / 2;
                square.position.z = row * squareSize + squareSize / 2;

                square.position.y = 2.5;
         
                square.rotation.x = -90 * Math.PI / 180;
         
                scene.add(square);
            }
        }

        var oppBoardModel = new THREE.Mesh(new THREE.CubeGeometry(squareSize * 10 + 20, squareSize * 10 + 20, 5), materials.boardMaterial);
        // oppBoardModel.position.set(squareSize * 5 , (squareSize * 5 + 10) * Math.cos(-30 * Math.PI / 180), -(0.02  + 10) * Math.sin(-30 * Math.PI / 180));

        oppBoardModel.position.set(squareSize * 5 , (squareSize * 5 + 10), -(0.02 + 10));
        //oppBoardModel.rotation.x = -30 * Math.PI / 180; 
        scene.add(oppBoardModel);
        

        var oppSquareMaterial = materials.squareMaterial;


        for (var row = 0; row < 10; row++) {
            for (var col = 0; col < 10; col++) {
               // squareMaterial = materials.squareMaterial;
         
                var square = new THREE.Mesh(new THREE.PlaneGeometry(squareSize, squareSize, 1, 1), oppSquareMaterial);
         
                square.position.x = col * squareSize + squareSize / 2;
                square.position.y = row * squareSize + squareSize / 2 + 10;

                square.position.z = 2.5 - 10;
        
                scene.add(square);
            }
        }

        carrierGeom = new THREE.CubeGeometry(squareSize * 5, squareSize - 1, squareSize - 1 );
        // aircraftCarrier.position.set(squareSize * 5 / 2, squareSize / 2 + 2.48, squareSize / 2);

        battleshipGeom = new THREE.CubeGeometry(squareSize * 4, squareSize - 1, squareSize - 1);
        // battleship.position.set(13 * squareSize / 2, squareSize / 2 + 2.48, squareSize * 5);

        cruiserGeom = new THREE.CubeGeometry(squareSize * 3, squareSize - 1, squareSize - 1 );
        // cruiser.position.set(squareSize * 5 / 2, squareSize / 2 + 2.48, squareSize * 17 / 2);

        destroyerGeom = new THREE.CubeGeometry(squareSize * 2, squareSize - 1, squareSize - 1 );
        // destroyer1.position.set(squareSize * 2 , squareSize / 2 + 2.48, squareSize * 7 / 2);

        submarineGeom = new THREE.CubeGeometry(squareSize, squareSize - 1, squareSize - 1 );
        // submarine2.position.set(squareSize * 7 / 2, squareSize / 2 + 2.48, squareSize * 11 / 2);

        callback();
    }

    function initListeners(){
        var domElement = renderer.domElement;

        domElement.addEventListener('mousedown', onMouseDown, false);
        domElement.addEventListener('mouseup', onMouseUp, false);
    }

  
    /**
     * The render loop.
     */
    function onAnimationFrame() {
        requestAnimationFrame(onAnimationFrame);
        
        cameraController.update();
        
        // update moving light position
        lights.movingLight.position.x = camera.position.x;
        lights.movingLight.position.z = camera.position.z;
        
        renderer.render(scene, camera);
    }

    function onMouseDown(event){

        var mouse3D = getMouse3D(event);

        if(isMouseOnBoard(mouse3D)){
            if(isPieceOnMousePosition(mouse3D)){
                selectPiece(mouse3D);
                renderer.domElement.addEventListener("mousemove", onMouseMove, false);
            }
            cameraController.userRotate = false;
        }
    }

    function onMouseUp(event){
        renderer.domElement.removeEventListener('mousemove', onMouseMove, false);

        var mouse3D = getMouse3D(event);

        if(isMouseOnBoard(mouse3D) && selectedPiece){
            var toBoardPos = worldToBoard(mouse3D);

            if(toBoardPos[0] === selectedPiece.boardPos[0] && toBoardPos[1] === selectedPiece.boardPos[1]){
                deselectPiece();
            } else{
                instance.movePiece(selectedPiece.boardPos, toBoardPos);
                selectedPiece = null;
            }
        } else{
            deselectPiece();
        }

        cameraController.userRotate = true;
    }

    function onMouseMove(event){
        var mouse3D = getMouse3D(event);

        if(selectedPiece){
            selectedPiece.obj.position.x= mouse3D.x;
            selectedPiece.obj.position.z = mouse3D.z;
            
            //selectedPiece.obj.children[0].position.y = 0.75;
        }
    }

    /**
     * Converts the board position to 3D world position.
     * @param {Array} pos The board position.
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

    function boardToWorld(pos){
        var x, y, z;
        y = squareSize / 2 + 2.48;

        x = pos[0] * squareSize + squareSize / 2;
        z = pos[1] * squareSize + squareSize / 2;

        return new THREE.Vector3(x, y, z);
    }

    function worldToBoard(pos){
        var i = Math.ceil(pos.x / squareSize) - 1;
        var j = 10 - Math.ceil((squareSize * 10 - pos.z) / squareSize);
        
        if (i > 9 || i < 0 || j > 9 || j < 0 || isNaN(i) || isNaN(j)) {
            return false;
        }
     
        return [i, j];

    }

    function placePiece(piece, mesh){
        var x = piece.pos[0];
        var y = piece.pos[1];
        var obj = {
            piece: piece,
            pieceMesh: mesh
        }
        for(var i = 0; i < piece.type; i++ ){
            if (piece.orientation === 1){
                board[x + i][y] = obj;
            } else{
                board[x][y + i] = obj;
            }       
        }
    }

    function removePiece(piece){
        var x = piece.pos[0];
        var y = piece.pos[1];

        for(var i = 0; i < piece.type; i++ ){
            if (piece.orientation === 1){
                board[x + i][y] = 0;
            } else{
                board[x][y + i] = 0;
            }       
        }
    }

    function getMouse3D(mouseEvent){
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
            (x / renderer.domElement.width) * 2 - 1,
            -(y / renderer.domElement.height) * 2 + 1,
            1
        );


        projector.unprojectVector(pMouse, camera);

        var cam = camera.position;
        var m = pMouse.y / (pMouse.y - cam.y);

        pos.x = pMouse.x + (cam.x - pMouse.x) * m;
        //pos.y = pMouse.y + (cam.y - pMouse.y) * m;
        pos.z = pMouse.z + (cam.z - pMouse.z) * m;

        return pos;
    }

    function isMouseOnBoard(pos) {
        // if(pos.x >= 0 && pos.x <= squareSize * 10 && pos.y >= 0 && pos.y <= squareSize*10){
        //     console.log("x: " + pos.x + " y: " + pos.y + " z: " + pos.z);
        // }
        if (pos.x >= 0 && pos.x <= squareSize * 10 &&
            ((pos.z >= 0 && pos.z <= squareSize * 10))){ 
            //console.log("x: " + pos.x + " y: " + pos.y + " z: " + pos.z);
            return true;
        } else {
            return false;
        }
    }

    function isPieceOnMousePosition(pos){
        var boardPos = worldToBoard(pos);
        if(boardPos && board[boardPos[0]][boardPos[1]] !== 0){
            return true;
        }
        return false;
    }

    function selectPiece(pos){
        var boardPos = worldToBoard(pos);

        if(board[boardPos[0]][boardPos[1]] === 0){
            selectedPiece = null;
            return false;
        }

        selectedPiece = {};
        selectedPiece.boardPos = boardPos;
        selectedPiece.obj = board[boardPos[0]][boardPos[1]].pieceMesh;
        selectedPiece.origPos = selectedPiece.obj.position.clone();
        selectedPiece.pieceObj =  board[boardPos[0]][boardPos[1]].piece;

        return true;
    }

    function deselectPiece(){
        if(!selectedPiece){
            return;
        }

        selectedPiece.obj.position = selectedPiece.origPos;
        //selectedPiece.obj.children[0].position.y = 0;

        selectedPiece = null;
    }

    
};

