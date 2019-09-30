
	function SGP4(earth,name,line1,line2){
		//init visibility value
		this.coveragevisibility = document.getElementById('Satellite_coverage').checked;
		this.fillvisibility = document.getElementById('Satellite_fill').checked;
		this.orbitvisibility = document.getElementById('Satellite_orbit').checked;
		this.satvisibility = document.getElementById('Satellite_label').checked;


		this.earth = earth;
		this.line;
		this.satellite;
		this.circle;
		this.cone;
		this.SGP4name;
		this.prop;
		this.isOnePosition = true;
		this.SGP4name = name;
        // create TLE object
        var newTLE = new TLE(name,line1,line2);
		
		// Create SGP4 satelite propogator
        try
        {
            this.prop = new SatelliteTleSGP4(newTLE.getSatName(), newTLE.getLine1(), newTLE.getLine2());
            //prop.setShowGroundTrack(false); // if we arn't using the JSatTrak plots midas well turn this off to save CPU time
        }
        catch(e)
        {
            console.log("Error Creating SGP4 Satellite");
            //System.exit(1);
        }

        // prop to the desired time
		julianDate = getCurrentJulianDate();
        this.prop.propogate2JulDate(julianDate);
        // get the lat/long/altitude [radians, radians, meters]
        this.lla = this.prop.getLLA();
        //Add Satellite Objects here
        //getSatHash().put(name, prop); // copy manually
	
        /*
         * 
         * Satellite Object
         * 
        */
        var p = new Cesium.Cartesian3.fromDegrees(
			this.lla[1]*180.0/Math.PI,
			this.lla[0]*180.0/Math.PI,
			this.lla[2]);
		var realalt = this.lla[2];
        if(earth.is2DMODE&&this.coveragevisibility==true){
            //Draw Circle
            var transGreen = Cesium.Color.GREEN.withAlpha(0.3);
            this.circle = new orbitcircle(earth.viewer,p,calcFootPrintRadiusFromAlt(realalt),transGreen);
            this.circle.drawCircle(this.coveragevisibility);
        }
        else{ //3D Satellite Objectvar xyz;
			xyz = this.prop.calculateTemePositionFromUT(getCurrentJulianDate());
			if(xyz!=null){
				p = toLATLON(xyz[0],xyz[1],xyz[2]);
				p = toLATLONZERO( parseFloat(xyz[0]), parseFloat(xyz[1]), parseFloat(xyz[2]) );
			}
			if(earth.is2DMODE==false&&this.coveragevisibility==true){ 
				//Draw Cone 
				this.cone = new orbitcone(earth.viewer,p,calcConeRadiusHeightFromAlt(realalt)[0],calcConeRadiusHeightFromAlt(realalt)[1],Cesium.Color.WHITE.withAlpha(0.2));
				this.cone.setFill(true);//fill / outline
				this.cone.drawCone(this.coveragevisibility);
			}
        }
        this.satellite = new orbitsatellite(earth.viewer,name,p);
		//this.satellite.setSatelliteAttribute(p);
        this.satellite.drawSatellite(this.satvisibility);
		
        //Draw Orbitline
		if(this.orbitvisibility==true){
			this.line = new orbitline(earth.viewer,Cesium.Cartesian3.fromDegreesArray([]),Cesium.Cartesian3.fromDegreesArray([]),Cesium.Cartesian3.fromDegreesArray([]),Cesium.Cartesian3.fromDegreesArray([]),
						1,Cesium.Color.RED);
			this.drawOrbitline(name,this.prop,julianDate);
		}
	}
	
	function calcFootPrintRadiusFromAlt(alt) // double lat, double lon, 
    {
        var earthRad = AstroConst.R_Earth;
        var lambda0 = Math.acos(earthRad/(earthRad+alt));
        var radius = earthRad*Math.sin(lambda0);
        return radius;
    }
	function calcConeRadiusHeightFromAlt(alt)
    {
        var rh = [];
        var earthRad = AstroConst.R_Earth;
        var lambda0 = Math.acos(earthRad/(earthRad+alt));
        // projection length radius)
        rh[0] = earthRad*Math.sin(lambda0);
        // height
        rh[1] = (earthRad+alt)-(earthRad*Math.cos(lambda0));
        return rh;
    }

	SGP4.prototype.drawOrbitline= function(name,prop,julianDate){
        this.orbitvisibility = document.getElementById('Satellite_orbit').checked;
		//Satellite Orbit line
        var Positions = [];
        var Positions1 = [];
        var Positions2 = [];
        var Positions3 = [];
        //2D
        if(this.earth.is2DMODE)
		{
			var sat = this.prop;
			var LLA_old = new Array();
        	if(sat.getNumGroundTrackLeadPts() > 1)
            {
                LLA = sat.getGroundTrackLlaLeadPt(0);
                //xy_old = findXYfromLL(LLA[0]*180.0/Math.PI, LLA[1]*180.0/Math.PI, w, h, imageWidth, imageHeight);
                LLA_old[0] = LLA[0];
                LLA_old[1] = LLA[1];
                // faster performance to draw allpoints at once useing drawPolyLine
                Positions.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                var switchline = false;
                for(var j=1;j<sat.getNumGroundTrackLeadPts();j++)
                {
                    LLA = sat.getGroundTrackLlaLeadPt(j);
                    // check to see if Longitude flipped sign But not near origin
                    if ( LLA!=null ) // make sure they are not NAN (not in time)
                    {
                        // line segment is normal (doesn't span map disconnect)
                        if (Math.abs(LLA[0] - LLA_old[0]) < 4.0)
                        {
                            // add points to the array (after NaN check)
                            if(switchline==true)
                            	Positions1.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                            else
                            	Positions.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                        }
                        else
                        {
//                            // draw this line segment next time, jump from side to side
                            var newLat = this.linearInterpDiscontLat(LLA_old[1], LLA_old[0], LLA[1], LLA[0]);
                            // draw 2 lines - one for each side of the date line
                            if (LLA_old[0] > 0) // then the old one is on the positive side
                            {
                                // add final point to positive side
                                if(switchline==true)
                                	Positions1.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,180.0,100000));
                                else
                                	Positions.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,180.0,100000));
                                // draw the polyline
//                                line.setOrbitPositions(Positions, Positions1, Positions2, Positions3);
//                                line.drawline(GUI.checkboxs.get(GUI.SatellitesName.indexOf(prop.getName())));
                                // clear the arrays (just reset the counter)
                                switchline = !switchline; //switch to positions1

                                if(switchline==true)
                                	Positions1.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,-180.0,100000));
                                else
                                	Positions.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,-180.0,100000));

                                if(switchline==true)
                                	Positions1.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                                else
                                    Positions.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                                
                            }
                            else // the new one is on the positive side
                            {
                                // add final point to neg side
                                if(switchline==true)
                                	Positions1.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,-180.0,100000));
                                else
                                	Positions.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,-180.0,100000));

                                // draw the polyline
