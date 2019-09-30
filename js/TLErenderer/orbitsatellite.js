function orbitsatellite(viewer,name,position){
	this.viewer = viewer;
	this.name = name;
	this.position = position;
	this.satellite = viewer.entities.add({
		name : this.name,
		position : this.position,
		point :{
			//image : 'images/target.png',
			//scale: 0.1,
			color : Cesium.Color.GREEN,
			pixelSize : 10,
			eyeOffset : new Cesium.ConstantProperty(new Cesium.Cartesian3(0,0, -150000)),
		},
		label :{
			text : this.name,
			scale : 0.5,
			eyeOffset : new Cesium.ConstantProperty(new Cesium.Cartesian3(0,0, -150000)),
			fillColor  : Cesium.Color.WHITE,
			outlineWidth : 0,
			outlineColor : Cesium.Color.RED
		},
		show : true,
		allowPicking: true
	});
	this.satellite.label.pixelOffset = new Cesium.Cartesian2(30.0, -25.0);
	this.satellite.label.font = 'bold 20px/12px Arial,sans-serif';
}

orbitsatellite.prototype.drawSatellite = function(visibility){
	this.satellite.label.show = visibility;
}

orbitsatellite.prototype.setSatelliteAttribute = function(position){
	this.satellite.position = position;
}

orbitsatellite.prototype.getSatelliteLabel = function(){
	return this.satellite.label;
}

orbitsatellite.prototype.removeall = function(){
	this.viewer.entities.remove(this.satellite);
}