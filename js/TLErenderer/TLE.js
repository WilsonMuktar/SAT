var TLE = (function(){
    var line0; // name line
    var line1; // first line
    var line2; // second line
    
    /** Creates a new instance of TLE */
    function TLE(name,l1,l2)
    {
        line0 = name;
        line1 = l1;
        line2 = l2;
    }
    
    TLE.prototype.getSatName = function()
    {
        return line0;
    }
    TLE.prototype.getLine1 = function()
    {
        return line1;
    }
    TLE.prototype.getLine2 = function()
    {
        return line2;
    }
    
	return TLE;
})();