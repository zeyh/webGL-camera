class Scene {
    constructor(gl, programInfo, projectionMatrix, isForShadow,shadowBuffer, shadowMapTransformMatrix) {
      this.gl = gl;
      this.isForShadow = isForShadow;
      this.shadowBuffer = shadowBuffer;
      this.shadowMapTransformMatrix = shadowMapTransformMatrix;
      this.shadowBuffer = shadowBuffer;
      this.shadowMapTransformMatrix = shadowMapTransformMatrix;
  
      this.sunDirectionalVector = [0.0, 0.0, 0.0];
      this.headlightPosition1 = [0.0, 0.0, 0.0];
      this.headlightPosition2 = [0.0, 0.0, 0.0];
      const planetDiskFigure = new Disk(gl, programInfo); 
      
      this.planetDiskNode = new SceneNode(projectionMatrix, planetDiskFigure);
      mat4.rotate(this.planetDiskNode.localMatrix, this.planetDiskNode.localMatrix, Math.PI/4, [-1.0, 0.0, 0.0]);
      mat4.rotate(this.planetDiskNode.localMatrix, this.planetDiskNode.localMatrix, Math.PI/4, [0, 1.0, 0]);
   
      mat4.translate(this.planetDiskNode.localMatrix, this.planetDiskNode.localMatrix, [0.0, 0.0, 0.0]);       
      
      const treeFigure = new Tree(gl, programInfo);
      this.treeNode1 = new SceneNode(projectionMatrix, treeFigure);
      mat4.translate(this.treeNode1.localMatrix, this.treeNode1.localMatrix, [-0.15, 0.10, 0.1]);
      mat4.scale(this.treeNode1.localMatrix, this.treeNode1.localMatrix, [0.1, 0.1, 0.1]);
      this.treeNode1.setParent(this.planetDiskNode);
  
      this.treeNode4 = new SceneNode(projectionMatrix, treeFigure);
      mat4.translate(this.treeNode4.localMatrix, this.treeNode4.localMatrix, [0.30, 0.10, 0.43]);
      mat4.scale(this.treeNode4.localMatrix, this.treeNode4.localMatrix, [0.15, 0.15, 0.15]);
      this.treeNode4.setParent(this.planetDiskNode);
  
      const carFigure = new Car(gl, programInfo);
      this.carNode = new SceneNode(projectionMatrix, carFigure);
      mat4.translate(this.carNode.localMatrix, this.carNode.localMatrix, [-0.35, .085, 0.0]);
      mat4.scale(this.carNode.localMatrix, this.carNode.localMatrix, [0.05, 0.05, 0.05]);
      this.carNode.setParent(this.planetDiskNode);
  
      const sunFigure = new Sun(gl, programInfo);
      this.sunNode = new SceneNode(projectionMatrix, sunFigure);
      this.sunNode.setParent(this.planetDiskNode);
      mat4.translate(this.sunNode.localMatrix, this.sunNode.localMatrix, [0.0, 0.8, 0.0]);
      mat4.scale(this.sunNode.localMatrix, this.sunNode.localMatrix, [0.02, 0.02, 0.02]);
  
      const moonFigure = new Moon(gl, programInfo);
      this.moonNode = new SceneNode(projectionMatrix, moonFigure);
      this.moonNode.setParent(this.planetDiskNode);
      mat4.translate(this.moonNode.localMatrix, this.moonNode.localMatrix, [0.0, 0.8, 0.0]);
      mat4.scale(this.moonNode.localMatrix, this.moonNode.localMatrix, [0.02, 0.02, 0.02]);
      
      const lightPoleFigure = new LightPole(gl, programInfo);
      this.lightPoleNode = new SceneNode(projectionMatrix, lightPoleFigure);
      this.lightPoleNode.setParent(this.planetDiskNode);
  
      this.sceneNodes = [
        this.planetDiskNode,
        this.treeNode1,
        this.treeNode4,
        this.carNode,
        this.sunNode,
        this.lightPoleNode
      ];
    }
  
    update(time) {
      const carRotationMatrix = mat4.create();
      mat4.fromYRotation(carRotationMatrix, time * .7);
      mat4.multiply(this.carNode.localMatrix, carRotationMatrix, this.carNode.localMatrix);
  
      const sunRotationMatrix = mat4.create();
      mat4.fromXRotation(sunRotationMatrix, time * .7);
      mat4.multiply(this.sunNode.localMatrix, sunRotationMatrix, this.sunNode.localMatrix);
  
      const moonRotationMatrix = mat4.create();
      mat4.fromXRotation(moonRotationMatrix, time * .7);
      mat4.multiply(this.moonNode.localMatrix, moonRotationMatrix, this.moonNode.localMatrix);
      
      mat4.getTranslation(this.sunDirectionalVector, this.sunNode.localMatrix);
      const [x1, y1, z1] = this.carNode.objectToDraw.headlightTranslation1;
      const translation1 = vec3.fromValues(x1, y1, z1);
      vec3.add(translation1, translation1, [0.0, 0.0, 2.3]);
      const [x2, y2, z2] = this.carNode.objectToDraw.headlightTranslation2;
      let translation2 = vec3.fromValues(x2, y2, z2);
      vec3.add(translation2, translation2, [0.0, 0.0, 2.3]);
      mat4.getTranslation(this.headlightPosition1,
        Car.getHeadlightMatrix(this.carNode.worldMatrix, translation1));
      mat4.getTranslation(this.headlightPosition2,
        Car.getHeadlightMatrix(this.carNode.worldMatrix, translation2));
    }
  
    draw() {
      this.planetDiskNode.updateWorldMatrix();
      mat4.getTranslation(this.sunDirectionalVector, this.sunNode.worldMatrix);
      const newVec = vec3.create();
      vec3.subtract(newVec, [0, 0, 0], this.sunDirectionalVector);
      vec3.scale(newVec, newVec, 0.1);
      this.sceneNodes.forEach((node) => {
        
        if(node.objectToDraw.constructor.name == "Sun"){
          var uni = this.gl.getUniformLocation(node.objectToDraw.programInfo.program, "uSunUp");
          var isUp = node.localMatrix[13] > 0;
          if(!isUp){
              node = this.moonNode;
          } 
          this.gl.uniform1i(uni, isUp);
        }
        if (this.isForShadow) {
          mat4.lookAt(node.projectionMatrix, newVec, [0, 0.1, -0.1], [0, 1, 0]);
          node.draw(this.sunDirectionalVector, this.headlightPosition1, this.headlightPosition2, null,
            this.shadowMapTransformMatrix);
        } 
        else {
          node.draw(this.sunDirectionalVector, this.headlightPosition1, this.headlightPosition2,
            this.shadowBuffer.depth_buffer, this.shadowMapTransformMatrix);
        }
      });
    }
  }
  
  class SceneNode {
    constructor(projectionMatrix, objectToDraw) {
      this.projectionMatrix = projectionMatrix;
      this.objectToDraw = objectToDraw;
      this.parent = null;
      this.children = [];
      this.localMatrix = mat4.create();
      this.worldMatrix = mat4.create();
    }
  
    setParent(parent) {
      if (this.parent) {
        const ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) {
          this.parent.children.splice(ndx, 1);
        }
      }
  
      if (parent) {
        parent.children.push(this);
      }
  
      this.parent = parent;
    }
  
    updateWorldMatrix(parentWorldMatrix) {
      if (parentWorldMatrix) {
        mat4.multiply(this.worldMatrix, parentWorldMatrix, this.localMatrix);
      } else {
        mat4.copy(this.worldMatrix, this.localMatrix);
      }
  
      this.children.forEach((child) => {
        child.updateWorldMatrix(this.worldMatrix);
      });
    }
  
    draw(sunDirectionalVector, headlightPosition1, headlightPosition2, shadowBuffer, shadowMapTransformMatrix) {
      this.objectToDraw.draw(this.projectionMatrix, this.worldMatrix, sunDirectionalVector, headlightPosition1,
        headlightPosition2, shadowBuffer, shadowMapTransformMatrix);
    }
  }
  
  
  
  