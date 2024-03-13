import {
  HMSReactiveStore,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectPeers
} from '@100mslive/hms-video-store';

class VideoPresentation {
  constructor(node: HTMLElement) {
    this.node = node;
    // Initialize HMS Store
    this.hmsManager = new HMSReactiveStore();
    this.hmsManager.triggerOnSubscribe();
    this.hmsStore = this.hmsManager.getStore();
    this.hmsActions = this.hmsManager.getHMSActions();

    this.buildHtml(node);
    // this.initialize();
  }

  node: HTMLElement;
  hmsManager: any;
  hmsStore: any;
  hmsActions: any;
  form: any;
  joinBtn: any;
  conference: any;
  peersContainer: any;
  leaveBtn: any;
  muteAudio: any;
  muteVideo: any;
  controls: any;

  initialize() {
    // Joining the room
    this.joinBtn.onclick = async () => {
      const userName = (this.node.querySelector('#name') as HTMLInputElement)
        .value;
      const roomCode = (
        this.node.querySelector('#room-code') as HTMLInputElement
      ).value;
      // use room code to fetch auth token
      const authToken = await this.hmsActions.getAuthTokenByRoomCode({
        roomCode
      });
      // join room using username and auth token
      this.hmsActions.join({
        userName,
        authToken
      });
    };

    // Cleanup if user refreshes the tab or navigates away
    window.onunload = window.onbeforeunload = this.leaveRoom;
    this.leaveBtn.onclick = this.leaveRoom;

    // Reactive state - renderPeers is called whenever there is a change in the peer-list
    this.hmsStore.subscribe(this.renderPeers, selectPeers);

    // Mute and unmute audio
    this.muteAudio.onclick = () => {
      const audioEnabled = !this.hmsStore.getState(selectIsLocalAudioEnabled);
      this.hmsActions.setLocalAudioEnabled(audioEnabled);
      this.muteAudio.textContent = audioEnabled ? 'Mute' : 'Unmute';
    };

    // Mute and unmute video
    this.muteVideo.onclick = () => {
      const videoEnabled = !this.hmsStore.getState(selectIsLocalVideoEnabled);
      this.hmsActions.setLocalVideoEnabled(videoEnabled);
      this.muteVideo.textContent = videoEnabled ? 'Hide' : 'Unhide';
      // Re-render video tile
      this.renderPeers();
    };

    // Listen to the connection state
    this.hmsStore.subscribe(this.onConnection, selectIsConnectedToRoom);
  }

  async leaveRoom() {
    await this.hmsActions.leave();
    this.peersContainer.innerHTML = '';
  }

  // Helper function to create html elements
  createElementWithClass(tag: any, className: any) {
    const newElement = document.createElement(tag);
    newElement.className = className;
    return newElement;
  }

  // Render a single peer
  renderPeer(peer: { name: any; videoTrack: any }) {
    const peerTileDiv = this.createElementWithClass('div', 'peer-tile');
    const videoElement = this.createElementWithClass('video', 'peer-video');
    const peerTileName = this.createElementWithClass('span', 'peer-name');
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsinline = true;
    peerTileName.textContent = peer.name;
    this.hmsActions.attachVideo(peer.videoTrack, videoElement);
    peerTileDiv.append(videoElement);
    peerTileDiv.append(peerTileName);
    return peerTileDiv;
  }

  // Display a tile for each peer in the peer list
  renderPeers() {
    this.peersContainer.innerHTML = '';
    const peers = this.hmsStore.getState(selectPeers);

    peers.forEach((peer: { name: any; videoTrack: any }) => {
      if (peer.videoTrack) {
        this.peersContainer.append(this.renderPeer(peer));
      }
    });
  }

  // Showing the required elements on connection/disconnection
  onConnection(isConnected: any) {
    if (isConnected) {
      this.form.classList.add('hide');
      this.conference.classList.remove('hide');
      this.leaveBtn.classList.remove('hide');
      this.controls.classList.remove('hide');
    } else {
      this.form.classList.remove('hide');
      this.conference.classList.add('hide');
      this.leaveBtn.classList.add('hide');
      this.controls.classList.add('hide');
    }
  }

