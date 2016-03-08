'use strict';

//Look after different browser vendors' ways of calling the getUserMedia() API method:
//Opera --> getUserMedia
//Chrome --> webkitGetUserMedia
//Firefox --> mozGetUserMedia
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// Clean-up function:
// Collect garbage before unloading browser's window
window.onbeforeunload = function(e){
  hangup();
}

// Flags
var isChannelReady;
var isInitiator = false;
var isStarted = false;
var turnReady;

// HTML5 <video> elements
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

// WebRTC data structures
// Streams
var localStream;
var remoteStream;
// Peer Connection
var pc;

// Peer Connection ICE protocol configuration (either Firefox or Chrome)
var pc_config = webrtcDetectedBrowser === 'firefox' ?
  {'iceServers':[{'urls':'stun:23.21.150.121'}]} : // IP address
  {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

// Peer Connection contraints: (i) use DTLS; (ii) use data channel  
var pc_constraints = {
  'optional': [
    {'DtlsSrtpKeyAgreement': true},
    {'RtpDataChannels': true}
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

var room = location.pathname.substring(1);
if (room === '') {
  room = prompt('Enter room name:');
  //room = 'foo';
  document.querySelector('#roomTitle').innerHTML += room;

} else {
  //
}

if (location.hostname != "localhost") {
  var socket = io.connect(location, {'sync disconnect on unload': true, 'secure': true});
}else{
  var socket = io.connect();
}

if (room !== '') {
  console.log('Create or join room', room);
  socket.emit('create or join', room);
}

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
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

// Handle 'joined' message coming from the server:
// this is the second peer joining the channel
socket.on('joined', function (room){
  console.log('This peer has joined room ' + room);
  isChannelReady = true;
});

// Server-sent log message 
socket.on('log', function (array){
  console.log.apply(console, array);
});

////////////////////////////////////////////////

// Send message to the other peer via de signalling channel
function sendMessage(message){
  console.log('Client sending message: ', message);
/*if (typeof message === 'object') {
    message = JSON.stringify(message);
  }*/
  socket.emit('message', message);
}

function handleAddIceCandidate(){
  //console.log("addIceCandidate success");
}

function handleAddIceCandidateError(e){
  console.log("addIceCandidate error: " + e);
}
// receive message from the other peer via the signaling server
socket.on('message', function (message){
  console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate, handleAddIceCandidate, handleAddIceCandidateError);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////

function handleUserMedia(stream) {
  console.log('Adding local stream.');
  localVideo.src = window.URL.createObjectURL(stream);
  localStream = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

function handleUserMediaError(error){
  console.log('getUserMedia error: ', error);
}

var constraints = {video: true,
                   audio: true};
navigator.getUserMedia(constraints, handleUserMedia, handleUserMediaError);
console.log('Getting user media with constraints', constraints);

/*if (location.hostname != "localhost") {
  requestTurn();
}*/
//requestTurn();

function maybeStart() {
  if (!isStarted && typeof localStream != 'undefined' && isChannelReady) {
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

/////////////////////////////////////////////////////////

// Peer Connection management
function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pc_config, pc_constraints);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
      return;
  }
}


function handleIceCandidate(event) {
  console.log('handleIceCandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate});
  } else {
    console.log('End of candidates.');
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteStream = event.stream;
}

function handleCreateOfferError(event){
  console.log('createOffer() error: ', e);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError, sdpConstraints);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer(setLocalAndSendMessage, handleCreateAnswerError, sdpConstraints);
}

function handleCreateAnswerError(event){
  console.log('createAnswer() error: ', e);
}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  //sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message' , sessionDescription);
  sendMessage(sessionDescription);
}

function requestTurn() {

  var iceServers = [];


  iceServers.push({
      url: 'stun:stun.l.google.com:19302'
  });

  iceServers.push({
      url: 'stun:stun.anyfirewall.com:3478'
  });

  iceServers.push({
      url: 'turn:turn.bistri.com:80',
      credential: 'homeo',
      username: 'homeo'
  });

  iceServers.push({
      url: 'turn:turn.anyfirewall.com:443?transport=tcp',
      credential: 'webrtc',
      username: 'webrtc'
  });

  var rtcConfig = {
      iceServers: iceServers,
      iceTransports: 'all'
  };

  console.log("request TURN server. Candidates: " + iceServers);

  pc_config = iceServers;

  /*var turnExists = false;
  $.ajax({
    url: "https://service.xirsys.com/ice",
    data: {
        ident: "sorube",
        secret: "3ba84e92-dc9f-11e5-be0d-27778885886f",
        domain: "www.silvia-battleship.com",
        application: "battleship",
        room: 'room1',
        secure: 1
    },
    success: function (data, status) {
        // data.d is where the iceServers object lives
        pc_config = data.d;
        console.log(pc_config);
    }
  });*/
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  remoteStream = event.stream;
  remoteVideo.play();
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  // isAudioMuted = false;
  // isVideoMuted = false;
  if(pc) pc.close();
  pc = null;
}

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
/*function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
        mLineIndex = i;
        break;
      }
  }
  if (mLineIndex !== 'undefined') {
    return sdp;
  } else{

  // If Opus is available, set it as the default in m line.
    for (i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('opus/48000') !== -1) {
        var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
        if (opusPayload) {
          sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
        }
        break;
      }
    }
    // Remove CN in m line and sdp.
    sdpLines = removeCN(sdpLines, mLineIndex);

    sdp = sdpLines.join('\r\n');
    return sdp;
  }
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length-1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}*/