//                                line.setOrbitPositions(Positions, Positions1, Positions2, Positions3);
//                                line.drawline(GUI.checkboxs.get(GUI.SatellitesName.indexOf(prop.getName())));

                                // clear the arrays (just reset the counter)
                                switchline = !switchline; //switch to positions1

                                if(switchline==true)
                                	Positions1.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,180.0,100000));
                                else
                                	Positions.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,180.0,100000));
                                
                                if(switchline==true)
                                	Positions1.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                                else
                                	Positions.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                            }
                        } // jump in footprint
                    } // NaN check
                    LLA_old[0] = LLA[0];
                    LLA_old[1] = LLA[1];
                } // lead track drawing
                
                // draw remainder of lead segment
                this.line.setOrbitPositions(Positions, Positions1, Positions2, Positions3);
                this.line.drawline(this.orbitvisibility);
            }// lead track 

        	// Lag track:
        	// first Lag point
        	if(sat.getNumGroundTrackLagPts() > 0)
        	{
        		LLA = sat.getGroundTrackLlaLagPt(0);
                //xy_old = findXYfromLL(LLA[0]*180.0/Math.PI, LLA[1]*180.0/Math.PI, w, h, imageWidth, imageHeight);
                LLA_old[0] = LLA[0];
                LLA_old[1] = LLA[1];
                // faster performance to draw allpoints at once useing drawPolyLine
                Positions2.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                var switchline = false;
                for(var j=1;j<sat.getNumGroundTrackLagPts();j++)
                {
                    LLA = sat.getGroundTrackLlaLagPt(j);
                    // check to see if Longitude flipped sign But not near origin
                    if ( LLA_old!=null ) // make sure they are not NAN (not in time)
                    {
                        // line segment is normal (doesn't span map disconnect)
                        if (Math.abs(LLA[0] - LLA_old[0]) < 4.0)
                        {
                            // add points to the array (after NaN check)
                            if(switchline==true)
                            	Positions3.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                            else
                            	Positions2.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                        }
                        else
                        {
//                            // draw this line segment next time, jump from side to side
                            var newLat = this.linearInterpDiscontLat(LLA_old[1], LLA_old[0], LLA[1], LLA[0]);
                            // draw 2 lines - one for each side of the date line
                            if (LLA_old[0] > 0) // then the old one is on the positive side
                            {
                                // add final point to positive side
                                if(switchline==true)
                                	Positions3.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,180.0,100000));
                                else
                                	Positions2.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,180.0,100000));
                                // draw the polyline
//                                line.setOrbitPositions(Positions, Positions1, Positions2, Positions3);
//                                line.drawline(GUI.checkboxs.get(GUI.SatellitesName.indexOf(prop.getName())));
                                // clear the arrays (just reset the counter)
                                switchline = !switchline; //switch to positions1

                                if(switchline==true)
                                	Positions3.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,-180.0,100000));
                                else
                                	Positions2.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,-180.0,100000));

                                if(switchline==true)
                                	Positions3.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                                else
                                    Positions2.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                                
                            }
                            else // the new one is on the positive side
                            {
                                // add final point to neg side
                                if(switchline==true)
                                	Positions3.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,-180.0,100000));
                                else
                                	Positions2.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,-180.0,100000));

                                // draw the polyline
