var Visualizer = function(){
    this.scene; 
    this.camera;
    this.controls;
    this.renderer;
    this.audioContext;
    this.audioElement;
    this.analyser;
    this.dynamicMesh;
    this.freqMode = true;
    this.playing = false;
    this.rows = 300;
    this.columns = 300;
    this.size = 5;
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
        camera.position.y = (this.columns* this.size) / 2;
        camera.position.z = (this.columns* this.size) / 2;
        scene.add(camera);

        var axisHelper = new THREE.AxisHelper( 500 );
        scene.add( axisHelper );

        // Controls
        controls = new THREE.TrackballControls(camera);

        // Renderer
        renderer = new THREE.WebGLRenderer({
          antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xf4f4f4);
        document.body.appendChild(renderer.domElement);

        // Add Mesh
        this.dynamicMesh = new DynamicMesh();
        this.dynamicMesh.init(this.rows,this.columns,this.size);
        this.dynamicMesh.mesh.position.x = -(this.rows/2) * this.size;
        scene.add(this.dynamicMesh.mesh);

        // Add Listeners
        window.addEventListener('resize', this._onWindowResize, false);

        var that = this;
        window.addEventListener('keyup', function(event){
          if(event.keyCode == 32){
            if(that.playing){
              that.audioElement.pause();
              that.playing = false;
            }
            else{
              that.audioElement.play();
              that.playing = true;
            }
          }
          else if(event.keyCode == 84){
            if(that.freqMode){
              that.freqMode = false;
            }
            else{
              that.freqMode = true;
            }
          }
        }, false);

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

        this.audioElement = new Audio(url);
        var source = this.audioContext.createMediaElementSource(this.audioElement);
        this.analyser = this.audioContext.createAnalyser();

        // Connects source to analyser
        source.connect(this.analyser);
        // Connects analyser to the speaker
        source.connect(this.audioContext.destination);

        this.audioElement.play();
        this.playing = true;
    },

    _render: function(){
       
        var that = this;

        var animate = function(){
            controls.update();
            renderer.render(scene,camera);
            if(that.analyser){
              if(that.freqMode){
                var freqArray = new Uint8Array(that.analyser.frequencyBinCount);
                that.analyser.getByteFrequencyData(freqArray);
                that.dynamicMesh.updateGeometry(freqArray);
              }
              else
              {
                var timeArray = new Uint8Array(that.analyser.fftSize);
                that.analyser.getByteTimeDomainData(timeArray);
                that.dynamicMesh.updateGeometry(timeArray);
              }
            }
            requestAnimationFrame(animate);
        }
        animate();
    }
}

