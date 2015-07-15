window.onload = function(){
    var visualizer = new Visualizer();
    visualizer.init("audio/testSong.mp3");
}

var Visualizer = function(){
    this.scene; 
    this.camera;
    this.controls;
    this.renderer;
    this.audioContext;
    this.source;
    this.analyser;
    this.group;
}

Visualizer.prototype = {
  
    /**
    * init() prepares the audio and calls
    * other preparation functions
    */
    init: function(url){
        // Browser Vendor Issues
        window.requestAnimationFrame = window.requestAnimationFrame 
          || window.webkitRequestAnimationFrame 
          || window.mozRequestAnimationFrame;
        window.AudioContext = window.AudioContext 
          || window.webkitAudioContext 
          || window.mozAudioContext;

        try {
            this.audioContext = new AudioContext();
            console.log("Audio context created")
        }
        catch (e) {
            console.log("Audio context is not supported")
        }

        this._prepareScene();
        this._loadAudio(url);
        this._render();
    },

    /**
    * _prepareScene() creates the scene
    * and adds basic functionality
    */
    _prepareScene: function(){
        // Scene
        scene = new THREE.Scene();

        // Camera
        camera = new THREE.PerspectiveCamera(45, 
            window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 100;
        scene.add(camera);

        // Controls
        controls = new THREE.TrackballControls(camera);

        // Renderer
        renderer = new THREE.WebGLRenderer({
          antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Add Cubes
        this.group = new THREE.Group();
        for ( var i = 0; i < 10; i++){
            var mesh = new THREE.Mesh(
                new THREE.BoxGeometry(10,10,10),
                new THREE.MeshBasicMaterial()
                );
            mesh.position.x = (i*15) - 75;

            this.group.add(mesh);
        }
        scene.add(this.group);
        console.log(this.group);

        // Add Listeners
        window.addEventListener('resize', this._onWindowResize, false);

        // Render and animate
        renderer.render(scene,camera);
        window.requestAnimationFrame(this._render);
    },

    /**
    * _onWindowResize() handles resizing events 
    * for the renderer and camera
    */
    _onWindowResize: function(){ 
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);       
    },

    _loadAudio: function(url){
        if(!this.audioContext){
            console.log("Audio context not supported, nothing loaded");
            return;
        }

        var that = this,
            xhr = new XMLHttpRequest;

        // Load Audio from url
        xhr.open('GET', url, true);

        // Necessary when loading from an XMLHttpRequest's
        // response.
        xhr.responseType = "arraybuffer";

        xhr.onload = function(){
            result = xhr.response;

            // decodeAudioData() asynchronously decodes the audio file 
            // data contained in the ArrayBuffer.
            that.audioContext.decodeAudioData(result, function(buffer){
                that.source = that.audioContext.createBufferSource();
                that.analyser = that.audioContext.createAnalyser();

                // Connects source to analyser
                that.source.connect(that.analyser);
                // Connects analyser to the speaker
                that.analyser.connect(that.audioContext.destination);
                // Assigns the buffer to the buffer source node
                that.source.buffer = buffer;
                that.source.start(0);
            });
        }
        xhr.onerror = function(){
            console.log("failed to load the audio");
        }
        xhr.send();
    },

    _render: function(){
       
        var that = this;

        var animate = function(){
            controls.update();
            renderer.render(scene,camera);
            // console.log(that.analyser);
            if(that.analyser){
                var freqArray = new Uint8Array(that.analyser.frequencyBinCount);
                var timeArray = new Uint8Array(that.analyser.fftSize);
                that.analyser.getByteFrequencyData(freqArray);
                that.analyser.getByteTimeDomainData(timeArray);
                var freqStep = Math.round(freqArray.length / 10);
                var timeStep = Math.round(freqArray.length / 10);


                for(var i=0; i < 10; i++){
                    freqValue = freqArray[i*freqStep];
                    timeValue = timeArray[i*timeStep];
                    that.group.children[i].position.y = freqValue;
                    that.group.children[i].material.color = 
                        new THREE.Color((timeValue - 120) / 10, 
                            (timeValue - 120) / 10, 
                            (timeValue - 120) / 10);
                    // that.group.children[i].position.z = timeValue/3;
                    // console.log(timeValue);
                }
            }
            requestAnimationFrame(animate);
        }
        animate();
    }
}

