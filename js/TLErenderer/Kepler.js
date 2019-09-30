var Kepler = (function(){
	
	return{
    /**
     *  Overload for state
     * @param GM Gravitational coefficient (gravitational constant * mass of central body)
     * @param kepElements Keplarian elements (see other state function)
     * @param dt Time since epoch (seconds?)
     * @return State vector (x,y,z,vx,vy,vz)
     */
    state: function(GM,kepElements,dt)
    {
        return states(GM, kepElements[0], kepElements[1],kepElements[2], kepElements[3], kepElements[4], kepElements[5], dt);
    },
    
    /**
     * Computes the satellite state vector from osculating Keplerian elements for elliptic orbits
     * <p>Notes:
     * <br> The semimajor axis a=Kep(0), dt and GM must be given in consistent units,
     *      e.g. [m], [s] and [m^3/s^2]. The resulting units of length and velocity
     *      are implied by the units of GM, e.g. [m] and [m/s].
     *
     * @param GM Gravitational coefficient (gravitational constant * mass of central body)
     * @param a Semimajor axis
     * @param e Eccentricity
     * @param i Inclination [rad]
     * @param Omega Longitude of the ascending node [rad] or is this RAAN? (I think it is RAAN)
     * @param omega Argument of pericenter [rad]
     * @param M0 Mean anomaly at epoch [rad]
     * @param dt Time since epoch (seconds?)
     * @return State vector (x,y,z,vx,vy,vz)
     */
	states: function(GM,a,e,i,Omega,omega,M0,dt)
	{
		var M; // mean anomaly
		var n;
		var E, cosE, sinE; // eccentric anomaly
		var fac, R, V;

		// vectors for position (r) and velocity (v)
		var r = [];
		var v = [];
		var state = []; // full state

		// transformation matrices
		var Rx = [[],[],[]];
		// double[][] Ry = new double[3][3];
		var Rz = [[],[],[]];

		// rotation matrix
		var PQW = [[],[],[]];

		// Mean anomaly
		if (dt == 0.0)
		{
			M = M0;
		} else
		{
			n = Math.sqrt(GM / (a * a * a));
			M = M0 + n * dt;
		}

		// Eccentric anomaly
		E = EccAnom(M, e);
		cosE = Math.cos(E);
		sinE = Math.sin(E);

		// Perifocal coordinates
		fac = Math.sqrt((1.0 - e) * (1.0 + e));

		R = a * (1.0 - e * cosE); // Distance
		V = Math.sqrt(GM * a) / R; // Velocity

		// r
		r[0] = a * (cosE - e);
		r[1] = a * fac * sinE;
		r[2] = 0.0;

		// v
		v[0] = -V * sinE;
		v[1] = +V * fac * cosE;
		v[2] = 0.0;

		// Transformation to reference system (Gaussian vectors)
		Rx = MathUtils.R_x(-i);
		Rz = MathUtils.R_z(-Omega);

		// PQW = R_z(-Omega) * R_x(-i) * R_z(-omega);
		PQW = MathUtils.mult(Rz, Rx);
		Rz = MathUtils.R_z(-omega);
		PQW = MathUtils.mult(PQW, Rz);

		r = MathUtils.mult(PQW, r);
		v = MathUtils.mult(PQW, v);

		// State vector
		state[0] = r[0];
		state[1] = r[1];
		state[2] = r[2];
		state[3] = v[0];
		state[4] = v[1];
		state[5] = v[2];

		// return Stack(r,v);
		return state;

	}, // state


    /**
     * Computes the eccentric anomaly for elliptic orbits
     *
     * @param M Mean anomaly in [rad]
     * @param e Eccentricity of the orbit [0,1]
     * @return Eccentric anomaly in [rad]
     */
	EccAnom: function(M,e)
	{

		// Constants
		var maxit = 15;
		var eps = 100.0 * 2.22E-16; // JAVA FIND MACHINE PRECISION // 100.0*eps_mach

		// Variables

		var i = 0;
		var E, f;

		// Starting value
		M = MathUtils.Modulo(M, 2.0 * Math.PI);
		if (e < 0.8)
			E = M;
		else
			E = Math.PI;

		// Iteration
		do
		{
			f = E - e * Math.sin(E) - M;
			E = E - f / (1.0 - e * Math.cos(E));
			++i;
			if (i == maxit)
			{
				alert(" convergence problems in EccAnom\n");
				break;
			}
		} while (Math.abs(f) > eps);

		return E;

	}, // EccAnom

	
        /**
         * Computes the osculating Keplerian elements from the satellite state vector for elliptic orbits for Earth
         * @param StateVector j2K cartesian state vector object (t,x,y,z,dx,dy,dz)
         * @return Keplerian elements (a,e,i,Omega,omega,M) see state function for element definitions
         */
        SingularOsculatingElementsEarth : function( state )
        { 
            var r = new Array(state.state[1],state.state[2],state.state[3]);
            var v = new Array(state.state[4],state.state[5],state.state[6]);
            
            return SingularOsculatingElements( AstroConst.GM_Earth, r, v );
        },
       
        /**
         * Computes the osculating Keplerian elements from the satellite state vector for elliptic orbits
         * @param GM Gravitational coefficient (gravitational constant * mass of central body)
         * @param state j2K cartesian state vector (x,y,z,dx,dy,dz)
         * @return Keplerian elements (a,e,i,Omega,omega,M) see state function for element definitions
         */
        SingularOsculatingElements: function(GM,state)
        { 
            var r = new Array(state[0],state[1],state[2]);
            var v = new Array(state[3],state[4],state[5]);
            
            return SingularOsculatingElementss( GM, r, v );
        },
        
    /**
     * Computes the osculating Keplerian elements from the satellite state vector for elliptic orbits
     *
     * @param GM Gravitational coefficient (gravitational constant * mass of central body)
     * @param r State vector (x,y,z)
     * @param v State vector (vx,vy,vz)
     * @return Keplerian elements (a,e,i,Omega,omega,M) see state function for element definitions
     */
        SingularOsculatingElementss(GM,r,v )
        { 
            // Variables
            
            var h = [];
            var  H, u, R;
            var  eCosE, eSinE, e2, E, nu;
            var  a,e,i,Omega,omega,M;
                        
            h = MathUtils.cross(r,v);                         // Areal velocity
            H = MathUtils.norm(h);
            
            Omega = Math.atan2( h[0], -h[1] );                     // Long. ascend. node
            Omega = Omega % (Math.PI*2.0);
            i     = Math.atan2( Math.sqrt(h[0]*h[0]+h[1]*h[1]), h[2] ); // Inclination
            u     = Math.atan2( r[2]*H, -r[0]*h[1]+r[1]*h[0] );    // Arg. of latitude
            
            R  = MathUtils.norm(r);                                      // Distance
            
            //System.out.println("R="+R);
            //System.out.println("v dot v="+(MathUtils.dot(v,v)));
            //System.out.println("GM="+GM);
            
            a = 1.0 / (2.0/R-MathUtils.dot(v,v)/GM);                     // Semi-major axis
            
            eCosE = 1.0-R/a;                                   // e*cos(E)
            eSinE = MathUtils.dot(r,v)/Math.sqrt(GM*a);                       // e*sin(E)
            
            e2 = eCosE*eCosE +eSinE*eSinE;
            e  = Math.sqrt(e2);                                     // Eccentricity
            E  = Math.atan2(eSinE,eCosE);                           // Eccentric anomaly
            
            M  = (E-eSinE)%(2.0*Math.PI);                          // Mean anomaly
            
            nu = Math.atan2(Math.sqrt(1.0-e2)*eSinE, eCosE-e2);          // True anomaly
            
            omega = (u-nu)%(2.0*Math.PI);                          // Arg. of perihelion
            
            // Keplerian elements vector
            
            //System.out.println("Real a = " + a);
            
            return (new Array(a,e,i,Omega,omega,M));
        }, // SingularElementss

        
    /**
     * calculate oculating orbital period of a eliptical orbit from position and velocity
     *
     * @param GM Gravitational coefficient (gravitational constant * mass of central body)
     * @param r State vector (x,y,z)
     * @param v State vector (vx,vy,vz)
     * @return oculating orbital period
     */
        CalculatePeriod: function( GM, r, v )
        { 
            var R  = MathUtils.norm(r); // current radius 
            
            var a = 1.0 / (2.0/R-MathUtils.dot(v,v)/GM);                     // Semi-major axis
            
            return ( 2.0*Math.PI*Math.sqrt(a*a*a/GM) );
        } // CalculatePeriod

	}//return
})();// Kepler
