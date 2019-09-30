	
	var realTimeAnimationRefreshRateMs = 1000; // refresh rate for real time animation
	var nonRealTimeAnimationRefreshRateMs = 1000; // refresh rate for non-real time animation
	var animationRefreshRateMs = realTimeAnimationRefreshRateMs; // (current)Milliseconds ** this should be an option somewhere!! - determines CPU used in animation
	var animationSimStepSeconds = 1.0; // dt in Days per animation step/time update
	var currentPlayDirection = 0; // 1= forward, -1=backward, =0-no animation step, but can update time (esentially a graphic ini or refresh)
	var timeStepSpeeds = new Array(0.0001,0.001,0.01,0.1,0.25,0.5,1.0,2.0,5.0,10.0,30.0,60.0,300.0,600.0,1800.0,3600.0,43200.0,86400.0,604800.0,2419200.0,31556926.0);
	var currentTimeStepSpeedIndex = 6;
	var currentJulianDate = new Time();
	var selectedentity = null;
	
	function EARTH(container){
		this.container = container;
		//2D 3Dmode view
		this.is2DMODE = false;
		//Rotating Earth using ellipsoid
		this.fakeearth=null;
		this.fakeearth1=null;
		this.fakeearthrot = false;
		this.fakeearthlon = calculateearthrotation();
		this.GroundStation = null;
		//Init    
		this.TLErecords = [];
		this.SGP4Array = [];
		this.SatellliteNames = [];
		this.SatelliteLayer = new Cesium.EntityCollection();
		this.CircleLayer = new Cesium.EntityCollection();
		this.ConeLayer = new Cesium.EntityCollection();
		//Init TLErenderer
		this.playTimer;
		this.currentTime = new Date();
		this.julianDate = parseFloat(currentJulianDate.getJulianDate());//2454992.0; // 09 Jun 2009 12:00:00.000 UTC
	}

	EARTH.prototype.initEARTH = function(){
		this.viewer = new Cesium.Viewer(this.container,{
				//mapProjection : new Cesium.WebMercatorProjection(),
				selectionIndicator : false,
				geocoder:false,
				homeButton:false,
				sceneModePicker:false,
				navigationHelpButton:false,
				infoBox : false,
				geocoder:false,
				navigationHelpButton:false,
				navigationInstructionsInitiallyVisible:false,
				sceneMode : Cesium.SceneMode.SCENE3D,
				baseLayerPicker : false,
				animation : false,
				timeline : false,
				fullscreenButton : false,
				skyBox : false,
				//skyAtmosphere : false,
				contextOptions:{
					webgl: {
						alpha: false,
						antialias: true,
						failIfMajorPerformanceCaveat: false
					},
					allowTextureFilterAnisotropic:false
				},
				//resolutionScale : 0.1,
				//targetFrameRate : 100,
				orderIndependentTranslucency : true,
				creditContainer : "hidecredit",
				//terrainProvider : false,
				//imageryProvider : false,
				//useDefaultRenderLoop : false,
		});
		
		//remove background
		this.scene = this.viewer.scene;
		this.scene.backgroundColor  = Cesium.Color.BLACK;
		this.scene.globe.show = false;
		this.scene.globe.enableLighting = false; 
		this.scene.sun = this.scene.sun && this.scene.sun.destroy();
		this.scene.moon = this.scene.moon && this.scene.moon.destroy();
		this.scene.sunBloom = false;
		this.scene.skyAtmosphere = this.scene.skyAtmosphere && this.scene.skyAtmosphere.destroy();
		
		//Imagery layer
		this.layers = this.viewer.imageryLayers;
		this.layers.removeAll(true);//remove all unwanted imagery
			var earthlayer = new Cesium.ImageryLayer(new Cesium.SingleTileImageryProvider({url : 'images/NaturalEarth2.png',rectangle : Cesium.Rectangle.fromDegrees(-180.0, -90.0, 180.0, 90.0)})); 
			this.layers.add(earthlayer);
		
		//MOVE VIEW TO
		this.viewer.camera.flyTo({
			destination :  Cesium.Cartesian3.fromDegrees(0,0,40000000)
		});
		
		this.createfakeearth();
		updateTimeStepsDataGUI();
		disTime(currentJulianDate.getDateTimeStr());
		
		this.sethandler();
	}

	//DOM//
	function disSatelliteLocation(name,satposition){
		/*tooltip.innerHTML = 
		"<br/>"
		+selectedentity.name+"<br/>"
		+"Loc : "+satposition+"<br/>"
		;*/
		var follow = false;
		if(document.getElementById('followsatellite')==null);
		else{
			follow = document.getElementById('followsatellite').checked;
		}
		document.getElementById('infopanel').innerHTML = 
			"<center><input class='btn' type='checkbox' id='followsatellite'"+
				(follow==true?"checked":"")
			+"/><h style='font-size:12px;color:#f0f0f0;'>&nbsp;FOLLOW SATELLITE</h></center>"+
			"<center><p>INFO</p></center>"
			+"<p><span style='margin-left:50px'>NAME: "+name+"</p></span>"
			+"<p><span style='margin-left:50px'>LAT : "+satposition.split(",")[0].substr(1,10)+"</p></span>"
			+"<p><span style='margin-left:50px'>LON : "+satposition.split(",")[1].substr(0,10)+"</p></span>"
			+"<p><span style='margin-left:50px'>ALT : "+satposition.split(",")[2].split(")")[0]+"</p></span>"
			+"<br/><center><p><a href='http://www.celestrak.com'>www.celestrak.com</a></p></center>";
	}
	function disTime(TIME){
		document.getElementById("time_label").value = TIME;
	} 
	
	EARTH.prototype.sethandler = function(){
		var viewer = this.viewer;
		var SGP4Array = this.SGP4Array;
		var SatellliteNames = this.SatellliteNames;
		var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
		handler.setInputAction(function(movement) {
			//MOVE VIEW TO
			viewer.camera.flyTo({
				destination :  Cesium.Cartesian3.fromDegrees(0,0,40000000),
				duration : 3
			});
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
		handler.setInputAction(function(movement) {
			try {
				if (selectedentity.name) {
					var satposition = toLATLONTEXT(SGP4Array[SatellliteNames.indexOf(selectedentity.name)].satellite.position);
					disSatelliteLocation(selectedentity.name,satposition);
				}
			}
			catch (e) { }
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		handler.setInputAction(function(movement) {
			var pickedObjects = viewer.scene.pick(movement.endPosition);
				if (Cesium.defined(pickedObjects)) {
					if (pickedObjects.id.name) {
						selectedentity = pickedObjects.id;
					}
				}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);		
	}
	EARTH.prototype.Switchto2Dmode = function(){
		this.is2DMODE = true;
		if(this.viewer.scene){
			this.removefakeearth();
			this.viewer.scene.morphTo2D(2);
			this.viewer.camera.flyTo({
				destination : Cesium.Cartesian3.fromDegrees(0, 0, 40000000)
			});
		}
	}
	EARTH.prototype.Switchto3Dmode = function(){
		this.is2DMODE = false;
		if(this.scene){
			this.createfakeearth();
			this.scene.morphTo3D(2);
		}
		var viewer = this.viewer;
		setTimeout(function(){
			viewer.camera.flyTo({
				destination : Cesium.Cartesian3.fromDegrees(0, 0, 90000000)
			});
		},2500);
	}
	EARTH.prototype.SwitchViewMode = function(){
		if(this.is2DMODE==true){
			this.Switchto3Dmode();
		}
		else{
			this.Switchto2Dmode();
		}
		this.scene.globe.show = this.is2DMODE;
		this.removeAll();
		this.SGP4Array = new Array();
			//lock camera controls
			this.scene.screenSpaceCameraController.enableRotate = !this.is2DMODE;
			this.scene.screenSpaceCameraController.enableTilt = !this.is2DMODE;
			this.scene.screenSpaceCameraController.enableTranslate = !this.is2DMODE; 
			this.scene.screenSpaceCameraController.enableZoom = !this.is2DMODE;
	}
	
	EARTH.prototype.createfakeearth = function(){
		if(this.fakeearth==null||this.fakeearth==undefined){
			var earthrad = AstroConst.R_Earth;//6378136.3;
			this.fakeearth = this.viewer.entities.add({
				position: Cesium.Cartesian3.fromDegrees(this.fakeearthlon,-90,-earthrad),
				ellipsoid : {
					radii : new Cesium.Cartesian3(earthrad,earthrad,earthrad),
					material  : '../cesiumtle/images/earth.png',
					subdivisions : 1,
					stackPartitions : 64,
					slicePartitions : 32,
				}
			});
			this.fakeearth1 = this.viewer.entities.add({
				position: Cesium.Cartesian3.fromDegrees(this.fakeearthlon,-90,-earthrad),
				ellipsoid : {
					radii : new Cesium.Cartesian3(earthrad,earthrad,earthrad),
					material  : '../cesiumtle/images/earth.png',
					subdivisions : 1,
					stackPartitions : 64,
					slicePartitions : 32,
				}
			});
		}
		this.scene.globe.show = false;
	}
	EARTH.prototype.removefakeearth = function(){
		if(this.fakeearth!=null){
			this.viewer.entities.remove(this.fakeearth);
			this.fakeearth = null;
		}
		if(this.fakeearth1!=null){
			this.viewer.entities.remove(this.fakeearth1);
			this.fakeearth1 = null;
		}
		this.scene.globe.show = true;
	}
	EARTH.prototype.rotatefakeearth = function(){
		/*for(var i=0;i<parseInt(animationSimStepSeconds/(60)*0.5);i++){ //0.5 per minute0.00416666666666666666666666666667
			this.fakeearthlon+=(currentPlayDirection);//*0.1;
			if(this.fakeearth!=null){
				if(this.fakeearthrot==true){
					this.fakeearth.position = Cesium.Cartesian3.fromDegrees(this.fakeearthlon,-90,-AstroConst.R_Earth);
					this.fakeearthrot = false;
				}
				else{
					this.fakeearth1.position = Cesium.Cartesian3.fromDegrees(this.fakeearthlon,-90,-AstroConst.R_Earth);
					this.fakeearthrot = true;
				}
			}
		}*/
		if(this.fakeearth!=null){
			this.fakeearth.position = Cesium.Cartesian3.fromDegrees(calculatecurrentearthrotation(),-90,-AstroConst.R_Earth);
			this.fakeearth1.position = Cesium.Cartesian3.fromDegrees(calculatecurrentearthrotation(),-90,-AstroConst.R_Earth);
		}
	}
	EARTH.prototype.resetfakeearth = function(){
		this.fakeearth.position = Cesium.Cartesian3.fromDegrees(0,-90,-AstroConst.R_Earth);
		this.fakeearth1.position = Cesium.Cartesian3.fromDegrees(0,-90,-AstroConst.R_Earth);
	}
	function calculateearthrotation(){
		// centuries since J2000.0
		var time = new Time();
		var currentMJD = time.getMJD();
		var offsetRotdeg = -90;
        var T = (currentMJD-51544.5)/36525.0;  
        // now calculate the mean sidereal time at Greenwich (UT time) in degrees
        var rotateECIdeg =  ( (280.46061837 + 360.98564736629*(currentMJD-51544.5)) + 0.000387933*T*T - T*T*T/38710000.0 +offsetRotdeg) % 360.0;
        //console.log(rotateECIdeg);
		return rotateECIdeg-180;
	}
	function calculatecurrentearthrotation(){
		// centuries since J2000.0
		var currentMJD = currentJulianDate.getMJD();
		var offsetRotdeg = -90;
        var T = (currentMJD-51544.5)/36525.0;  
        // now calculate the mean sidereal time at Greenwich (UT time) in degrees
        var rotateECIdeg =  ( (280.46061837 + 360.98564736629*(currentMJD-51544.5)) + 0.000387933*T*T - T*T*T/38710000.0 +offsetRotdeg) % 360.0;
        //console.log(rotateECIdeg);
		return rotateECIdeg-180;
	}
	EARTH.prototype.removeAll = function(){
		this.fakeearth = null;
		this.fakeearth1 = null;
		this.viewer.entities.removeAll();
		if(this.is2DMODE==false)
			this.createfakeearth();
		//this.SGP4Array = [];
		//this.SatellliteNames = [];
	}
	 
	function toXYZ(lng,lat,alt){
		var coord_wgs84 = Cesium.Cartographic.fromDegrees(lng, lat, alt);//单位：度，度，米
		var coord_xyz = Cesium.Ellipsoid.WGS84.cartographicToCartesian(coord_wgs84);
		//console.log('x=' + coord_xyz.x + ',y=' + coord_xyz.y + ',z=' + coord_xyz.z);//单位：米，米，米
		return coord_xyz;
	}
	function toNormalLATLON (x,y,z){
		var xyz = new Cesium.Cartesian3(x,y,z);
		var wgs84 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(xyz);
		//console.log('lng=' + Cesium.Math.toDegrees(wgs84.longitude) + ',lat=' + Cesium.Math.toDegrees(wgs84.latitude) + ',alt=' + wgs84.height);
		return Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(wgs84.longitude),Cesium.Math.toDegrees(wgs84.latitude),wgs84.height);
	}
	function toLATLON (x,y,z){
		var xyz = new Cesium.Cartesian3(x,y,z);
		var wgs84 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(xyz);
		//console.log('lng=' + Cesium.Math.toDegrees(wgs84.longitude) + ',lat=' + Cesium.Math.toDegrees(wgs84.latitude) + ',alt=' + wgs84.height);
		return Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(wgs84.longitude),Cesium.Math.toDegrees(wgs84.latitude),wgs84.height);
	}
	function toLATLONZERO(x,y,z){
		var xyz = new Cesium.Cartesian3(x,y,z);
		var wgs84 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(xyz);
		//console.log('lng=' + Cesium.Math.toDegrees(wgs84.longitude) + ',lat=' + Cesium.Math.toDegrees(wgs84.latitude) + ',alt=' + wgs84.height);
		return Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(wgs84.longitude),Cesium.Math.toDegrees(wgs84.latitude),wgs84.height);
	}
	function toLATLONTEXT(position){
		var wgs84 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
		return "("+Cesium.Math.toDegrees(wgs84.longitude)+","+Cesium.Math.toDegrees(wgs84.latitude)+","+wgs84.height+")";
	}
	
    /***************
    **TLERENDERER***
    **************
	EARTH.prototype.addsecond = function(sec){
		this.currentTime.setSeconds(this.currentTime.getSeconds()+sec);
	}*/
	
	EARTH.prototype.loopRendering = function(i){
		var sat = this.SGP4Array[i].getProp();
        var Satellite = this.SGP4Array[i].getSatellite();
		var vis = true;
		//Follow satellite
		try{
			if(i==(this.SatellliteNames.indexOf(selectedentity.name))&&!this.is2DMODE&&document.getElementById('followsatellite').checked==true){
				this.viewer.zoomTo(Satellite.satellite, 
					new Cesium.HeadingPitchRange(Cesium.Math.toRadians(90),Cesium.Math.toRadians(-90),10000000));
			}
		}catch(e){}
        //not visible
		if(vis==false){
			if(this.is2DMODE){
				this.SGP4Array[i].getOrbitcircle().drawCircle(false);
			}
			else
				this.SGP4Array[i].getOrbitcone().drawCone(false);
			this.SGP4Array[i].getOrbitline().drawline(false);
			this.SGP4Array[i].getSatellite().drawSatellite(false);
		}
		//visible
		else{
			//Satellite
	        var oldLLA = sat.getLLA();
			var lla = sat.propogate2JulDate(getCurrentJulianDate());
			var p = Cesium.Cartesian3.fromDegrees(lla[1]*180.0/Math.PI, lla[0]*180.0/Math.PI, this.is2DMODE?16000:lla[2]);
					
			//update location tooltip
			if(selectedentity){					
				if(this.SatellliteNames.indexOf(selectedentity.name)==i){
					/*tooltip.innerHTML = 
						"<br/>"
						+selectedentity.name+"<br/>"
						+"Loc : "+toLATLONTEXT(p)+"<br/>"
					;*/

					var satposition = toLATLONTEXT(p);
					disSatelliteLocation(selectedentity.name,satposition);
				}
			}
			
			//2D
			if(this.is2DMODE&&this.SGP4Array[i].getOrbitcircle()){
				//circle
				this.SGP4Array[i].getOrbitcircle().setPosition(p);
				this.SGP4Array[i].getOrbitcircle().drawCircle(
						document.getElementById('Satellite_coverage').checked);

			    if(lla[0]>=0 && oldLLA[0] <=0 && oldLLA[0]<lla[0]){
					if((document.getElementById('Satellite_orbit').checked)){
						this.SGP4Array[i].drawOrbitline(sat.getName(),sat,getCurrentJulianDate());
					}
			    }
			}
			//3D
			else if(this.is2DMODE==false){
				var xyz;
				//if(document.getElementById('ECI').checked==true){
					xyz = sat.calculateTemePositionFromUT(getCurrentJulianDate());
					if(xyz!=null){
						p = toLATLON(xyz[0],xyz[1],xyz[2]);
						p = toLATLONZERO( parseFloat(xyz[0]), parseFloat(xyz[1]), parseFloat(xyz[2]) );
					}
				//}
				/*else if(document.getElementById('ECEF').checked==true){
					p = Cesium.Cartesian3.fromDegrees(lla[1]*180.0/Math.PI, lla[0]*180.0/Math.PI, this.is2DMODE?16000:lla[2]);
				}*/
				if(this.SGP4Array[i].getOrbitcone()){
					//Cone
					this.SGP4Array[i].getOrbitcone().setPosition(p);
					this.SGP4Array[i].getOrbitcone().drawCone(
						document.getElementById('Satellite_coverage').checked);
				}
			}
			//Satellite
			Satellite.setSatelliteAttribute(p);
			Satellite.drawSatellite(vis);
		}
	}
	// input change in time in days, checks to see if ground tracks need to be updated
    EARTH.prototype.checkTimeDiffResetGroundTracks = function(timeDiffDays){
        if( timeDiffDays > 91.0/1440.0){
            /* big time jump
            for(AbstractSatellite sat : getWW().getSatHash().values() )
            {
                if(sat.getShowGroundTrack() && (sat.getPeriod() <= (timeDiffDays*24.0*60.0) ) )
                {
                    sat.setGroundTrackIni2False();
                }
            }*/
        }
    } // checkTimeDiffResetGroundTracks
	
	//VISIBLE SATELLITE
	EARTH.prototype.calculateVisible = function(){
		if(this.GSlines!=null&&this.GSlines.length>0){
			for(var i=0;i<this.GSlines.length;i++)
				this.viewer.entities.remove(this.GSlines[i]);
		}
		this.GSlines = [];
		var GSlatlon = this.ECEFlatlon(39,116);
		this.createGS(GSlatlon);
		var GS = $V([GSlatlon.x,GSlatlon.y,GSlatlon.z]);
		var GSu = GS.devide(norm(GS));
		var H = $M([[0,0,0,0]]);//empty
		var j = 0;
		for(var i=0;i<this.SGP4Array.length;i++){
			var Satellite = this.SGP4Array[i].getSatellite();
			var SatellitePosition = this.SGP4Array[i].getSatellite().position;
			var SAT = $V([SatellitePosition.x,SatellitePosition.y,SatellitePosition.z]).subtract(GS);
			var SATu = SAT.devide(norm(SAT));
			
			if(Math.abs(Math.acos(GSu.dot(SATu))) < Math.PI/2){
				console.log(Satellite.name + " is Visible!");
				//Visible line
				var Positions = [];
				Positions.push(GSlatlon);
				Positions.push(SatellitePosition);
				this.createGSLine(Positions);
				//ECEF2ENU
				var ENU = ECEF2ENU(SatellitePosition.x,SatellitePosition.y,SatellitePosition.z,GSlatlon);
				var ENUv = $V([ENU[0],ENU[1],ENU[2]]);
				var ENUv = (ENUv.multiply(-1)).devide(norm(ENUv));
				//console.log(ENUv);
				//console.log(ENUv.elements[0]);
				H.elements[j++] = [ENUv.elements[0],ENUv.elements[1],ENUv.elements[2],1]
				console.log(H.inspect());
			}
			else
				console.log(/*Math.abs(Math.acos(GSu.dot(SATu))) +*/ Satellite.name + "  NOT Visible");
		}
		var G = ((H.transpose()).multiply(H)).inv();
		if(G!=null){
			console.log(G.inspect());
			var hdop = Math.sqrt(G.col(1).elements[0]+G.col(2).elements[1]);
			var vdop = Math.sqrt(G.col(3).elements[2]);
			var pdop = Math.sqrt(G.col(1).elements[0]+G.col(2).elements[1]+G.col(3).elements[2]);
			var tdop = Math.sqrt(G.col(4).elements[3]);
			var gdop = Math.sqrt((pdop*pdop)+(tdop*tdop));
			console.log("hdop: "+hdop+" vdop: "+vdop+" pdop: "+pdop+" tdop: "+tdop+" gdop: "+gdop);
		}
		/*var newlon1 = (100+(this.is2DMODE==false?calculatecurrentearthrotation():0))-90;
		var userlatlon1 = Cesium.Cartesian3.fromDegrees(
			newlon1>=180?newlon1-360:newlon1
			,50,10000000);
		this.createGS(userlatlon1);
		var rus = $V([userlatlon1.x,userlatlon1.y,userlatlon1.z]).subtract(user);
		var rusu = rus.devide(norm(rus));
		
		if(Math.abs(Math.acos(useru.dot(rusu))) < Math.PI/2)
			console.log("Visible");
		else
			console.log(Math.abs(Math.acos(useru.dot(rusu))) + "  NOT Visible");*/
	}
	
	EARTH.prototype.ECEFlatlon = function(lat,lon){
		var newlon = (lon+((this.is2DMODE==false&&document.getElementById('ECI').checked==true)?calculatecurrentearthrotation()-90:0));
		return Cesium.Cartesian3.fromDegrees(
			newlon>=180?newlon-360:newlon
			,lat
			,100000);
	}
	
	function ECEF2ENU(x,y,z,GSlatlon){
		var u = x - GSlatlon.x;
		var v = y - GSlatlon.y;
		var w = z - GSlatlon.z;
		var xyz = new Cesium.Cartesian3(GSlatlon.x,GSlatlon.y,GSlatlon.z);
		var wgs84 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(xyz);
		var lat = Cesium.Math.toRadians(wgs84.latitude);
		var lon = Cesium.Math.toRadians(wgs84.longitude);
		
		var t = Math.cos(lon) * u + Math.sin(lon) * v;
		var E = -Math.sin(lon) * u + Math.cos(lon) * v;
		var N = -Math.sin(lat) * t + Math.cos(lat) * w;
		var U = Math.cos(lat) * t + Math.sin(lat) * w;
		
		return [E,N,U];
	}
	function norm(vector) {
		var V = vector.elements || vector;
		return Math.sqrt((V[0]*V[0])+(V[1]*V[1])+(V[2]*V[2]));
	}
  
	EARTH.prototype.createGS = function(position){
		if(this.GroundStation!=null){
			this.viewer.entities.remove(this.GroundStation);
			this.GroundStation = null;
		}
		this.GroundStation = this.viewer.entities.add({
			name : "Ground Station",
			position : position,
			point :{
				color : Cesium.Color.RED,
				pixelSize : 10,
				eyeOffset : new Cesium.ConstantProperty(new Cesium.Cartesian3(0,0, -1500000)),
			},
			label :{
				text : "Ground Station",
				scale : 0.5,
				eyeOffset : new Cesium.ConstantProperty(new Cesium.Cartesian3(0,0, -1500000)),
				fillColor  : Cesium.Color.WHITE,
				outlineWidth : 0,
				outlineColor : Cesium.Color.RED,
			},
			show : true,
			allowPicking: true
		});
	}

	EARTH.prototype.createGSLine = function(positions){
		var line = this.viewer.entities.add({
			polyline : {
				positions : positions,
				width : 1,
				material : Cesium.Color.RED,
				followSurface : false
			},
			show : true,
			allowPicking: false
		});
		this.GSlines.push(line);
	}