  buildHtml(node: HTMLElement) {
    const container = document.createElement('div');

    // Create header element
    const header = document.createElement('header');

    // Create button element
    const button = document.createElement('button');
    button.id = 'leave-btn';
    button.classList.add('btn-danger', 'hide');
    button.textContent = 'Leave Room';

    // Append button to header
    header.appendChild(button);

    // Append header to the body or any other parent element
    container.appendChild(header);

    // Create form element
    const form = document.createElement('form');
    form.id = 'join';

    // Create h2 element
    const heading = document.createElement('h2');
    heading.textContent = 'Join Room';

    // Create div for input container 1
    const inputContainer1 = document.createElement('div');
    inputContainer1.classList.add('input-container');

    // Create input element for name
    const nameInput = document.createElement('input');
    nameInput.id = 'name';
    nameInput.type = 'text';
    nameInput.name = 'username';
    nameInput.placeholder = 'Your name';

    // Append name input to input container 1
    inputContainer1.appendChild(nameInput);

    // Create div for input container 2
    const inputContainer2 = document.createElement('div');
    inputContainer2.classList.add('input-container');

    // Create input element for room code
    const roomCodeInput = document.createElement('input');
    roomCodeInput.id = 'room-code';
    roomCodeInput.type = 'text';
    roomCodeInput.name = 'roomCode';
    roomCodeInput.placeholder = 'Room code';

    // Append room code input to input container 2
    inputContainer2.appendChild(roomCodeInput);

    // Create button element
    const joinButton = document.createElement('button');
    joinButton.type = 'button';
    joinButton.id = 'join-btn';
    joinButton.classList.add('btn-primary');
    joinButton.textContent = 'Join';

    // Append all elements to the form
    form.appendChild(heading);
    form.appendChild(inputContainer1);
    form.appendChild(inputContainer2);
    form.appendChild(joinButton);

    // Append form to the body or any other parent element
    container.appendChild(form);

    // Create div element for the conference section
    const conferenceDiv = document.createElement('div');
    conferenceDiv.id = 'conference';
    conferenceDiv.classList.add('conference-section', 'hide');

    // Create h2 element for the conference section heading
    const conferenceHeading = document.createElement('h2');
    conferenceHeading.textContent = 'Conference';

    // Create div element for the peers container
    const peersContainerDiv = document.createElement('div');
    peersContainerDiv.id = 'peers-container';

    // Append the conference heading and peers container to the conference section div
    conferenceDiv.appendChild(conferenceHeading);
    conferenceDiv.appendChild(peersContainerDiv);

    // Append the conference section div to the body or any other parent element
    container.appendChild(conferenceDiv);

    // Create div element for the controls section
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'controls';
    controlsDiv.classList.add('control-bar', 'hide');

    // Create button element for muting audio
    const muteAudioButton = document.createElement('button');
    muteAudioButton.id = 'mute-aud';
    muteAudioButton.classList.add('btn-control');
    muteAudioButton.textContent = 'Mute';

    // Create button element for muting video
    const muteVideoButton = document.createElement('button');
    muteVideoButton.id = 'mute-vid';
    muteVideoButton.classList.add('btn-control');
    muteVideoButton.textContent = 'Hide';

    // Append the buttons to the controls section div
    controlsDiv.appendChild(muteAudioButton);
    controlsDiv.appendChild(muteVideoButton);

    // Append the controls section div to the body or any other parent element
    container.appendChild(controlsDiv);

    node.appendChild(container);

    setTimeout(() => {
      // HTML elements
      this.form = document.getElementById('join');
      this.joinBtn = document.getElementById('join-btn');
      this.conference = document.getElementById('conference');
      this.peersContainer = document.getElementById('peers-container');
      this.leaveBtn = document.getElementById('leave-btn');
      this.muteAudio = document.getElementById('mute-aud');
      this.muteVideo = document.getElementById('mute-vid');
      this.controls = document.getElementById('controls');
      console.log('this.joinBtn2', this.joinBtn);
      this.initialize();
    }, 2000);

    console.log('this.joinBtn', this.joinBtn);
  }
}

export default VideoPresentation;