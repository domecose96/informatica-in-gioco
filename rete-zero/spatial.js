/* Occupazione del suolo e limiti condivisi della camera. */
(function(root){
  'use strict';
  const cameraLimits=Object.freeze({minZoom:1,maxZoom:2.15,minElevation:.72,maxElevation:1.2,maxPanX:32,maxPanZ:27});
  function circleIntersectsBox(x,z,r,box,margin=0){
    const nearestX=Math.max(box.minX,Math.min(x,box.maxX));
    const nearestZ=Math.max(box.minZ,Math.min(z,box.maxZ));
    return (x-nearestX)**2+(z-nearestZ)**2<(r+margin)**2;
  }
  function createLayout(){
    const boxes=[],trees=[];
    return {
      reserve(x,z,width,depth){boxes.push({minX:x-width/2,maxX:x+width/2,minZ:z-depth/2,maxZ:z+depth/2});},
      canPlant(x,z,radius){return !boxes.some(box=>circleIntersectsBox(x,z,radius,box,.35))&&!trees.some(tree=>Math.hypot(x-tree.x,z-tree.z)<radius+tree.radius+.2);},
      plant(x,z,radius){if(!this.canPlant(x,z,radius))return false;trees.push({x,z,radius});return true;},
      treeOverlaps(){return trees.reduce((count,tree)=>count+boxes.filter(box=>circleIntersectsBox(tree.x,tree.z,tree.radius,box)).length,0);},
      get treeCount(){return trees.length;}
    };
  }
  const api={cameraLimits,circleIntersectsBox,createLayout};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RZSpatial=api;
})(typeof globalThis!=='undefined'?globalThis:this);
