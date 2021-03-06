
'use strict';


//Look after different browser vendors' ways of calling the getUserMedia() API method:
//Opera --> getUserMedia
//Chrome --> webkitGetUserMedia
//Firefox --> mozGetUserMedia
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// Clean-up function:
// collect garbage before unloading browser's window
window.onbeforeunload = function(e){
    hangup();
}

// Data channel information
var sendChannel, receiveChannel;

// HTML5 <video> elements
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

// Flags...
var isChannelReady;
var isInitiator;
var isStarted;

// WebRTC data structures
// Streams
var localStream;
var remoteStream;
// Peer Connection
var pc;

var socket = null;

// Peer Connection ICE protocol configuration (either Firefox or Chrome)
var pc_config = webrtcDetectedBrowser === 'firefox' ?
    {'iceServers':[{'urls':'stun:23.21.150.121'}]} : // IP address
    {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        xhr = null;
    }
    return xhr;
}


// Peer Connection contraints: (i) use DTLS;
var pc_constraints = webrtcDetectedBrowser === 'firefox' ? 
 {
    'optional': [
      {'DtlsSrtpKeyAgreement': true},
      {'RtpDataChannels': true}
]} :
{
    'optional' : [

]};

// Session Description Protocol constraints:
// - use both audio and video regardless of what devices are available
//var sdpConstraints = {'mandatory': {
//  'OfferToReceiveAudio':true,
//  'OfferToReceiveVideo':true }};

var sdpConstraints = webrtcDetectedBrowser === 'firefox' ? 
  {'offerToReceiveAudio':true,'offerToReceiveVideo':true } :
  {'mandatory': {'OfferToReceiveAudio':true, 'OfferToReceiveVideo':true }};

/////////////////////////////////////////////

// Let's get started: prompt user for input (room name)
// var default_name = randomId();
var href = location.pathname;

var room =  href.substr(href.lastIndexOf('/') + 1);//prompt('Enter room name:', default_name);


// Connect to signalling server
var socket = io.connect();

// Send 'Create or join' message to singnalling server
if (room !== '') {
    console.log('Create or join room', room);
    socket.emit('create or join', room);
    socket.emit('getCred');
}

// Set getUserMedia constraints
var constraints = {video: true,
                   audio: true };

// Call getUserMedia()
navigator.getUserMedia(constraints, handleUserMedia, handleUserMediaError);
console.log('Getting user media with constraints', constraints);


// From this point on, execution proceeds based on asynchronous events...

/////////////////////////////////////////////

// getUserMedia() handlers...
/////////////////////////////////////////////
function handleUserMedia(stream) {
    localStream = stream;
    attachMediaStream(localVideo, stream);
    console.log('Adding local stream.');
    sendMessage('got user media');
    if (isInitiator) {
        checkAndStart();
    }
}

function handleUserMediaError(error){
    console.log('navigator.getUserMedia error: ', error);
}
/////////////////////////////////////////////
// Server-mediated message exchanging...
/////////////////////////////////////////////



/////////////////////////////////////////////
// 1. Server-->Client...
/////////////////////////////////////////////

// Handle 'created' message coming back from server:
// this peer is the initiator
socket.on('created', function (room){
    console.log('Created room ' + room);
    isInitiator = true;
});

// Handle 'full' message coming back from server:
// this peer arrived too late :-(
socket.on('full', function (room){
    console.log('Room ' + room + ' is full');
});

// Handle 'join' message coming back from server:
// another peer is joining the channel
socket.on('join', function (room){
    console.log('Another peer made a request to join room ' + room);
    //console.log('This peer is the initiator of room ' + room + '!');
    isChannelReady = true;
});

// Handle 'joined' message coming back from server:
// this is the second peer joining the channel
socket.on('joined', function (room){
    console.log('This peer has joined room ' + room);
    isChannelReady = true;
});

// Server-sent log message...
socket.on('log', function (array){
    console.log.apply(console, array);
});

// Receive message from the other peer via the signalling server 
socket.on('message', function (message){
    //console.log('Received message:', message);
    if (message === 'got user media') {
        checkAndStart();
    } else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
            checkAndStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
    } else if (message.type === 'answer' && isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && isStarted) {
        var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,
        candidate:message.candidate});
        pc.addIceCandidate(candidate);
    } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
    }
});

