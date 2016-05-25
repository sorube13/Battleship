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
    
    /** @type HTMLCanvasElement*/
    var texture_placeholder;

    /** @type Object */
    var lights = {};
        
    /** @type Object */
    var materials = {};

    /** @type Object */
    var geometries = {};

    /** @type Object */
    var pieces = {};

    /** @type Object */
    var ships = {};

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

    /**
     * The opponent's board representation.
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
     * The initial ship board representation.
     * @type Array
     */
    var initBoard = [
        [0, 0, 0, 0, 0], // type 5
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0], // type 4
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0], // type 3
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0], // type 2  x 2 
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0], // type 1  x 2

    ];

    /** @type Object */
    var selectedPiece = null;

    /** @type Object */
    var callbacks = options.callbacks || {};

    /** @type boolean
     * setting = true while setting ships on user board
     * setting = false when all ships are on user board  
     */
    var setting = true;

    var initSet = false;

    var numShips = 7;
    var numShipsSet = 0;

    var startButton;
    var text, waitMsg, myTurnMsg, oppTurnMsg;
    var hitPiece, missPiece;

    /** @type boolean
     * battle = true when ships are set and interaction with other player begins
     * battle = false initializing and setting game  
     */
    var battle = false;

    var communication = false;

    var myTurn = false;
    var recievedId = false;

    var target;

    var missAudio = new Audio('audio/miss.m4a');
    var hitAudio = new Audio('audio/hit.m4a');

    var missPlane, hitPlane;
    var splash = false;
    var hit = false;
    var newMiss;
    var missMyBoard;
    var start = Date.now();
    var clock = new THREE.Clock();

    var customUniforms, customUniforms2;
    var missOpp, hitOpp;

    var endGame = false;


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
        var loader = new THREE.ColladaLoader();
        var pieceMesh;
        var pieceLoc = 'ship.dae';
        switch(piece.type){
            case 1:
                loader.load(assetsUrl + pieceLoc, function(result){
                    pieceMesh = result.scene;
                    pieceMesh.scale.x = 0.2;
                    setPiece(piece, pieceMesh);                    
                });
                // pieces.submarine = new THREE.Mesh(geometries.submarineGeom, materials.blackPieceMaterial);
                // pieceMesh = pieces.submarine;
                break;
            case 2:
                loader.load(assetsUrl + pieceLoc, function(result){
                    pieceMesh = result.scene;
                    pieceMesh.scale.x = 0.4;
                    setPiece(piece, pieceMesh);                    
                });
                // pieces.destroyer = new THREE.Mesh(geometries.destroyerGeom, materials.blackPieceMaterial);
                // pieceMesh = pieces.destroyer;
                break;
            case 3:
                loader.load(assetsUrl + pieceLoc, function(result){
                    pieceMesh = result.scene;
                    pieceMesh.scale.x = 0.6;
                    setPiece(piece, pieceMesh);                    
                });
                // pieces.cruiser = new THREE.Mesh(geometries.cruiserGeom, materials.blackPieceMaterial);
                // pieceMesh = pieces.cruiser;
                break;
            case 4:
                loader.load(assetsUrl + pieceLoc, function(result){
                    pieceMesh = result.scene;
                    pieceMesh.scale.x = 0.8;
                    setPiece(piece, pieceMesh);                    
                });
                // pieces.battleship = new THREE.Mesh(geometries.battleshipGeom, materials.blackPieceMaterial);
                // pieceMesh = pieces.battleship;
                break;
            case 5:
                loader.load(assetsUrl + pieceLoc, function(result){
                    pieceMesh = result.scene;
                    setPiece(piece, pieceMesh);                    
                });
                // pieces.carrier = new THREE.Mesh(geometries.carrierGeom, materials.blackPieceMaterial);
                // pieceMesh = pieces.carrier;
                break;
            default:
                break;
        }
    }

    function setPiece(piece, pieceMesh){
        var pos = initBoardPieceToWorld(piece)
        pieceMesh.position.set(pos.x, 0, pos.z);
        placePiece(piece, pieceMesh, initBoard);
        scene.add(pieceMesh);
    }

    this.movePiece = function(from, to, initSet){
        var pieceMesh = selectedPiece.obj; // board[from[0]][from[1]].pieceMesh;
        var piece = selectedPiece.pieceObj;// board[from[0]][from[1]].piece;
        var toWorldPos = boardToWorld(to);

        if(initSet){
            var myBoard = initBoard;
        } else{
            var myBoard = board;
        }

        // // Delete piece from previous position + add piece to new position
        removePiece(piece, selectedPiece.origOrient, selectedPiece.origPos, myBoard);
        
        if(piece.type % 2){ // if odd
            pieceMesh.position.x = toWorldPos.x;
            pieceMesh.position.z = toWorldPos.z; 
            if(piece.orientation === 1){
                piece.pos[0] = to[0] - Math.floor(piece.type / 2);
                piece.pos[1] = to[1];
            } else{
                piece.pos[0] = to[0];
                piece.pos[1] = to[1] - Math.floor(piece.type / 2);
            }
            
        } else{
            if(piece.orientation === 1){
                pieceMesh.position.x = toWorldPos.x + squareSize / 2;
                pieceMesh.position.z = toWorldPos.z; 
                piece.pos[0] = to[0] - piece.type / 2 + 1;
                piece.pos[1] = to[1];
            } else{
                pieceMesh.position.x = toWorldPos.x ;
                pieceMesh.position.z = toWorldPos.z + squareSize / 2; 
                piece.pos[0] = to[0];
                piece.pos[1] = to[1] - piece.type / 2 + 1;
            }
        }
        checkInside();
        placePiece(piece, pieceMesh, board);     
        pieceMesh.position.y = 3.48;
    }
    
    this.rotatePiece = function(center){
        selectedPiece.obj.rotation.y += 90 * Math.PI / 180;  
        selectedPiece.pieceObj.orientation = 1 - selectedPiece.pieceObj.orientation;
        selectedPiece.pieceObj.pos = centerToPos(selectedPiece.pieceObj, center);
        if(!(selectedPiece.pieceObj.type % 2)){
            if(selectedPiece.pieceObj.orientation===1){
                selectedPiece.obj.position.x += squareSize / 2;
            }else{
                selectedPiece.obj.position.x -= squareSize / 2;
            }
            selectedPiece.obj.position.z += squareSize / 2;
        }
        checkInside();
        removePiece(selectedPiece.pieceObj, selectedPiece.origOrient, selectedPiece.origPos, board);
        placePiece(selectedPiece.pieceObj, selectedPiece.obj, board);
    }

    this.setTurn = function(turn){
        myTurn = turn;
        recievedId = true;
        scene.remove(waitMsg);
        if(battle){
            if(myTurn){
                scene.add(myTurnMsg);
            }else{
                scene.add(oppTurnMsg);
            }
        }
    }

    this.startCommunication = function(){
        communication = true;
        awaitGame();
    }
    
    this.myBoardHit = function(target){
        var pos = boardToWorld(target);
        //var newPiece = hitPiece.clone();
        var newPiece = hitPlane.clone();
        newPiece.position.set(pos.x, pos.y, pos.z);
        scene.add(newPiece);
        hit = true;
        setTimeout(function(){
            hit = false;
        }, 3000);
        board[target[0]][target[1]] = 1;
        myTurn = true;
        scene.remove(oppTurnMsg);
        scene.add(myTurnMsg);
        hitAudio.play();

    }

    this.myBoardMiss = function(target){
        var pos = boardToWorld(target);
        var newPiece = missPlane.clone();
        newPiece.position.set(pos.x, 2.61, pos.z);
        scene.add(newPiece);
        
        missMyBoard = new THREE.Mesh(geometries.planeGeometry.clone(), materials.waterMaterial);
        missMyBoard.rotation.x = -0.5*Math.PI;
        missMyBoard.position.set(pos.x, 2.61, pos.z);
        scene.add(missMyBoard);
        splash = true;
        missAudio.play();
        setTimeout(function(){
            splash = false;
            scene.remove(missMyBoard);

        }, 3000);
        board[target[0]][target[1]] = 'x';
        myTurn = true;
        scene.remove(oppTurnMsg);
        scene.add(myTurnMsg);

    }

    this.oppBoardHit = function(){
        var pos = oppBoardToWorld(target);
        var newPiece = hitOpp.clone();
        newPiece.position.set(pos.x, pos.y, -7.4);
        scene.add(newPiece);
        oppBoard[target[0]][target[1]] = 1;
        myTurn = false;
        scene.remove(myTurnMsg);
        scene.add(oppTurnMsg);
        hitAudio.play();
    }

    this.oppBoardMiss = function(){
        var pos = oppBoardToWorld(target);
        var newPiece = missOpp.clone();
        newPiece.position.set(pos.x, pos.y, -7.4);
        scene.add(newPiece);
        oppBoard[target[0]][target[1]] = 'x';
        myTurn = false;
        scene.remove(myTurnMsg);
        scene.add(oppTurnMsg);
        missAudio.play();
    }

    this.endGame = function(){
        endGame = true;
    }
 
    
    /**********************************************************************************************/
    /* Private methods ****************************************************************************/

    /**
     * Initialize some basic 3D engine elements. 
     */
    function initEngine() {
        var skyBox;
        var viewWidth = containerEl.innerWidth;
        var viewHeight = containerEl.innerHeight;
        
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
        cameraController.target = new THREE.Vector3(squareSize * 5, squareSize * 2, 0);
        //
        scene.add(camera);

        texture_placeholder = document.createElement( 'canvas' );
        texture_placeholder.width = 128;
        texture_placeholder.height = 128;
        var context = texture_placeholder.getContext( '2d' );
        context.fillStyle = 'rgb( 200, 200, 200 )';
        context.fillRect( 0, 0, texture_placeholder.width, texture_placeholder.height );
        var materials = [
            loadTexture( 'images/posx.jpg' ), // right
            loadTexture( 'images/negx.jpg' ), // left
            loadTexture( 'images/posy.jpg' ), // top
            loadTexture( 'images/negy.jpg' ), // bottom
            loadTexture( 'images/posz.jpg' ), // back
            loadTexture( 'images/negz.jpg' )  // front
        ];
        skyBox = new THREE.Mesh( new THREE.BoxGeometry( 500, 500, 500, 7, 7, 7 ), new THREE.MultiMaterial( materials ) );
        skyBox.scale.x = - 1;
        scene.add(skyBox);
        
        containerEl.appendChild(renderer.domElement);

        // Set the background color of the scene.
        //renderer.setClearColor(new THREE.Color(0x333F47, 1));

        // Set window resize with THREE extension
        var winResize   = new THREEx.WindowResize(renderer, camera, getDimensions);//, getDimensions);
        // window.addEventListener('resize', function(){
        //     renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
        //     camera.aspect = containerEl.clientWidth / containerEl.clientHeight;
        //     camera.updateProjectionMatrix();
        // }, false);
    }

    function getDimensions(){
        return { width: containerEl.clientWidth, height: document.getElementById('content').clientHeight  };
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
        lights.whiteSideLight.shadow.camera.fov = 55;

        // black's side light
        lights.blackSideLight = new THREE.SpotLight();
        lights.blackSideLight.position.set( squareSize * 5, 100, squareSize * 5 - 200);
        lights.blackSideLight.intensity = 0.8;
        lights.blackSideLight.shadow.camera.fov = 55;
        
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
            map: THREE.TextureLoader(assetsUrl + 'ground.png')
        });
        // grid
        materials.squareMaterial = new THREE.MeshPhongMaterial({
            color: 0xd3d3d3,
            
        });
     
        // black piece material
        materials.blackPieceMaterial = new THREE.MeshPhongMaterial({
            color: 0x9f2200,
            shininess: 20
        });

        // start button
        materials.textMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map: THREE.ImageUtils.loadTexture(assetsUrl + 'note.png')
        });

        materials.startMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map:THREE.ImageUtils.loadTexture(assetsUrl + 'start.png')
        });

        materials.waitMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map: THREE.ImageUtils.loadTexture(assetsUrl + 'wait.png')
        });

        materials.myTurnMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map: THREE.ImageUtils.loadTexture(assetsUrl + 'myTurn.png')
        });

        materials.othersTurnMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map: THREE.ImageUtils.loadTexture(assetsUrl + 'othersTurn.png')
        });

        // hit material
        materials.hitMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000
        });

        // miss material
        materials.missMaterial = new THREE.MeshPhongMaterial({
            color: 0x0000FF
        });
 
        // water material
        materials.waterMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map: THREE.ImageUtils.loadTexture(assetsUrl + 'water.jpg')
        });   

        materials.explosionMaterial = new THREE.ShaderMaterial({
            uniforms: { 
                tExplosion: {
                    type: "t", 
                    value: THREE.ImageUtils.loadTexture( 'images/explosion.png' )
                },
                time: { // float initialized to 0
                    type: "f", 
                    value: 0.0 
                }
            },
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent
        });

        materials.noiseTexture = new THREE.ImageUtils.loadTexture('images/cloud.png');
        materials.noiseTexture.wrapS = materials.noiseTexture.wrapT = THREE.RepeatWrapping;

        materials.lavaTexture = new THREE.ImageUtils.loadTexture('images/lava.jpg');
        materials.lavaTexture.wrapS = materials.lavaTexture.wrapT = THREE.RepeatWrapping;

        customUniforms = {
            baseTexture:    { type: "t", value: materials.lavaTexture },
            baseSpeed:      { type: "f", value: 0.05 },
            noiseTexture:   { type: "t", value: materials.noiseTexture },
            noiseScale:     { type: "f", value: 0.5337 },
            alpha:          { type: "f", value: 1.0 },
            time:           { type: "f", value: 1.0 }
        };

        materials.customMaterial = new THREE.ShaderMaterial({
            uniforms: customUniforms,
            vertexShader:   document.getElementById( 'vertexShader2'   ).textContent,
            fragmentShader: document.getElementById( 'fragmentShader2' ).textContent
        });

        materials.customMaterial.side = THREE.DoubleSide;

        materials.waterTexture = new THREE.ImageUtils.loadTexture( assetsUrl + 'water.jpg' );
        materials.waterTexture.wrapS = materials.waterTexture.wrapT = THREE.RepeatWrapping; 
        
        // use "this." to create global object
        customUniforms2 = {
            baseTexture:    { type: "t", value: materials.waterTexture },
            baseSpeed:      { type: "f", value: 1.15 },
            noiseTexture:   { type: "t", value: materials.noiseTexture },
            noiseScale:     { type: "f", value: 0.2 },
            alpha:          { type: "f", value: 0.8 },
            time:           { type: "f", value: 1.0 }
        };

        // create custom material from the shader code above
        //   that is within specially labeled script tags
        materials.customMaterial2 = new THREE.ShaderMaterial( 
        {
            uniforms: customUniforms2,
            vertexShader:   document.getElementById( 'vertexShader2'   ).textContent,
            fragmentShader: document.getElementById( 'fragmentShader2' ).textContent
        }   );
     
        // other material properties
        materials.customMaterial2.side = THREE.DoubleSide;
        materials.customMaterial2.transparent = true;
      
    }
    
    /**
     * Initialize the objects.
     * @param {Object} callback Function to call when the objects have been loaded.
     */
    function initObjects(callback) {
        boardModel = new THREE.Mesh(new THREE.CubeGeometry(squareSize * 10 + 20, 5, squareSize * 10 + 20), materials.boardMaterial);
        boardModel.position.set(squareSize * 5, -0.02, squareSize * 5);
        scene.add(boardModel);
      

        // add ground
        groundModel = new THREE.Mesh(new THREE.PlaneGeometry(squareSize * 10, squareSize * 10, 1, 1), materials.groundMaterial);
        groundModel.position.set(squareSize * 5, -0.02, squareSize * 5);
        groundModel.rotation.x = -90 * Math.PI / 180;
        //        
        scene.add(groundModel);

        // create the board squares
        var squareMaterial = materials.boardMaterial;

        for (var row = 0; row < 10; row++) {
            for (var col = 0; col < 10; col++) {
               // squareMaterial = materials.squareMaterial;
         
                var square = new THREE.Mesh(new THREE.PlaneGeometry(squareSize, squareSize, 1, 0), squareMaterial);
         
                square.position.x = col * squareSize + squareSize / 2;
                square.position.z = row * squareSize + squareSize / 2;

                square.position.y = 2.5;
         
                square.rotation.x = -90 * Math.PI / 180;

                var egh = new THREE.EdgesHelper( square, 0xd3d3d3 );
                egh.material.linewidth = 2;
                egh.position.x = col * squareSize + squareSize / 2;
                egh.position.z = row * squareSize + squareSize / 2;

                egh.position.y = 2.5;
         
                egh.rotation.x = -90 * Math.PI / 180;
                scene.add( egh );
         
                scene.add(square);


            
            }
        }

        var oppBoardModel = new THREE.Mesh(new THREE.CubeGeometry(squareSize * 10 + 20, squareSize * 10 + 20, 5), materials.boardMaterial);
        oppBoardModel.position.set(squareSize * 5 , (squareSize * 5 + 10), -(0.02 + 10));
        scene.add(oppBoardModel);
        

        var oppSquareMaterial = materials.boardMaterial;


        for (var row = 0; row < 10; row++) {
            for (var col = 0; col < 10; col++) {
               // squareMaterial = materials.squareMaterial;
         
                var square = new THREE.Mesh(new THREE.PlaneGeometry(squareSize, squareSize, 1, 1), oppSquareMaterial);
         
                square.position.x = col * squareSize + squareSize / 2;
                square.position.y = row * squareSize + squareSize / 2 + 10;

                square.position.z = 2.5 - 10;
        
                var egh = new THREE.EdgesHelper( square, 0xd3d3d3 );
                egh.material.linewidth = 2;
                egh.position.x = col * squareSize + squareSize / 2;
                egh.position.z = row * squareSize + squareSize / 2;

                egh.position.y = 2.5;
         
                egh.rotation.x = -90 * Math.PI / 180;
                scene.add( egh );
         
                scene.add(square);
            }
        }


        geometries.carrierGeom = new THREE.CubeGeometry(squareSize * 5, 2, squareSize - 1 );
        geometries.battleshipGeom = new THREE.CubeGeometry(squareSize * 4, 2, squareSize - 1);
        geometries.cruiserGeom = new THREE.CubeGeometry(squareSize * 3, 2, squareSize - 1 );
        geometries.destroyerGeom = new THREE.CubeGeometry(squareSize * 2, 2, squareSize - 1 );
        geometries.submarineGeom = new THREE.CubeGeometry(squareSize, 2, squareSize - 1 );
        geometries.textGeom = new THREE.CubeGeometry(squareSize * 5, squareSize * 2, 0 );
        geometries.pieceGeom = new THREE.CubeGeometry(squareSize / 3, squareSize *2, squareSize / 3);
        
        hitPiece = new THREE.Mesh(geometries.pieceGeom, materials.hitMaterial);
        missPiece = new THREE.Mesh(geometries.pieceGeom, materials.missMaterial);

        text = new THREE.Mesh(geometries.textGeom, materials.textMaterial);
        text.position.set(-50, 50, 0);
        scene.add(text);

        myTurnMsg = new THREE.Mesh(geometries.textGeom, materials.myTurnMaterial);
        myTurnMsg.position.set(-50, 50, 0);
        oppTurnMsg = new THREE.Mesh(geometries.textGeom, materials.othersTurnMaterial);
        oppTurnMsg.position.set(-50, 50, 0);

        geometries.planeGeometry = new THREE.PlaneGeometry(squareSize, squareSize, 20, 20);

        missPlane = new THREE.Mesh(geometries.planeGeometry.clone(), materials.customMaterial2);
        missPlane.rotation.x = -0.5*Math.PI;

        hitOpp = new THREE.Mesh(geometries.planeGeometry, materials.customMaterial);

        missOpp = new THREE.Mesh(geometries.planeGeometry, materials.customMaterial2)



        geometries.explosion = new THREE.IcosahedronGeometry(4, 4);
        hitPlane = new THREE.Mesh(geometries.explosion, materials.explosionMaterial);
        
        // missPlane.position.set(5, 2.60, 5);
        // scene.add(missPlane);
        // splash = true;

        // setTimeout(function(){
        //     splash = false;
        // }, 3000);

        callback();
    }

    /**
     * Initialize the listeners.
     */
    function initListeners(){
        var domElement = renderer.domElement;

        domElement.addEventListener('mousedown', onMouseDown, false);
        domElement.addEventListener('mouseup', onMouseUp, false);
        domElement.addEventListener('dblclick', onDoubleClick, false);
        renderer.domElement.addEventListener("click", onMouseClick, false);
    }

  
    /**
     * The render loop.
     */
    function onAnimationFrame(ts) {
        requestAnimationFrame(onAnimationFrame);
        
        cameraController.update();

        if(splash){
            var center = new THREE.Vector2(0, 0);
            //window.requestAnimationFrame(onAnimationFrame);
            var vLength = missMyBoard.geometry.vertices.length;
            for (var i = 0; i < vLength; i++) {
                var v = missMyBoard.geometry.vertices[i];
                var dist = new THREE.Vector2(v.x, v.y).sub(center);
                var size = 2.0;
                var magnitude = 0.5;
                v.z = Math.sin(dist.length()/-size + (ts/500)) * magnitude;
            }
            missMyBoard.geometry.verticesNeedUpdate = true;
        }
        // update moving light position
        lights.movingLight.position.x = camera.position.x;
        lights.movingLight.position.z = camera.position.z;

        materials.explosionMaterial.uniforms['time'].value = 0.00025 * (Date.now() - start);        
        var delta = clock.getDelta();
        customUniforms.time.value += delta;
        customUniforms2.time.value += delta;


        
        renderer.render(scene, camera);
    }

    /*
     * Loading skybox texture
    */
    function loadTexture( path ) {
        var texture = new THREE.Texture( texture_placeholder );
        var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5 } );
        var image = new Image();
        image.onload = function () {
            texture.image = this;
            texture.needsUpdate = true;
        };
        image.src = path;
        return material;
    }

    /**
     * Listener for mouse down event.
     * Selects a piece from mouse position
     * Adds mouse move listener
     * Blocks camera rotation
     */
    function onMouseDown(event){
        var mouse3D = getMouse3D(event);

        if(isMouseOnBoard(mouse3D) || (isMouseOnInitBoard(mouse3D) && setting) && !battle && !endGame){
            if(isPieceOnMousePosition(mouse3D)){
                selectPiece(mouse3D, initSet);
            } else if(isShipInitOnMousePosition(mouse3D) && setting){
                initSet = true;
                selectPiece(mouse3D, initSet);
            }
            renderer.domElement.addEventListener("mousemove", onMouseMove, false);
            cameraController.enabled = false;
        }
    }

    /**
     * Listener for mouse up event.
     * Selects piece from mouse position
     * Call callbacks to check if piece can be dropped and dropping it
     * Moves the piece to the new position
     * Activates the camera rotation
     */
    function onMouseUp(event){
        renderer.domElement.removeEventListener('mousemove', onMouseMove, false);

        var mouse3D = getMouse3D(event);

        if(isMouseOnBoard(mouse3D) && selectedPiece && !battle && !endGame){
            var toBoardPos = worldToBoard(mouse3D); 
            if((toBoardPos[0] === selectedPiece.boardPos[0] && toBoardPos[1] === selectedPiece.boardPos[1])){
                deselectPiece();
            } else{
                if(callbacks.pieceCanDrop && callbacks.pieceCanDrop(toBoardPos, selectedPiece.pieceObj)){
                    instance.movePiece(selectedPiece.boardPos, toBoardPos, initSet);
                    if(callbacks.pieceDropped){
                        callbacks.pieceDropped(selectedPiece.pieceObj, selectedPiece.origOrient, selectedPiece.origPos, toBoardPos, initSet);
                        checkLoad(initSet);
                    }
                    selectedPiece = null;
                }else{
                    deselectPiece();
                }
            }
        }else{
            deselectPiece();
        }
        cameraController.enabled = true;
        initSet = false;
        
    }

    /**
     * Listener for mouse move event.
     * Moves position of piece according to mouse position if piece is selected
     */
    function onMouseMove(event){    
        var mouse3D = getMouse3D(event);

        if(selectedPiece && !battle && !endGame){
            selectedPiece.obj.position.x= mouse3D.x;
            selectedPiece.obj.position.z = mouse3D.z;
            selectedPiece.obj.position.y = 3;
        }
    }

    /**
     * Listener for double click event.
     * Selects piece from mouse position
     * Calls callbacks to check if piece can be rotated and saves the rotation
     * Rotates piece in the board
     * Deselects piece
     */
    function onDoubleClick(event){
        var mouse3D = getMouse3D(event);

        if(isMouseOnBoard(mouse3D) && !battle && !endGame){
            if(isPieceOnMousePosition(mouse3D)){
                selectPiece(mouse3D, false);
                if(selectedPiece){
                    var center = worldToBoard(selectedPiece.obj.position);
                    if(callbacks.pieceCanRotate && callbacks.pieceCanRotate(selectedPiece.pieceObj, center)){
                        instance.rotatePiece(center);
                        if(callbacks.pieceDropped){
                            callbacks.pieceDropped(selectedPiece.pieceObj, selectedPiece.origOrient, selectedPiece.origPos, center, initSet);
                        }
                        selectedPiece = null;
                    }else{
                        deselectPiece();
                    }
                }else{
                    deselectPiece();
                }
            }
        }
    }

    /**
     * Listener for click event.
     * Starts the game if start button is clicked
     */
    function onMouseClick(event){
        var mouse3D = getYMouse3D(event);
        if(!battle && !setting && !endGame) { // phase 1: construction of board
            if(communication && isStartOnMousePosition(mouse3D)){
                scene.remove(startButton);
                battle = true;
                if(recievedId){
                    if(myTurn){
                        scene.add(myTurnMsg);
                    }else{
                        scene.add(oppTurnMsg);
                    }
                } else{
                    waitMsg = new THREE.Mesh(geometries.textGeom, materials.waitMaterial);
                    waitMsg.position.set(-50, 50, 0);
                    scene.add(waitMsg);
                }
                if(callbacks.sendId){
                    callbacks.sendId();
                }
            }
        }else{ // phase 2: game
            if(isMouseOnOppBoard(mouse3D) && myTurn && !endGame){
                target = [ Math.floor(mouse3D.x / squareSize) , Math.floor((squareSize * 11 - mouse3D.y) / squareSize)] 
                if(callbacks.selectTarget){
                    callbacks.selectTarget(target);
                    //renderer.domElement.removeEventListener('click', onMouseClick, false);
                    
                }
            }

        }
    }

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
     * Saves piece and mesh in the board according to the piece's position.
     * @param {Object} piece The piece object.
     * @param {THREE.Mesh} mesh The piece Mesh object.
     */
    function placePiece(piece, mesh, myBoard){
        var x = piece.pos[0];
        var y = piece.pos[1];
        var obj = {
            piece: piece,
            pieceMesh: mesh
        }
        for(var i = 0; i < piece.type; i++ ){
            if (piece.orientation === 1){
                myBoard[x + i][y] = obj;
            } else{
                myBoard[x][y + i] = obj;
            }       
        }
    }

    /**
     * Removes piece and mesh from the board according to the piece's previous position.
     * @param {Object} piece The piece object.
     * @param {boolean} orientation The original orientation of the piece object.
     * @param {Array} from The original position of the piece object [x,y]
     */
    function removePiece(piece, orientation, from, myBoard){
        var x = from[0];
        var y = from[1];
        for(var i = 0; i < piece.type; i++ ){
            if (orientation === 1){
                myBoard[x + i][y] = 0;
            } else{
                myBoard[x][y + i] = 0;
            }       
        }
    }

    /**
     * Finds the coordinates of the mouse in the scene 
     * return position Position of the mouse in perspective with the bottom board (user board)
     */
    function getMouse3D(mouseEvent){
        var x, y;

        if(mouseEvent.offsetX !== undefined){
            x = mouseEvent.offsetX;
            y = mouseEvent.offsetX;
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
    function getYMouse3D(mouseEvent){
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
     * Checks whether there is a piece at the mouse's position.
     * @param {Array} pos The coordinates of the mouse position in the scene.
     * return {boolean}.
     */
    function isPieceOnMousePosition(pos){
        var boardPos = worldToBoard(pos);
        if(boardPos){
            console.log('board[',boardPos[0],'][', boardPos[1],'] = ', board[boardPos[0]][boardPos[1]]);
        }
        if(boardPos && board[boardPos[0]][boardPos[1]] !== 0){
            return true;
        }
        return false;
    }

    function isShipInitOnMousePosition(pos){
        var boardPos = worldToInitBoard(pos);
        if(boardPos && initBoard[boardPos[0]][boardPos[1]] !== 0 && initBoard[boardPos[0]][boardPos[1]] !== undefined ){
            return true;
        }
        return false;
    }

    /**
     * Updates selectedPiece with the objects related to the object in the position given.
     * @param {Array} pos The coordinates of the piece chosen.
     * selectedPiece{
            boardPos: actual coordinates in board array
            obj: THREE.Mesh object of the piece at board[boardPos]
            objPiece: piece at board[boardPos] 
            origPosition: original obj position
            origPos: original piece pos attribute
            origOrient: original piece orientation
        }
     * return {boolean}.
     */
    function selectPiece(pos, initSet){
        if(initSet){
            var boardPos = worldToInitBoard(pos);
            var myBoard = initBoard;
        }else{
            var boardPos = worldToBoard(pos);
            var myBoard = board;
        }
        if(myBoard[boardPos[0]][boardPos[1]] === 0 || myBoard[boardPos[0]][boardPos[1]] === 'x' || myBoard[boardPos[0]][boardPos[1]] === 1){
            selectedPiece = null;
            return false;
        }
        selectedPiece = {};
        selectedPiece.boardPos = boardPos;
        selectedPiece.obj = myBoard[boardPos[0]][boardPos[1]].pieceMesh;
        selectedPiece.origPosition = selectedPiece.obj.position.clone();
        selectedPiece.pieceObj =  myBoard[boardPos[0]][boardPos[1]].piece;
        selectedPiece.origPos = JSON.parse(JSON.stringify(selectedPiece.pieceObj.pos))
        selectedPiece.origOrient = JSON.parse(JSON.stringify(selectedPiece.pieceObj.orientation));
        return true;
    }

    /**
     * Deselects selectedPiece and resets original position.
     */
    function deselectPiece(){
        if(!selectedPiece){
            return;
        }

        selectedPiece.obj.position.set(selectedPiece.origPosition.x, selectedPiece.origPosition.y, selectedPiece.origPosition.z);
        //selectedPiece.obj.children[0].position.y = 0;

        selectedPiece = null;
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
     * Checks whether the piece is outside the board and resets the coordinates so that it is inside.
     */
    function checkInside(){
        var piece = selectedPiece.pieceObj;
        var length = piece.type;
        var orientation = piece.orientation;
        var pos = piece.pos;

        if(orientation === 0){
            if(pos[1] < 0){
                pos[1] = 0;
                selectedPiece.obj.position.z = squareSize * length / 2;
            } else if(pos[1] + length >= board.length){
                pos[1] = board.length - length;
                selectedPiece.obj.position.z = (board.length - length / 2) * squareSize;
            }
        } else {
            if(pos[0] < 0){
                pos[0] = 0;
                selectedPiece.obj.position.x = squareSize * length / 2;
            } else if(pos[0] + length >= board.length){
                pos[0] = board.length - length;
                selectedPiece.obj.position.x = (board.length - length / 2) * squareSize;
            }
        }    
    }

    function checkLoad(initSet){
        if(initSet){
            numShipsSet++;
            if(numShipsSet === numShips){
                setting = false;
                awaitGame();
            }
        }

    }

    function isStartOnMousePosition(pos){
        if((pos.x >= -75 && pos.x<=-25) && (pos.y >= 40 && pos.y <= 60)){
            return true;
        }
        return false;
    }

    function awaitGame(){
        if(communication && (!setting)){
            scene.remove(text);
            startButton = new THREE.Mesh(geometries.textGeom, materials.startMaterial);
            startButton.position.set(-50, 50, 0);
            scene.add(startButton);
            renderer.domElement.addEventListener("click", onMouseClick, false);
        }
    }

};
