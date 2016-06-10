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
    // var groundModel;

    
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

    var initSet = true;

    var numShips = 7;
    var numShipsSet = 0;

    var startButton;
    var text, waitMsg, myTurnMsg, oppTurnMsg, winMsg, looseMsg;
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

    var missAudio = new Audio('/audio/miss.m4a');
    var hitAudio = new Audio('/audio/hit.m4a');

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
                break;
            case 2:
                loader.load(assetsUrl + pieceLoc, function(result){
                    pieceMesh = result.scene;
                    pieceMesh.scale.x = 0.4;
                    setPiece(piece, pieceMesh);                    
                });
                break;
            case 3:
                loader.load(assetsUrl + pieceLoc, function(result){
                    pieceMesh = result.scene;
                    pieceMesh.scale.x = 0.6;
                    setPiece(piece, pieceMesh);                    
                });
                break;
            case 4:
                loader.load(assetsUrl + pieceLoc, function(result){
                    pieceMesh = result.scene;
                    pieceMesh.scale.x = 0.8;
                    setPiece(piece, pieceMesh);                    
                });
                break;
            case 5:
                loader.load(assetsUrl + pieceLoc, function(result){
                    pieceMesh = result.scene;
                    setPiece(piece, pieceMesh);                    
                });
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

    this.movePiece = function(from, to, initSet, rotate){
        var pieceMesh = selectedPiece.obj; // board[from[0]][from[1]].pieceMesh;
        var piece = selectedPiece.pieceObj;// board[from[0]][from[1]].piece;

        if(initSet){
            var myBoard = initBoard;
        } else{
            var myBoard = board;
        }

        // // Delete piece from previous position + add piece to new position
        removePiece(piece, selectedPiece.origOrient, selectedPiece.origPos, myBoard);

        piece.pos[0] = to[0];
        piece.pos[1] = to[1];

        if(rotate){
            selectedPiece.obj.rotation.y += 90 * Math.PI / 180;  
            selectedPiece.pieceObj.orientation = 1 - selectedPiece.pieceObj.orientation;
        }
        var toWorldPos = boardToWorld(posToCenter(piece, to));

        
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

        //checkInside();
        placePiece(piece, pieceMesh, board);     
        pieceMesh.position.y = 3.48;
    }

    this.setTurn = function(turn){
        myTurn = turn;
        recievedId = true;
        scene.remove(waitMsg);
        console.log('>>>>Setting turn', myTurn, recievedId, battle);
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
        console.log(">>>>>>>>> communication", communication);
        awaitGame();
    }
    
    this.myBoardHit = function(target, totalSink){
        var pos = boardToWorld(target);
        //var newPiece = hitPiece.clone();
        var newPiece = hitPlane.clone();
        newPiece.position.set(pos.x, pos.y, pos.z);
        scene.add(newPiece);
        hit = true;
        setTimeout(function(){
            hit = false;
        }, 3000);
        var ship = board[target[0]][target[1]];
        if(totalSink){
            if(ship.piece.orientation === 1){
                ship.pieceMesh.rotation.z -= 20*Math.PI /180;
            }else{
                ship.pieceMesh.rotation.x -= 20*Math.PI/180;
            }
                
        }
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

    this.oppBoardHit = function(target){
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

    this.oppBoardMiss = function(target){
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

    this.endGame = function(win){
        endGame = true;
        if(myTurn){
            scene.remove(oppTurnMsg);
        } else{
            scene.remove(myTurnMsg);
        }
        if(win){
            scene.add(winMsg);
        } else{
            scene.add(looseMsg);
        }
    }
 
    
    /**********************************************************************************************/
    /* Private methods ****************************************************************************/

    /**
     * Initialize some basic 3D engine elements. 
     */
    function initEngine() {
        var skyBox;
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
            loadTexture( '/images/skybox/posx.jpg' ), // right
            loadTexture( '/images/skybox/negx.jpg' ), // left
            loadTexture( '/images/skybox/posy.jpg' ), // top
            loadTexture( '/images/skybox/negy.jpg' ), // bottom
            loadTexture( '/images/skybox/posz.jpg' ), // back
            loadTexture( '/images/skybox/negz.jpg' )  // front
        ];
        skyBox = new THREE.Mesh( new THREE.BoxGeometry( 500, 500, 500, 7, 7, 7 ), new THREE.MultiMaterial( materials ) );
        skyBox.scale.x = - 1;
        scene.add(skyBox);
        
        containerEl.appendChild(renderer.domElement);


        // Set window resize with THREE extension
        var winResize   = new THREEx.WindowResize(renderer, camera, function(){
            return {width:containerEl.clientWidth, height: document.getElementById('content').clientHeight}
        });
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
        var loader = new THREE.TextureLoader();       

        // board material
        materials.boardMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080
        });
     
        // ground material
        // materials.groundMaterial = new THREE.MeshBasicMaterial({
        //     transparent: true,
        //     map: THREE.TextureLoader('/images/ground.png')
        // });
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
            map: loader.load('/images/text/note.png') //THREE.ImageUtils.loadTexture('/images/text/note.png')
        });

        materials.startMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map:loader.load('/images/text/start.png')//THREE.ImageUtils.loadTexture('/images/text/start.png')
        });

        materials.waitMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map: loader.load('/images/text/wait.png')
        });

        materials.myTurnMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map: loader.load('/images/text/myTurn.png')
        });

        materials.othersTurnMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map: loader.load('/images/text/othersTurn.png')
        });

        materials.winMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map: loader.load('/images/text/win.png')
        });

        materials.looseMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            map: loader.load('/images/text/loose.png')
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
            map: loader.load('/images/water.jpg')
        });   

        materials.explosionMaterial = new THREE.ShaderMaterial({
            uniforms: { 
                tExplosion: {
                    type: "t", 
                    value: loader.load( '/images/explosion.jpg' )
                },
                time: { // float initialized to 0
                    type: "f", 
                    value: 0.0 
                }
            },
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent
        });

        materials.noiseTexture =loader.load('/images/cloud.png');
        materials.noiseTexture.wrapS = materials.noiseTexture.wrapT = THREE.RepeatWrapping;

        materials.lavaTexture = loader.load('/images/lava.jpg');
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

        materials.waterTexture = loader.load('/images/water.jpg' );
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

        // create the board squares
        var squareMaterial = materials.boardMaterial;

        for (var row = 0; row < 10; row++) {
            for (var col = 0; col < 10; col++) {
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

        winMsg = new THREE.Mesh(geometries.textGeom, materials.winMaterial);
        winMsg.position.set(-50, 50, 0);

        looseMsg = new THREE.Mesh(geometries.textGeom, materials.looseMaterial);
        looseMsg.position.set(-50, 50, 0);

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
    function selectPiece(pos, initSet, contr){
        if(!contr){
            if(initSet){
                var boardPos = worldToInitBoard(pos);
                var myBoard = initBoard;
            }else{
                var boardPos = worldToBoard(pos);
                var myBoard = board;
            }
        }else{
            var boardPos = pos;
            var myBoard = initBoard;
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

    

    function awaitGame(){
        console.log('Reached await game with communication', communication, 'setting', setting, 'recievedId', recievedId);
        if(communication && !setting){
            scene.remove(text);
            battle = true
            callbacks.sendId();
            if(recievedId){
                scene.remove(waitMsg);
                if(myTurn){
                    scene.add(myTurnMsg);
                }else{
                    scene.add(oppTurnMsg);
                }
            }else{
                waitMsg = new THREE.Mesh(geometries.textGeom, materials.waitMaterial);
                waitMsg.position.set(-50, 50, 0);
                scene.add(waitMsg);
            }
        }
    }

    this.updateBoard = function(msg){
        var coordsInitShip={
            1: [0,0],
            2: [0,2],
            3: [0,4],
            4: [0,6],
            5: [3,6],
            6: [0,8],
            7: [2,8]
        }
        for(var i = 1; i <= Object.keys(msg).length; i++){
            var pos = coordsInitShip[i];
            selectPiece(pos, true, true);
            var rotate = false;
            if(msg[i].orientation === 0){
                rotate = true;
            }
            instance.movePiece(selectedPiece.boardPos, msg[i].pos, initSet, rotate);
            callbacks.pieceDropped(selectedPiece.pieceObj, msg[i].orientation, selectedPiece.boardPos, msg[i].pos, initSet);
            //console.log('myBoard['+ msg[i].pos[0] + "]["+msg[i].pos[1] + "] = ", board[msg[i].pos[0]][msg[i].pos[1]]);
            selectedPiece = null;
        }
        initSet = false;
        setting = false;
        awaitGame();
    }

};