socket.on('ICE Candidates', function(cred){
    var url = 'https://service.xirsys.com/ice';
    var xhr = createCORSRequest('POST', url);
    xhr.onload = function() {
        var iceServers = JSON.parse(xhr.responseText).d.iceServers;
        pc_config.iceServers = iceServers;
    };
    xhr.onerror = function() {
        console.error('Woops, there was an error making xhr request.');
    };
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.send(cred);

});
////////////////////////////////////////////////

// 2. Client-->Server
////////////////////////////////////////////////
// Send message to the other peer via the signalling server
function sendMessage(message){
    //console.log('Sending message: ', message);
    socket.emit('message', message);
}
////////////////////////////////////////////////////

////////////////////////////////////////////////////
// Channel negotiation trigger function
function checkAndStart() {
    if (!isStarted && typeof localStream != 'undefined' && isChannelReady) {
        createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        if (isInitiator) {
            doCall();
        }
    }
}

/////////////////////////////////////////////////////////
// Peer Connection management...
function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(pc_config, pc_constraints);
        pc.onicecandidate = handleIceCandidate;
        // console.log('Created RTCPeerConnnection with:\n' +
        //     '  config: \'' + JSON.stringify(pc_config) + '\';\n' +
        //     '  constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;

    if (isInitiator) {
        try {
            // Create a reliable data channel
            sendChannel = pc.createDataChannel("sendDataChannel",
              {reliable: true});
            //console.log('Created sendChannel' , sendChannel);
            trace('Created send data channel');
        } catch (e) {
            alert('Failed to create data channel. ');
            trace('createDataChannel() failed with exception: ' + e.message);
        }
        sendChannel.onopen = handleSendChannelStateChange;
        sendChannel.onmessage = handleMessage;
        sendChannel.onclose = handleSendChannelStateChange;
    } else { // Joiner
        pc.ondatachannel = gotReceiveChannel;
    }

   // game.startCommunication();
}

// Data channel management
function sendData(data) {
    if(isInitiator) sendChannel.send(data);
    else receiveChannel.send(data);
    trace('Sent data: ' + data);
    //console.log('data:', data, typeof(data));
}

// Handlers...

function gotReceiveChannel(event) {
    trace('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.onmessage = handleMessage;
    receiveChannel.onopen = handleReceiveChannelStateChange;
    receiveChannel.onclose = handleReceiveChannelStateChange;
}

function handleMessage(event) {
    trace('Received message: ' + event.data);
    game.receiveFromOpponent(event.data);
}

function handleSendChannelStateChange() {
    var readyState = sendChannel.readyState;
    trace('Send channel state is: ' + readyState);
    // If channel ready, enable user's input
    if (readyState == "open") {
        game.startCommunication();
        // dataChannelSend.disabled = false;
        // dataChannelSend.focus();
        // dataChannelSend.placeholder = "";
    } else {
        //dataChannelSend.disabled = true;
    }
}

function handleReceiveChannelStateChange() {
    var readyState = receiveChannel.readyState;
    trace('Receive channel state is: ' + readyState);
    // If channel ready, enable user's input
    if (readyState == "open") {
        game.startCommunication();
        // dataChannelSend.disabled = false;
        // dataChannelSend.focus();
        // dataChannelSend.placeholder = "";
    } else {
        // dataChannelSend.disabled = true;
    }
}




// ICE candidates management
function handleIceCandidate(event) {
    //console.log('handleIceCandidate event: ', event);
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate});
    } else {
        //console.log('End of candidates.');
    }
}

// Create Offer
function doCall() {
    console.log('Creating Offer...');
    pc.createOffer(setLocalAndSendMessage, onSignalingError, sdpConstraints);
}

// Signalling error handler
function onSignalingError(error) {
    console.log('Failed to create signaling message : ' + error.name);
}

// Create Answer
function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer(setLocalAndSendMessage, onSignalingError, sdpConstraints);  
}

// Success handler for both createOffer()
// and createAnswer()
function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    sendMessage(sessionDescription);
}

/////////////////////////////////////////////////////////
// Remote stream handlers...

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    attachMediaStream(remoteVideo, event.stream);
    remoteStream = event.stream;
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}
/////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////
// Clean-up functions...

function hangup() {
    console.log('Hanging up.');
    stop();
    sendMessage('bye');
}

function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
    remoteVideo.src = "";
}

function stop() {
    isStarted = false;
    if (pc) pc.close();  
    pc = null;
}

///////////////////////////////////////////