//                                line.setOrbitPositions(Positions, Positions1, Positions2, Positions3);
//                                line.drawline(GUI.checkboxs.get(GUI.SatellitesName.indexOf(prop.getName())));

                                // clear the arrays (just reset the counter)
                                switchline = !switchline; //switch to positions1

                                if(switchline==true)
                                	Positions3.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,180.0,100000));
                                else
                                	Positions2.push(Cesium.Cartesian3.fromDegrees(newLat*180.0/Math.PI,180.0,100000));
                                
                                if(switchline==true)
                                	Positions3.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                                else
                                	Positions2.push(Cesium.Cartesian3.fromDegrees(LLA[1]*180.0/Math.PI, LLA[0]*180.0/Math.PI,100000));
                            }
                        } // jump in footprint
                    } // NaN check
                    LLA_old[0] = LLA[0];
                    LLA_old[1] = LLA[1];
                } // lag track drawing
        
                // draw remainder of lead segment
                this.line.setOrbitPositions(Positions, Positions1, Positions2, Positions3);
                this.line.drawline(this.orbitvisibility);
        	} // lag track
          

        }
		//3D
        else{
			//if(document.getElementById('ECI').checked==true){
				for (var i = 0; i < this.prop.getNumGroundTrackLagPts(); i++)
				{
					// add next Mean of Date vertex
					var xyz = this.prop.getGroundTrackXyzLagPt(i);
					if(xyz != null)
					{
					   Positions.push( toLATLON(
							parseFloat(xyz[0]),
							parseFloat(xyz[1]),
							parseFloat(xyz[2]))
						);
					}
				}
			//}
        	this.line.setOrbitPositions(Positions);
			this.line.drawline(this.orbitvisibility);
        }
	  //viewer.render();
	}
	
	SGP4.prototype.linearInterpDiscontLat = function(lat1,long1,lat2,long2){
        // one longitude should be negative one positive, make them both positive
        if(long1 > long2)
        {
            long2 += 2*Math.PI; // in radians
        }
        else
        {
            long1 += 2*Math.PI;
        }
        
        return  ( lat1+(Math.PI - long1)*(lat2-lat1)/(long2-long1) );
    }
	
    SGP4.prototype.canDraw= function(){return this.isOnePosition;}
    SGP4.prototype.getProp= function(){ return this.prop;}
    SGP4.prototype.getSatellite= function(){ return this.satellite;}
    SGP4.prototype.getOrbitline= function(){ return this.line;}
    SGP4.prototype.getOrbitcircle= function(){ return this.circle;}
    SGP4.prototype.getOrbitcone= function(){ return this.cone;}
    SGP4.prototype.getSGP4name= function(){ return this.SGP4name;}

	SGP4.prototype.getLLA= function(){
		return this.lla;
	}