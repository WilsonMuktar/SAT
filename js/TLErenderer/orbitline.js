function orbitline(viewer,positions,positions1,positions2,positions3,width,theColor){
	this.viewer = viewer;
	this.positions = positions;
	this.positions1 = positions1;
	this.positions2 = positions2;
	this.positions3 = positions3;
	this.width = width;
	this.color = theColor;
	
	this.line = viewer.entities.add({
		polyline : {
			positions : this.positions,
			width : this.width,
			material : this.color
		},
		show : false,
		allowPicking: false
	});
	this.line1 = viewer.entities.add({
		polyline : {
			positions : this.positions1,
			width : this.width,
			material : this.color
		},
		show : false,
		allowPicking: false
	});
	this.line2 = viewer.entities.add({
		polyline : {
			positions : this.positions2,
			width : this.width,
			material : this.color
		},
		show : false,
		allowPicking: false
	});
	this.line3 = viewer.entities.add({
		polyline : {
			positions : this.positions3,
			width : this.width,
			material : this.color
		},
		show : false,
		allowPicking: false
	});
	
}

orbitline.prototype.drawline = function(visibility){
	this.line.show = visibility;
	this.line1.show = visibility;
	this.line2.show = visibility;
	this.line3.show = visibility;
}
 
orbitline.prototype.setColor = function(Color){
	this.color = Color;
	this.line.polyline.material = Color;
	this.line1.polyline.material = Color;
	this.line2.polyline.material = Color;
	this.line3.polyline.material = Color;
}

orbitline.prototype.setWidth = function(width){
	this.width = width;
	this.line.polyline.width = width;
	this.line1.polyline.width = width;
	this.line2.polyline.width = width;
	this.line3.polyline.width = width;
}

orbitline.prototype.setOrbitPositions = function(positions,positions1,positions2,positions3){
	this.positions = positions;
	this.positions1 = positions1;
	this.positions2 = positions2;
	this.positions3 = positions3;
	this.line.polyline.positions = positions;
	this.line1.polyline.positions = positions1;
	this.line2.polyline.positions = positions2;
	this.line3.polyline.positions = positions3;
}

orbitline.prototype.removeall = function(){
	this.viewer.entities.remove(this.line);
	this.viewer.entities.remove(this.line1);
	this.viewer.entities.remove(this.line2);
	this.viewer.entities.remove(this.line3);
}
