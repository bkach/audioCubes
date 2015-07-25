var DynamicMesh = function(){
  this.rows;
  this.numVertsFaces;
  this.size;
  this.mesh;
  this.currentRow = 0;
};

DynamicMesh.prototype = {
  init: function(rows,columns,size){
    this.rows = rows;
    this.numVertsFaces = columns * (rows * 2);
    this.size = size;
    
    var geo = new THREE.Geometry();
    for(i=0; i < this.numVertsFaces; i++){
      geo.vertices.push(new THREE.Vector3(0,0,0));
      geo.faces.push(new THREE.Face3(0,0,0));
    }

    this.mesh = new THREE.Mesh( geo, new THREE.MeshNormalMaterial() );

    this.mesh.frustumCulled = false;
  },

  updateGeometry:  function(freqArray){
    if(this.currentRow == 0){
       // create initial points - c for column
       for(var c=0; c < this.rows+1; c++){
         this.mesh.geometry.vertices[c] = new THREE.Vector3(c * this.size, 0, 0);
       }
       this.currentRow++;
     }
     else{

       freqStep = Math.round(freqArray.length / ((this.rows+1)/2));

       // Create points
       for(var c=0; c < this.rows+1; c++){
         var initialIndex = (this.rows+1) * this.currentRow + c;

         var freqSample = c < ((this.rows+1) / 2)?
           Math.floor((this.rows+1) / 2) - c : c - Math.floor((this.rows+1)/2);

         this.mesh.geometry.vertices[initialIndex] = new THREE.Vector3(
             (this.size*c),
             freqArray[freqSample*freqStep],
             -this.currentRow*this.size);
       }
       // Create faces
       for(var c=0; c < this.rows; c++){
         var bottomLeft = (this.currentRow*(this.rows+1)) + c + 1; //8
         var bottomRight = (this.currentRow*(this.rows+1)) + c; // 7
         var upperLeft = ((this.currentRow-1) * (this.rows+1) + c + 1); //1
         var upperRight = ((this.currentRow-1) * (this.rows+1) + c); // 0

         this.mesh.geometry.faces[(2*this.rows*(this.currentRow-1)+(2*c))%this.numVertsFaces] 
           = new THREE.Face3(
             upperLeft,
             bottomLeft,
             upperRight
             );
         this.mesh.geometry.faces[(2*this.rows*(this.currentRow-1)+(2*c)+1)%this.numVertsFaces]
           = new THREE.Face3(
             bottomLeft,
             bottomRight,
             upperRight
           );
       }
       this.mesh.geometry.verticesNeedUpdate = true;
       this.mesh.geometry.elementsNeedUpdate = true;
       this.mesh.geometry.normalsNeedUpdate = true;
       this.mesh.geometry.computeFaceNormals();
       // mesh.geometry.computeVertexNormals();
       this.currentRow++;

       this.mesh.position.z += this.size;
     } 
   }
}
