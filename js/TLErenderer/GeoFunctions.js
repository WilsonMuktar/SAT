
var GeoFunctions = (function(){
	
	function GeoFunctions(){}
	return {
    
    // same as below except the function takes Julian Date
    /**
     * Compute Geodetic Latatude/Longitude/Altitude from Mean of Date position vector and Date 
     *
     * @param modPos Mean of date position vector
     * @param mjd modified julian date  (is this UTC or TT?) guessing UTC
     * @return vector of geodetic [latitude,longitude,altitude]
     */
    GeodeticLLA: function(modPos,mjd)
    {
        // calculate days since Y2k
        // MJD = JD - 2400000.5
        // passed in MJD - 51544.5
        //double daysSinceY2k = (julDate - 2400000.5)-51544.5;
        var daysSinceY2k = mjd - 51544.5;
        
        return this.calculateGeodeticLLA(modPos, daysSinceY2k);
    }, // GeodeticLLA
    
    
    // returned as Lat, Long, Alt
    // LLA = corrected for time (geographical coordinates)
    // for handling geodetic coordinates
    // r = TEME positions, d = days since Y2K
    calculateGeodeticLLA: function(r,d)
    {
        var R_equ= AstroConst.R_Earth; // Equator radius [m]
        var f    = AstroConst.f_Earth; // Flattening
        
        var eps_mach = 2.22E-16; // machine precision (double?)
        
        var  eps     = 1.0e3*eps_mach;   // Convergence criterion
        var  epsRequ = eps*R_equ;
        var  e2      = f*(2.0-f);        // Square of eccentricity
        
        var  X = r[0];                   // Cartesian coordinates
        var  Y = r[1];
        var  Z = r[2];
        var  rho2 = X*X + Y*Y;           // Square of distance from z-axis
        
        // original class vars
        // double lon;
        // double lat;
        //double h;
       var LLA = [];
        
        
        // Check validity of input data
        if (MathUtils.norm(r)==0.0)
        {
            alert(" invalid input in Geodetic constructor");
            LLA[1]=0.0;
            LLA[0]=0.0;
            LLA[2]=-AstroConst.R_Earth;
            return LLA;
        }
        
        // Iteration
        var  dZ, dZ_new, SinPhi;
        var  ZdZ, Nh, N;
        
        dZ = e2*Z;
        for(;;)
        {
            ZdZ    =  Z + dZ;
            Nh     =  Math.sqrt( rho2 + ZdZ*ZdZ );
            SinPhi =  ZdZ / Nh;                    // Sine of geodetic latitude
            N      =  R_equ / Math.sqrt(1.0-e2*SinPhi*SinPhi);
            dZ_new =  N*e2*SinPhi;
            if ( Math.abs(dZ-dZ_new) < epsRequ ) break;
            dZ = dZ_new;
        }
        
        // Longitude, latitude, altitude
        //double[] LLA = new double[3];
        LLA[1] = Math.atan2( Y, X );  // longitude,  lon
        LLA[0] = Math.atan2( ZdZ, Math.sqrt(rho2) ); // latitude, lat
        LLA[2] = Nh - N; // altitute, h
        
        //alert("LLA[1]: "+ LLA[1]);
        //LLA[1] = LLA[1] -(280.4606 +360.9856473*d)*Math.PI/180.0; // shift based on time
        // add fidelity to the line above
        LLA[1] = LLA[1] - this.earthRotationDeg(d)*Math.PI/180.0; // shift based on time
        var div = Math.floor(LLA[1]/(2*Math.PI));
        LLA[1] = LLA[1] - div*2*Math.PI;
        if(LLA[1] > Math.PI)
        {
            LLA[1] = LLA[1]- 2.0*Math.PI;
        }
        
        //alert("LLA[1]a: "+ LLA[1]);
        
        return LLA; //h
        
    }, // calculateGeodeticLLA

    // SEG 10 June 2009 - help standardize earth Rotations
    earthRotationDeg: function(d) // days since y2K
    {
        // LLA[1] = LLA[1] -(280.4606 +360.9856473*d)*Math.PI/180.0; // shift based on time

        // calculate T
        var T = (d)/36525.0;

        // do calculation
        return ( (280.46061837 + 360.98564736629*(d)) + 0.000387933*T*T - T*T*T/38710000.0) % 360.0;

    }, // earthRotationRad

    /*------------------------------------------------------------------------------
     *
     * Site: Calculates the geocentric position of a site on the Earth's surface
     *
     * Input:
     *
     *   lambda    Geographical longitude (east positive) in [rad]
     *   phi       Geographical latitude  in [rad]
     *   alt       altitude in meters (this is 0 if on the Earth's surface)
     *
     *<return>:   Geocentric position in [m]
     *
     *---------------------------------------------------------------------------- */
    lla2ecef: function(lambda,phi,alt)
    {
        //
        // Constants
        //
        //double f = 1.0 / 298.257;   // Flattening
        var e_sqr = AstroConst.f_Earth * (2.0 - AstroConst.f_Earth);     // Square of eccentricity
        var cos_phi = Math.cos(phi);    // (Co)sine of geographical latitude
        var sin_phi = Math.sin(phi);
        
        //
        // Variables
        //
        var N = AstroConst.R_Earth_major / Math.sqrt(1.0 - e_sqr * (sin_phi * sin_phi));


        // Cartesian position vector [km]
        return new Array ((N+alt) * cos_phi * Math.cos(lambda),
                             (N+alt) * cos_phi * Math.sin(lambda),
                             ((1.0 - e_sqr) * N + alt) * sin_phi);
        // also see (for adding in alt - http://www.posc.org/Epicentre.2_2/DataModel/ExamplesofUsage/eu_cs35.html
    },

    // function to convert earth-centered earth-fixed (ECEF) cartesian coordinates to Lat, Long, Alt
    // DOES NOT INCLUDE UPDATES FOR time
    // SEG 31 Match 2009 -- slightly less accurate (but faster) version of: GeoFunctions.calculateGeodeticLLA without time shift of latitude
    // source: http://www.mathworks.com/matlabcentral/fx_files/7941/1/ecef2lla.m
    // http://www.mathworks.com/matlabcentral/fileexchange/7941
    // for the reverse see: (which is the same as: GeoFunctions.lla2ecef
    // http://www.mathworks.com/matlabcentral/fileexchange/7942
    ecef2lla_Fast: function(pos) // d is current MDT time
    {
        var lla = [];

        // WGS84 ellipsoid constants:
        var a = 6378137;
        var e = 8.1819190842622e-2; // 0;%8.1819190842622e-2/a;%8.1819190842622e-2;  % 0.003352810664747

        var b = Math.sqrt(Math.pow(a,2.0)*(1-Math.pow(e,2)));
        var ep = Math.sqrt( (Math.pow(a,2.0)-Math.pow(b,2.0))/Math.pow(b,2.0));
        var p   = Math.sqrt(Math.pow(pos[0],2.0)+Math.pow(pos[1],2.0));
        var th  = Math.atan2(a*pos[2],b*p);
        lla[1] = Math.atan2(pos[1],pos[0]);
        lla[0] = Math.atan2((pos[2]+Math.pow(ep,2.0)*b*Math.pow(Math.sin(th),3.0)),(p-Math.pow(e,2.0)*a*Math.pow(Math.cos(th),3.0)));
        var N   = a/Math.sqrt(1-Math.pow(e,2.0)*Math.pow(Math.sin(lla[0]),2.0));
        lla[2] = p/Math.cos(lla[0])-N;


        if(lla[1] < 0)
        {
            lla[1] = 2.0*Math.PI + lla[1];
        }

        // return lon in range [0,2*pi)
        lla[1] = lla[1] % (2.0*Math.PI); // modulus

        // correct for numerical instability in altitude near exact poles:
        // (after this correction, error is about 2 millimeters, which is about
        // the same as the numerical precision of the overall function)

        if(Math.abs(pos[0])<1.0 & Math.abs(pos[1])<1.0)
        {
            lla[2] = Math.abs(pos[2])-b;
        }

        // now scale longitude from [0,360] -> [-180,180]
        if(lla[1] > Math.PI) // > 180
        {
            lla[1] = lla[1] - 2.0*Math.PI;
        }
/*
                // now correct for time shift
                // account for earth rotations
                lla[1] = lla[1]-(280.4606 +360.9856473*d)*Math.PI/180.0;

                // correction ??
                //lla[1] = lla[1]-Math.PI/2.0;

                // now insure [-180,180] range
                double div = Math.floor(lla[1]/(2*Math.PI));
                lla[1] = lla[1] - div*2*Math.PI;
                if(lla[1] > Math.PI)
                {
                        lla[1] = lla[1]- 2.0*Math.PI;
                }
 */

        return lla;

    }, // ecef2lla
    
    
     /**
     * calculate the pointing information Azumuth, Elevation, and Range (AER) to 
     * a satellite from a location on Earth (given Lat, Long, Alt)
     * if elevation >=0 then sat is above local horizon
      * @param currentJulianDate Julian Date for AER calculation (corresponds to ECI position)
      * @param lla_deg_m lat long and alt of station in deg/deg/meters (Geodetic)
      * @param eci_pos ECI position of object in meters (sat)
     * @return Azumuth [deg], Elevation [deg], and Range vector [m]
     */
    calculate_AER: function(currentJulianDate,lla_deg_m,eci_pos)
    {
        var aer = [];
        
        // 0th step get local mean Sidereal time
        // first get mean sidereal time for this station - since we use it twice
        var thetaDeg = Sidereal.Mean_Sidereal_Deg(currentJulianDate-AstroConst.JDminusMJD, lla_deg_m[1]);
        
        // first calculate ECI position of Station
        var eciGS = calculateECIposition(lla_deg_m,thetaDeg);
        
        // find the vector between pos and GS
        var rECI = MathUtils.sub(eci_pos, eciGS);
        
        // calculate range
        aer[2] = MathUtils.norm(rECI);
        
        // now transform ECI to topocentric-horizon system (SEZ)  (use Geodetic Lat, not geocentric)
        var rSEZ = eci2sez(rECI,thetaDeg,lla_deg_m[0]); // ECI vec, sidereal in Deg, latitude in deg
        
        // compute azimuth [radians] -> Deg
        //aer[0] = Math.atan(-rSEZ[1]/rSEZ[0]) * 180.0/Math.PI;
        aer[0] = Math.atan2(-rSEZ[0], rSEZ[1]) * 180.0/Math.PI;
        
        //alert("aer[0]_0=" + aer[0] + ", rSEZ[-0,1]=" + (-rSEZ[0]) + ", " +rSEZ[1] );
        
        // do conversions so N=0, S=180, NW=270
        if(aer[0] <= 0)
        {
            aer[0] = Math.abs(aer[0]) + 90;
        }
        else
        {
            if(aer[0]<= 90)  //(between 0 and 90)
            {
                aer[0] = -1.0*aer[0] + 90.0;
            }
            else // between 90 and 180
            {
                aer[0] = -1.0*aer[0] + 450.0; 
            }
        }
        
        // compute elevation [radians]
        aer[1] = Math.asin(rSEZ[2] / aer[2]) * 180.0/Math.PI; 
        
        //alert("SEZ: " + rSEZ[0] + ", " + rSEZ[1] + ", " + rSEZ[2]);
        
        return aer;
    }, // calculate_AER
    
    /**
     * transform ECI to topocentric-horizon system (SEZ) (south-East-Zenith)
     * @param rECI position in ECI coordinates (meters)
     * @param thetaDeg local sidereal time (degrees)
     * @param latDeg observer's latitude (degrees)
     * @return topocentric-horizon system (SEZ) (south-East-Zenith)
     */
    eci2sez: function(rECI,thetaDeg,latDeg)
    {
        var rSEZ = []; // new postion in SEZ coorinates
        
        //? (the local sidereal time) -> (thetaDeg*Math.PI)
        //? (the observer's latitude) - > (latDeg*Math.PI)
        rSEZ[0] = Math.sin(latDeg*Math.PI/180.0) * Math.cos(thetaDeg*Math.PI/180.0) * rECI[0] + Math.sin(latDeg*Math.PI/180.0) * Math.sin(thetaDeg*Math.PI/180.0) * rECI[1] - Math.cos(latDeg*Math.PI/180.0) * rECI[2];
        rSEZ[1] = -Math.sin(thetaDeg*Math.PI/180.0) * rECI[0] + Math.cos(thetaDeg*Math.PI/180.0) * rECI[1];
        rSEZ[2] = Math.cos(latDeg*Math.PI/180.0) * Math.cos(thetaDeg*Math.PI/180.0) * rECI[0] + Math.cos(latDeg*Math.PI/180.0) * Math.sin(thetaDeg*Math.PI/180.0) * rECI[1] + Math.sin(latDeg*Math.PI/180.0) * rECI[2];
        
        return rSEZ;
    },
    
    /**
     * Calculate ECI position from local mean sidereal time and geodetic lat long alt
     * @param lla_deg_m lat long and alt of station in deg/deg/meters (Geodetic)
     * @param theta local mean sidereal time (Degrees)
     * @return ECI position (meters)
     */
    calculateECIposition: function(lla_deg_m,theta)
    {
        // calculate the ECI j2k position vector of the ground station at the current time
        var eciVec = [];
        
//        // calculate geocentric latitude - using non spherical earth (in radians)
//        // http://celestrak.com/columns/v02n03/
//        double  geocentricLat = Math.atan( Math.pow(1.0-AstroConst.f_Earth, 2.0) * Math.tan( lla_deg_m[0]*Math.PI/180.0 )  ); // (1-f)^2 tan(?).
//        
//        eciVec[2] = AstroConst.R_Earth * Math.sin( geocentricLat ); //lla_deg_m[0]*Math.PI/180.0 );
//        double r = AstroConst.R_Earth * Math.cos( geocentricLat ); //lla_deg_m[0]*Math.PI/180.0 );
//        eciVec[0] = r * Math.cos(theta*Math.PI/180.0);
//        eciVec[1] = r * Math.sin(theta*Math.PI/180.0);
        
        // alternate way to calcuate ECI position - using earth flattening
        // http://celestrak.com/columns/v02n03/
        var C = 1.0 / Math.sqrt( 1.0+AstroConst.f_Earth*(AstroConst.f_Earth-2.0)*Math.pow(Math.sin(lla_deg_m[0]*Math.PI/180.0 ),2.0) );
        var S = Math.pow(1.0-AstroConst.f_Earth, 2.0) * C;
        
        eciVec[0] = AstroConst.R_Earth * C * Math.cos(lla_deg_m[0]*Math.PI/180.0)*Math.cos(theta*Math.PI/180.0);
        eciVec[1] = AstroConst.R_Earth * C * Math.cos(lla_deg_m[0]*Math.PI/180.0)*Math.sin(theta*Math.PI/180.0);
        eciVec[2] = AstroConst.R_Earth * S * Math.sin(lla_deg_m[0]*Math.PI/180.0);
        
        return eciVec;
        
    } //calculateECIposition

	}//return
})();//GeoFunctions
