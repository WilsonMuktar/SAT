function orbitcone(viewer,position,mGroundRange,mCeiling,theColor){
	this.viewer = viewer;
	this.position = position;
	this.groundrange = mGroundRange;
	this.ceiling = mCeiling;
	this.color = theColor;
	
	this.changeConePosition();
	
	this.cone = viewer.entities.add({
		position : this.position,
		cylinder : {
			length : this.ceiling,
			topRadius : 0.0,
			bottomRadius : this.groundrange,
			material : this.color,
			slices : 32,
			fill : true,
			outline : false,
			outlineColor : this.color,
			numberOfVerticalLines : 4,
		},
		show : false,
		allowPicking: false
	});
}

orbitcone.prototype.changeConePosition = function(){
	var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(this.position);
	var lon = Cesium.Math.toDegrees(cartographic.longitude);
	var lat = Cesium.Math.toDegrees(cartographic.latitude); 
	var alt = cartographic.height - this.ceiling*0.49;
	this.position = Cesium.Cartesian3.fromDegrees(lon,lat,alt);
}

orbitcone.prototype.drawCone = function(visibility){
	this.cone.show = visibility;
}

orbitcone.prototype.setHeight = function(height){
	var rh = calcConeRadiusHeightFromAlt(height);
	this.ceiling = rh[1];
	this.setGroundRange(rh[0]);
	this.cone.cylinder.length = this.ceiling;
	this.cone.cylinder.bottomRadius = this.groundrange;
}

orbitcone.prototype.setGroundRange = function(Groundrange){
	this.groundrange = Groundrange;
	this.cone.cylinder.bottomRadius = this.groundrange;
}

orbitcone.prototype.setColor = function(Color){
	this.color = color;
	this.cone.cylinder.material = this.color;
}
 
orbitcone.prototype.setFill = function(fill){
	this.cone.cylinder.fill = fill;
	this.cone.cylinder.outline = true;
}

orbitcone.prototype.setPosition = function(position){
	if(this.position==position)
		return;
	this.position = position;
	this.changeConePosition();
	this.cone.position = this.position;
	
}

	function calcConeRadiusHeightFromAlt(alt)
    {
        var rh = [];
        var earthRad = AstroConst.R_Earth;
        var lambda0 = Math.acos(earthRad/(earthRad+alt));
        // projection length radius
        rh[0] = earthRad*Math.sin(lambda0);
        // height
        rh[1] = (earthRad+alt)-(earthRad*Math.cos(lambda0));
        return rh;
    }
	
orbitcone.prototype.removeall = function(){
	this.viewer.entities.remove(this.cone);
}