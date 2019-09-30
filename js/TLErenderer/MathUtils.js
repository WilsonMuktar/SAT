
var MathUtils = (function(){
	
    /**
     * multiply two matrices 3x3
     *
     * @param a 3x3 matrix
     * @param b 3x3 matrix
     * @return a x b
     */
	 function MathUtils(){}
	 
	 return{
	
	mults: function(a,b)
	{
		var c = [[],[],[]];
		for (var i = 0; i < 3; i++) // row
		{
			for (var j = 0; j < 3; j++) // col
			{
				c[i][j] = 0.0;
				for (var k = 0; k < 3; k++)
				{
					c[i][j] += a[i][k] * b[k][j];
				}
			}
		}
		return c;
	}, // mult 3x3 matrices

    /**
     * multiply matrix nxn by vector nx1
     *
     * @param a nxn matrix
     * @param b nx1 vector
     * @return a x b
     */
	mult: function(a,b)
	{
		var c = [];
		for (var i = 0; i < b.length; i++) // row
		{
			c[i] = 0.0;
			for (var k = 0; k < b.length; k++)
			{
				c[i] += a[i][k] * b[k];
			}
		}
		return c;
	}, // mult 3x3 matrices
	
	// dot product for 3D vectors
    /**
     * dot product for 3D vectors
     *
     * @param a 3x1 vector
     * @param b 3x1 vector
     * @return a dot b
     */
	dot: function(a,b)
	{
		var c =0;
		for (var i = 0; i < 3; i++) // row
		{
			c += a[i]*b[i];
		}
		return c;
	}, // mult 3x3 matrices
	
	
    /**
     * transpose of 3x3 matrix
     *
     * @param a 3x3 matrix
     * @return a^T
     */
	transpose: function(a)
	{
		var c = [[],[],[]];
		for(var i=0;i<3;i++)
		{
			for(var k=0;k<3;k++)
			{
				c[i][k] = a[k][i];
			}
		}
		return c;
	},
	
	
    /**
     * vector subtraction
     *
     * @param a vector of length 3
     * @param b vector of length 3
     * @return a-b
     */
	sub: function(a,b)
	{
		var c = [];
		for(var i=0;i<3;i++)
		{
			c[i] = a[i] - b[i];
		}
		return c;
	},
	
    /**
     * vector addition
     *
     * @param a vector of length 3
     * @param b vector of length 3
     * @return a+b
     */
	add: function(a,b)
	{
		var c = [];
		for(var i=0;i<3;i++)
		{
			c[i] = a[i] + b[i];
		}
		return c;
	},
	
//	vector 2-norm
    /**
     * vector 2-norm
     *
     * @param a vector of length 3
     * @return norm(a)
     */
	norm: function(a)
	{
		var c = 0.0;
		
		for(var i=0;i<a.length;i++)
		{
			c += a[i]*a[i];
		}
		
		return Math.sqrt(c);
	},
	
//	multiply a vector times a scalar
    /**
     * multiply a vector times a scalar
     *
     * @param a a vector of length 3
     * @param b scalar
     * @return a * b
     */
	scale: function(a,b)
	{
		var c = [];
		
		for(var i=0;i<3;i++)
		{
			c[i] = a[i]*b;
		}
		
		return c;
	},
	
	// cross product or 2 3x1 vectors
    /**
     * cross product or 2 3x1 vectors
     *
     * @param left a vector of length 3
     * @param right a vector of length 3
     * @return a cross b
     */
	cross: function(left,right)
	{
	  if ( (left.length!=3) || (right.length!=3) ) 
	  {
	    alert("ERROR: Invalid dimension in Cross(Vector,Vector)");
	  }
	  
	  var Result = [];
	  Result[0] = left[1]*right[2] - left[2]*right[1];
	  Result[1] = left[2]*right[0] - left[0]*right[2];
	  Result[2] = left[0]*right[1] - left[1]*right[0];
	  
	  return Result;
	}, // cross


        //
	// Fractional part of a number (y=x-[x])
	//
    /**
     * Fractional part of a number (y=x-|x|)
     * @param x number
     * @return the fractional part of that number (e.g., for 5.3 would return 0.3)
     */
	Frac: function(x)
	{
		return x - Math.floor(x);
	},

	//
	// x mod y
	//
    /**
     * x mod y
     * @param x value
     * @param y value
     * @return x mod y
     */
	Modulo: function(x,y)
	{
		return y * Frac(x / y);
	},
        
        // Elementary rotation matrix about x axis
        
        /**
         * Creates a unit vector from the given vector
         * @param vec any vector n-dimensional
         * @return unit vector (n-dimensional) with norm = 1
         */
        UnitVector: function(vec)
        {
            var n = vec.length;
            var unitVect = [];
            var normVec = MathUtils.norm(vec);
            unitVect = MathUtils.scale(vec, 1.0/normVec);
            
            //alert("Norm:" + MathUtils.norm(unitVect));
             
            return unitVect;
        }, // UnitVector

    /**
     * Elementary rotation matrix about x axis
     *
     * @param Angle Angle in radians
     * @return Elementary rotation matrix about x axis
     */
	R_x: function(Angle)
	{
		var C = Math.cos(Angle);
		var S = Math.sin(Angle);
		var U = [[],[],[]];
		U[0][0] = 1.0;
		U[0][1] = 0.0;
		U[0][2] = 0.0;
		U[1][0] = 0.0;
		U[1][1] = +C;
		U[1][2] = +S;
		U[2][0] = 0.0;
		U[2][1] = -S;
		U[2][2] = +C;
		return U;
	},

         // Elementary rotation matrix about y axis
    /**
     * Elementary rotation matrix about y axis
     *
     * @param Angle  Angle in radians
     * @return Elementary rotation matrix about y axis
     */
	R_y: function(Angle)
	{
		var C = Math.cos(Angle);
		var S = Math.sin(Angle);
		var U = [[],[],[]];
		U[0][0] = +C;
		U[0][1] = 0.0;
		U[0][2] = -S;
		U[1][0] = 0.0;
		U[1][1] = 1.0;
		U[1][2] = 0.0;
		U[2][0] = +S;
		U[2][1] = 0.0;
		U[2][2] = +C;
		return U;
	},

         // Elementary rotation matrix about z axis
    /**
     * Elementary rotation matrix about z axis
     *
     * @param Angle Angle in radians
     * @return Elementary rotation matrix about z axis
     */
	R_z: function(Angle)
	{
		var C = Math.cos(Angle);
		var S = Math.sin(Angle);
		var U = [[],[],[]];
		U[0][0] = +C;
		U[0][1] = +S;
		U[0][2] = 0.0;
		U[1][0] = -S;
		U[1][1] = +C;
		U[1][2] = 0.0;
		U[2][0] = 0.0;
		U[2][1] = 0.0;
		U[2][2] = 1.0;
		return U;
	}
	
	 }//return
})();