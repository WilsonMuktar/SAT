
    /** Creates a new instance of SatelliteProps - default properties with given name and TLE lines
     * @param name name of satellite
     * @param tleLine1 first line of two line element
     * @param tleLine2 second line of two line element
     * @throws Exception if TLE data is bad
     */
	
    function SatelliteTleSGP4(name,tleLine1,tleLine2)
    {
		this.lla = []; // lat,long,alt  [radians, radians, m ]
		this.tle; //TLE parsed data
		this.sgp4SatData; // sgp4 propogator data
		this.currentJulianDate = -1;// current time - julian date
		this.tleEpochJD = -1; // no age // TLE epoch -- used to calculate how old is TLE - Julian Date
		this.j2kPos = []; // meters // J2000 position and velocity vectors
		this.j2kVel = []; // meters/sec
		// true-equator, mean equinox TEME of date
		this.posTEME = [];  // true-equator, mean equinox TEME of date position for LLA calcs, meters
		this.velTEME = []; // meters/sec
		// plot options 
		this.plot2d = true;
		this.satColor = "";//Color.RED; // randomize in future
		this.plot2DFootPrint = true;
		this.fillFootPrint = true;
		this.numPtsFootPrint = 41; // number of points in footprint, used to be 101
		// ground track options  -- grounds tracks draw to asending nodes, re-calculated at acending nodes
		this.showGroundTrack = true;
		this.grnTrkPointsPerPeriod = 81; // equally space in time >=2 // used to be 121
		this.groundTrackLeadPeriodMultiplier = 2.0;  // how far forward to draw ground track - in terms of periods
		this.groundTrackLagPeriodMultiplier = 1.0;  // how far behind to draw ground track - in terms of periods
		this.latLongLead = []; // leading lat/long coordinates for ground track
		this.latLongLag = []; // laging lat/long coordinates for ground track
		this.temePosLead = []; // leading TEME position coordinates for ground track
		this.temePosLag = []; // laging TEME position coordinates for ground track
		this.timeLead = []; // array for holding times associated with lead coordinates (Jul Date)
		this.timeLag = []; // array - times associated with lag coordinates (Jul Date)
		this.groundTrackIni = false; // if ground track has been initialized    
		// 3D Options
		this.show3DOrbitTrace = true;
		this.show3DFootprint = true;
		this.show3DName = true; // not implemented to change yet
		this.show3D = true; // no implemented to change yet, or to modify showing of sat
		this.showGroundTrack3d = false;
		this.show3DOrbitTraceECI = true; // show orbit in ECI mode otherwise , ECEF
	
        // create internal TLE object
        this.tle = new TLE(name,tleLine1,tleLine2);
        // initialize sgp4 propogator data for the satellite
        this.sgp4SatData = new SGP4SatData();
        // try to load TLE into propogator
        // options - hard coded
        var opsmode = SGP4utils.getOPSMODE_IMPROVED(); // OPSMODE_IMPROVED
        var gravconsttype = "wgs84";

        // load TLE data as strings and INI all SGP4 data
        var loadSuccess = SGP4utils.readTLEandIniSGP4(name, tleLine1, tleLine2, opsmode, gravconsttype, this.sgp4SatData);
		// if there is an error loading send an exception
        if (!loadSuccess)
        {
            console.log("Error loading TLE error code:" + this.sgp4SatData.error);
        }

        // calculate TLE age
        this.tleEpochJD = this.sgp4SatData.jdsatepoch;
          
    }
    
	SatelliteTleSGP4.prototype.getAltitude = function() {
        return this.lla[2];
	}
	SatelliteTleSGP4.prototype.getLLA = function() {
        return this.lla;
	}
	SatelliteTleSGP4.prototype.getLatitude = function() {
        return this.lla[0];
	}
	SatelliteTleSGP4.prototype.getLongitude = function() {
        return this.lla[1];
	}
	SatelliteTleSGP4.prototype.calculateJ2KPositionFromUT = function(julDate) {
		var ptPos = calculateTemePositionFromUT(julDate);
        var mjd = julDate-AstroConst.JDminusMJD;
        // get position information back out - convert to J2000
        // precession from rk5 -> mod
        var ttt = (mjd-AstroConst.MJD_J2000) /36525.0;
        var A = J2kCoordinateConversion.teme_j2k(J2kCoordinateConversion.Direction.to,ttt, 24, 2, 'a');
        // rotate position
        var j2kPosI = J2kCoordinateConversion.matvecmult( A, ptPos);
        return j2kPosI;
	}
	SatelliteTleSGP4.prototype.calculateTemePositionFromUT = function(julDate) {
		var ptPos = [];
        var ptVel = [];
        // using JulDate because function uses time diff between jultDate of ephemeris, SGP4 uses UTC
        // propogate satellite to given date - saves result in TEME to this.posTEME and this.velTEME in km, km/s
        var propSuccess = SGP4unit.sgp4Prop2JD(this.sgp4SatData, julDate, ptPos, ptVel);
        if(!propSuccess)
        {
            console.log("Error (2) SGP4 Propagation failed for sat: " + this.sgp4SatData.name + ", JD: " + this.sgp4SatData.jdsatepoch + ", error code: "+ this.sgp4SatData.error);
        }
        // scale output to meters
        for(var i=0;i<3;i++)
        {
            // TEME
             ptPos[i] = ptPos[i]*1000.0;
        }
        return ptPos;
	}
	SatelliteTleSGP4.prototype.getCurrentJulDate = function() {
		return this.currentJulianDate;
	}
	SatelliteTleSGP4.prototype.getGrnTrkPointsPerPeriod = function() {
		return this.grnTrkPointsPerPeriod;
	}
	SatelliteTleSGP4.prototype.getGroundTrackIni = function() {
        return this.groundTrackIni;
	}
	SatelliteTleSGP4.prototype.getGroundTrackLagPeriodMultiplier = function() {
        return this.groundTrackLagPeriodMultiplier;
	}
	SatelliteTleSGP4.prototype.getGroundTrackLeadPeriodMultiplier = function() {
        return this.groundTrackLeadPeriodMultiplier;
	}
	SatelliteTleSGP4.prototype.getGroundTrackLlaLagPt = function(index) {
		return new Array(this.latLongLag[index][0],this.latLongLag[index][1],this.latLongLag[index][2]);
	}
	SatelliteTleSGP4.prototype.getGroundTrackLlaLeadPt = function(index) {
        return new Array(this.latLongLead[index][0],this.latLongLead[index][1],this.latLongLead[index][2]);
	}
	SatelliteTleSGP4.prototype.getGroundTrackXyzLagPt = function(index) {
        return new Array(this.getTemePosLag()[index][0],this.getTemePosLag()[index][1],this.getTemePosLag()[index][2]);
	}
	SatelliteTleSGP4.prototype.getGroundTrackXyzLeadPt = function(index) {
        return new Array(getTemePosLead()[index][0],getTemePosLead()[index][1],getTemePosLead()[index][2]);
	}
	SatelliteTleSGP4.prototype.getJ2000Position = function() {
        return this.j2kPos;
    }
	SatelliteTleSGP4.prototype.getJ2000Velocity = function() {
        return this.j2kVel;
	}
	SatelliteTleSGP4.prototype.getKeplarianElements = function() {
        return Kepler.SingularOsculatingElements( AstroConst.GM_Earth, this.j2kPos, this.j2kVel ); 
    }
	SatelliteTleSGP4.prototype.getTemePosLag = function() {
        return this.temePosLag;
	}
	SatelliteTleSGP4.prototype.getTemePosLead = function() {
        return this.temePosLead;
	}
	SatelliteTleSGP4.prototype.getName = function() {
        return this.tle.getSatName();
	}
	SatelliteTleSGP4.prototype.getNumGroundTrackLagPts = function() {
        return this.latLongLag.length;
	}
	SatelliteTleSGP4.prototype.getNumGroundTrackLeadPts = function() {
        return this.latLongLead.length;
	}
	SatelliteTleSGP4.prototype.getNumPtsFootPrint = function() {
        return this.numPtsFootPrint;
	}
	SatelliteTleSGP4.prototype.getPeriod = function() {
        return Kepler.CalculatePeriod(AstroConst.GM_Earth,this.j2kPos,this.j2kVel)/(60.0);
    }
	SatelliteTleSGP4.prototype.getPlot2D = function() {
        return this.plot2d;
	}
	SatelliteTleSGP4.prototype.getPlot2DFootPrint = function() {
        return this.plot2DFootPrint;
	}
	SatelliteTleSGP4.prototype.getTEMEPos = function() {
        return this.posTEME.clone();
	}
	SatelliteTleSGP4.prototype.getSatColor = function() {
        return this.satColor;
	}
	SatelliteTleSGP4.prototype.getSatTleEpochJulDate = function() {
        return this.sgp4SatData.jdsatepoch;
	}
	SatelliteTleSGP4.prototype.getShowGroundTrack = function() {
        return this.showGroundTrack;
	}
	SatelliteTleSGP4.prototype.getTimeLag = function() {
        return this.timeLag;
	}
	SatelliteTleSGP4.prototype.getTimeLead = function() {
        return this.timeLead;
	}
	SatelliteTleSGP4.prototype.getTleAgeDays = function() {
        return this.currentJulianDate - this.tleEpochJD;
	}
	SatelliteTleSGP4.prototype.getTleEpochJD = function() {
        return this.tleEpochJD;
	}
	SatelliteTleSGP4.prototype.isFillFootPrint = function() {
        return this.fillFootPrint;
	}
	SatelliteTleSGP4.prototype.isShow3D = function() {
		// TODO Auto-generated method stub
		return false;
	}
	SatelliteTleSGP4.prototype.isShow3DFootprint = function() {
		// TODO Auto-generated method stub
		return false;
	}
	SatelliteTleSGP4.prototype.isShow3DName = function() {
		// TODO Auto-generated method stub
		return false;
	}
	SatelliteTleSGP4.prototype.isShow3DOrbitTrace = function() {
		// TODO Auto-generated method stub
		return false;
	}
	SatelliteTleSGP4.prototype.isShow3DOrbitTraceECI = function() {
        return this.show3DOrbitTraceECI;
	}
	SatelliteTleSGP4.prototype.isShowGroundTrack3d = function() {
		// TODO Auto-generated method stub
		return false;
	}
	SatelliteTleSGP4.prototype.isShowName2D = function() {
		// TODO Auto-generated method stub
		return false;
	}
	SatelliteTleSGP4.prototype.propogate2JulDate = function(julDate) {
		//console.log(julDate);
        // save date
        this.currentJulianDate = julDate;
        // using JulDate because function uses time diff between jultDate of ephemeris, SGP4 uses UTC
        // propogate satellite to given date - saves result in TEME to this.posTEME and this.velTEME in km, km/s
        var propSuccess = SGP4unit.sgp4Prop2JD(this.sgp4SatData, julDate, this.posTEME, this.velTEME);
        if(!propSuccess)
        {
            console.log("Error SGP4 Propagation failed for sat: " + this.sgp4SatData.name + ", JD: " + this.sgp4SatData.jdsatepoch + ", error code: "+ this.sgp4SatData.error);
        }
        // scale output to meters
        for(var i=0;i<3;i++)
        {
            // TEME
             this.posTEME[i] = this.posTEME[i]*1000.0;
             this.velTEME[i] = this.velTEME[i]*1000.0;
        }
        //print differene TT-UT
        //console.log("TT-UT [days]= " + SDP4TimeUtilities.DeltaT(julDate-2450000)*24.0*60*60);
        // SEG - 11 June 2009 -- new information (to me) on SGP4 propogator coordinate system:
        // SGP4 output is in true equator and mean equinox (TEME) of Date *** note some think of epoch, but STK beleives it is of date from tests **
        // It depends also on the source for the TLs if from the Nasa MCC might be MEME but most US Gov - TEME
        // Also the Lat/Lon/Alt calculations are based on TEME (of Date) so that is correct as it was used before!
        // References:
        // http://www.stk.com/pdf/STKandSGP4/STKandSGP4.pdf  (STK's stance on SGP4)
        // http://www.agi.com/resources/faqSystem/files/2144.pdf  (newer version of above)
        // http://www.satobs.org/seesat/Aug-2004/0111.html
        // http://celestrak.com/columns/v02n01/ "Orbital Coordinate Systems, Part I" by Dr. T.S. Kelso
        // http://en.wikipedia.org/wiki/Earth_Centered_Inertial
        // http://ccar.colorado.edu/asen5050/projects/projects_2004/aphanuphong/p1.html  (bad coefficients? conversion between TEME and J2000 (though slightly off?))
        //  http://www.centerforspace.com/downloads/files/pubs/AIAA-2000-4025.pdf
        // http://celestrak.com/software/vallado-sw.asp  (good software)
        var mjd = julDate-AstroConst.JDminusMJD;
        // get position information back out - convert to J2000 (does TT time need to be used? - no)
        //this.j2kPos = CoordinateConversion.EquatorialEquinoxToJ2K(mjd, sdp4Prop.itsR); //julDate-2400000.5
        //this.j2kVel = CoordinateConversion.EquatorialEquinoxToJ2K(mjd, sdp4Prop.itsV);
        // based on new info about coordinate system, to get the J2K other conversions are needed!
        // precession from rk5 -> mod
        var ttt = (mjd-AstroConst.MJD_J2000) /36525.0;
        var A = J2kCoordinateConversion.teme_j2k(Direction.to,ttt, 24, 2, 'a');
        // rotate position and velocity
        this.j2kPos = J2kCoordinateConversion.matvecmult(A, this.posTEME);
        this.j2kVel = J2kCoordinateConversion.matvecmult(A, this.velTEME);
        //console.log("Date: " + julDate +", Pos: " + sdp4Prop.itsR[0] + ", " + sdp4Prop.itsR[1] + ", " + sdp4Prop.itsR[2]);
        // save old lat/long for ascending node check
        var oldLLA = this.lla; // copy old LLA
        // calculate Lat,Long,Alt - must use Mean of Date (MOD) Position
        this.lla = GeoFunctions.GeodeticLLA(this.posTEME,julDate-AstroConst.JDminusMJD); // this.j2kPos
        // Check to see if the ascending node has been passed
        if(this.showGroundTrack==true)
        {
            if(this.groundTrackIni == false ) // update ground track needed
            {
                this.initializeGroundTrack();
            }
            else if( oldLLA[0] < 0 && this.lla[0] >=0) // check for ascending node pass
            {
                //console.log("Ascending NODE passed: " + this.tle.getSatName() );
                this.initializeGroundTrack(); // for new ini each time          
            } // ascending node passed
        } // if show ground track is true
        // if 3D model - update its properties -- NOT DONE HERE - done in OrbitModelRenderable (so it can be done for any sat)
		return this.lla;
	}

	// initalize the ground track from any starting point, as long as Juldate !=-1
    SatelliteTleSGP4.prototype.initializeGroundTrack = function()
    {
        if(this.currentJulianDate == -1)
        {
            // nothing to do yet, we haven't been given an initial time
            return;
        }
        // find time of last acending node crossing
        // initial guess -- the current time        
        var lastAscendingNodeTime = this.currentJulianDate; // time of last ascending Node Time
        // calculate period - in minutes
        var periodMin = Kepler.CalculatePeriod(AstroConst.GM_Earth,this.j2kPos,this.j2kVel)/(60.0);
	       //console.log("period [min] = "+periodMin);
        // time step divisions (in fractions of a day)
        var fracOfPeriod = 15.0;
        var timeStep = (periodMin/(60.0*24.0)) / fracOfPeriod;
        var newGuess1 = lastAscendingNodeTime - timeStep;
        var lat0 =  this.lla[0]; //  current latitude
        var lat1 = (this.calculateLatLongAltXyz(newGuess1))[0]; // calculate latitude values     
	
        // bracket the crossing using timeStep step sizes
        while( !( lat0>=0 && lat1<0 ) )
        {
            // move back a step
            lastAscendingNodeTime = newGuess1;
            lat0 = lat1;
            // next guess
            newGuess1 = lastAscendingNodeTime - timeStep;
            // calculate latitudes of the new value
            lat1 = (this.calculateLatLongAltXyz(newGuess1))[0];
        } // while searching for ascending node
        // secand method -- determine within a second!
        var outJul = this.secantMethod(lastAscendingNodeTime-timeStep, lastAscendingNodeTime, 1.0/(60.0*60.0*24.0), 20);
        //console.log("Guess 1:" + (lastAscendingNodeTime-timeStep) );
        //console.log("Guess 2:" + (lastAscendingNodeTime));
        //console.log("Answer: " + outJul);
        // update times: Trust Period Calculations for how far in the future and past to calculate out to
        // WARNING: period calculation is based on osculating elements may not be 100% accurate
        //          as this is just for graphical updates should be okay (no mid-course corrections assumed)
        lastAscendingNodeTime = outJul;
        var leadEndTime = lastAscendingNodeTime + this.groundTrackLeadPeriodMultiplier*periodMin/(60.0*24); // Julian Date for last lead point (furthest in future)
        var lagEndTime = lastAscendingNodeTime - this.groundTrackLagPeriodMultiplier*periodMin/(60.0*24); // Julian Date for the last lag point (furthest in past)
        // fill in lead/lag arrays
        this.fillGroundTrack(lastAscendingNodeTime,leadEndTime,lagEndTime);
        this.groundTrackIni = true;
        return;
    } // initializeGroundTrack
    
    // takes in JulDate, returns lla and teme position
    SatelliteTleSGP4.prototype.calculateLatLongAltXyz = function(ptTime)
    {
        var ptPos = this.calculateTemePositionFromUT(ptTime);
        // get lat and long
        var ptLla = GeoFunctions.GeodeticLLA(ptPos,ptTime-AstroConst.JDminusMJD);
        var ptLlaXyz = new Array(ptLla[0],ptLla[1],ptLla[2],ptPos[0],ptPos[1],ptPos[2]);
        return ptLlaXyz;
    } // calculateLatLongAlt
    
    //---------------------------------------
    //  SECANT Routines to find Crossings of the Equator (hopefully Ascending Nodes)
    // xn_1 = date guess 1
    // xn date guess 2
    // tol = convergence tolerance
    // maxIter = maximum iterations allowed
    // RETURNS: var = julian date of crossing
    SatelliteTleSGP4.prototype.secantMethod = function(xn_1,xn,tol,maxIter)
    {
        var d;
        // calculate functional values at guesses
        var fn_1 = this.latitudeGivenJulianDate(xn_1);
        var fn = this.latitudeGivenJulianDate(xn);
        for (var n = 1; n <= maxIter; n++)
        {
            d = (xn - xn_1) / (fn - fn_1) * fn;
            if (Math.abs(d) < tol) // convergence check
            {
                //console.log("Iters:"+n);
                return xn;
            }
            // save past point
            xn_1 = xn;
            fn_1 = fn;
            // new point
            xn = xn - d;
            fn = this.latitudeGivenJulianDate(xn);
        }
        console.log("Warning: Secant Method - Max Iteration limit reached finding Asending Node.");
        return xn;
    } // secantMethod
    

    // fill in the Ground Track given Jul Dates for 
    // 
    SatelliteTleSGP4.prototype.fillGroundTrack = function(lastAscendingNodeTime, leadEndTime, lagEndTime)
    {
        // points in the lead direction
        var ptsLead = parseInt(Math.ceil(this.grnTrkPointsPerPeriod*this.groundTrackLeadPeriodMultiplier));
        this.latLongLead = [];        
        this.temePosLead =  [];
        this.timeLead = [];
        for(var i=0;i<ptsLead;i++)
        {
            var ptTime = lastAscendingNodeTime + i*(leadEndTime-lastAscendingNodeTime)/(ptsLead-1);
			// PUT HERE calculate lat lon
            var ptLlaXyz = this.calculateLatLongAltXyz(ptTime);
			this.latLongLead[i] = [];
            this.latLongLead[i][0] = ptLlaXyz[0]; // save lat
            this.latLongLead[i][1] = ptLlaXyz[1]; // save long
            this.latLongLead[i][2] = ptLlaXyz[2]; // save altitude
			this.temePosLead[i] = [];
            this.temePosLead[i][0] = ptLlaXyz[3]; // x
            this.temePosLead[i][1] = ptLlaXyz[4]; // y
            this.temePosLead[i][2] = ptLlaXyz[5]; // z
            this.timeLead[i] = ptTime; // save time
        } // for each lead point
        // points in the lag direction
        var ptsLag = parseInt(Math.ceil(this.grnTrkPointsPerPeriod*this.groundTrackLagPeriodMultiplier));
        this.latLongLag = [];
        this.temePosLag = [];
        this.timeLag = [];
        for(var i=0;i<ptsLag;i++)
        {
            var ptTime = lastAscendingNodeTime + i*(lagEndTime-lastAscendingNodeTime)/(ptsLag-1);
            var ptLlaXyz = this.calculateLatLongAltXyz(ptTime);
			this.latLongLag[i] = [];
            this.latLongLag[i][0] = ptLlaXyz[0]; // save lat
            this.latLongLag[i][1] = ptLlaXyz[1]; // save long
            this.latLongLag[i][2] = ptLlaXyz[2]; // save alt
			this.temePosLag[i] = [];
            this.temePosLag[i][0] = ptLlaXyz[3]; // x
            this.temePosLag[i][1] = ptLlaXyz[4]; // y
            this.temePosLag[i][2] = ptLlaXyz[5]; // z
            this.timeLag[i] = ptTime;
        } // for each lag point
    } // fillGroundTrack
    
    SatelliteTleSGP4.prototype.latitudeGivenJulianDate = function(julDate)
    {
        // computer latiude of the spacecraft at a given date
        var ptPos = this.calculateTemePositionFromUT(julDate);
        // get lat and long
        var ptLla = GeoFunctions.GeodeticLLA(ptPos,julDate-AstroConst.JDminusMJD);
        return ptLla[0]; // pass back latitude
    } // latitudeGivenJulianDate

	SatelliteTleSGP4.prototype.setShow3DOrbitTraceECI = function(show3DOrbitTraceECI) {
        this.show3DOrbitTraceECI = this.show3DOrbitTraceECI;
	}
	
	SatelliteTleSGP4.prototype.getJ2kPos = function() {
		return this.j2kPos;
	}
    SatelliteTleSGP4.prototype.setJ2kPos = function(j2kPos) {
		this.j2kPos = this.j2kPos;
	}
	
    SatelliteTleSGP4.prototype.getJ2kVel = function() {
		return this.j2kVel;
	}
	SatelliteTleSGP4.prototype.setJ2kVel = function(j2kVel) {
		this.j2kVel = this.j2kVel;
	}
