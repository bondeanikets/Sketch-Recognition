var ShortStraw = {
  run: function(sketch) {
    // return no corners for an empty sketch
    if (sketch.strokes.length === 0) {return []; }

    var strokes = sketch.strokes;
    var sketchCorners = [];
      console.log(sketch)
    for (var i = 0; i < strokes.length; i++) {
      var points = strokes[i].points;
      console.log("current stroke id is: " + i);
      var strokeCorners = this.findShortStrawCorners(points);
      sketchCorners.push(strokeCorners);
    }
    return sketchCorners;
  },

  findShortStrawCorners: function(points) {

    var corners = [];

    // ----- start algorithm -----
    // add the first point index
    corners.push(0);

    // handle singleton-stroke case
    if (points.length === 1) { return corners; }


    // create the straws and straw range
    var straws = [];

    // collect the straw distances
    for (var i = this.W; i < points.length - this.W; i++) {
      var straw0 = points[i - this.W];
      var strawN = points[i + this.W];
      var strawDistance = SketchRecTools.calculateDistance(straw0.x, straw0.y, strawN.x, strawN.y);
      straws.push(strawDistance);
    }

    // calculate the pseudo-median
    var t = ShortStraw.calculateMedian(straws) * 0.95;

    // iterate through each straw distance
    for (var i = 0; i < straws.length; i++) {

      // case: the current straw distance is less than the pseudo-median
      if (straws[i] < t && straws.length > 3) {

        // initialize the local min and min index's starting values
        var localMin = Number.MAX_SAFE_INTEGER;
        var localMinIndex = i;

        // iterate through the local straw distance cluster
        while (i < straws.length && straws[i] < t) {

          // local min (i.e., corner index) candidate found
          if (straws[i] < localMin) {
            localMin = straws[i];
            localMinIndex = i;
          }

          // iterate through the local cluster
          // note: need to iterate through i in inner loop to skip local cluster in outer loop
          i = i + 1;
        }

        // add the corner index of local cluster to the corner indices array
        // note: need to add W to offset between the straw indices and point indices
//        var pointInd = localMinIndex + this.W;
//          console.log("corner index is ", pointInd)
//        if (pointInd < points.length){
            corners.push(localMinIndex + this.W);
          console.log("1 corners are: ", corners)
        }        
//          var val = localMinIndex + this.W
//          console.log("wrong value is: " + val)
      //}
    }
      console.log("------2 corners are: ", corners)
    // add the last point index
       corners.push((points.length - 1));  //
      console.log("------3 corners are: ", corners)
      
//    console.log("corners before sort are:")
//    console.log(corners)  
//    corners = corners.sort(function(a,b){return a-b;});  
//    console.log("corners are:")
//    console.log(corners.length)
//    console.log(corners[2])
//      
    corners = this.postProcessCorners(points, corners, straws);
    return corners;
  },

  postProcessCorners: function(points, corners, straws) {
    // ----- start corner post-processing check #1 -----
    var advance = false;
    while (!advance) {
      advance = true;

      // iterate through the corner indices
      for (var i = 1; i < corners.length; i++) {
        // get the previous and current corner indices
        var c1 = corners[i - 1];
          console.log("c1 is ", c1)
          
        var c2 = corners[i];
          console.log("c2 is ", c2)
          console.log("corners are: ")
          console.log(corners)
//          console.log("points are: ")
//          console.log(points)

        // check if line is formed between previous and current corner indices
        var isLine = this.isLine(points, c1, c2);
        if (!this.isLine(points, c1, c2)) {

          // get the candidate halfway corner
          // offset it by W due to straw indices and points indices mis-match
        //----------ERROR IS HERE
          var newCorner = this.halfwayCorner(straws, c1, c2);
          newCorner = newCorner + this.W;
            console.log("_____4 corners are:", newCorner)

          // skip adding new corner, since it already exists
          // can happen during an overzealous halfway corner calculation
          if (newCorner === c2 || newCorner > points.length-1) {
            continue;
          }

          corners.splice(i, 0, newCorner);
            console.log("_____5 corners are:", corners)
          advance = false;
        }
      }

      // emergency stop
      if (corners.length > 15) { console.log("WARNING: Infinite Loop"); break; }
    }
    // ----- end corner post-processing check #1 -----

     
    // ----- start corner post-processing check #2 -----
    for (var i = 1; i < corners.length - 1; i++) {
        console.log("corners are : ", corners)
      var c1 = corners[i - 1];
      var c2 = corners[i + 1];

      var isLine = this.isLine(points, c1, c2);
      if (isLine) {
        corners.splice(i, 1);
        i = i - 1;
          //-------------------------------------------
      }
    }

    // ----- end corner post-processing check #2 -----
    return corners;
  },

  isLine: function(points, a, b) {

    var subset = points.slice(a, b + 1);
      //if (subset.length === 0){return false;}
      console.log("points are: ")
      console.log(points)
      console.log("subset is: ")
      console.log(subset)
      console.log("a is " + a)
      console.log("b is " + b)

    var threshold = 0.95;
    var startPoint = points[a];
      console.log("startpoint is: ")
      console.log(startPoint)
    var endPoint = points[b];
      console.log("endpoint is: ")
      console.log(endPoint)

    var ax = startPoint.x;
    var ay = startPoint.y;
    var bx = endPoint.x;
    var by = endPoint.y;
    var distance = SketchRecTools.calculateDistance(ax, ay, bx, by);
    var pathDistance = SketchRecTools.calculatePathLength({ strokes: [ {points: subset} ] });
    return distance / pathDistance > threshold;
  },

  halfwayCorner: function(straws, a, b) {

    var quarter = Math.floor((b - a) / 4);
    var minValue = Number.MAX_SAFE_INTEGER;
    var minIndex = a + quarter;

    for (var i = a + quarter; i < b - quarter; i++) {
      if (straws[i] < minValue) {
        minValue = straws[i];
        minIndex = i;
      }
    }

    return minIndex;
  },

  calculateMedian: function(inputs) {
    var values = [];
    for (var i = 0; i < inputs.length; i++) {
      values.push(inputs[i]);
    }

    values.sort( function(a,b) {return a - b;} );
    var half = Math.floor(values.length/2);
    if (values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
  },

  W: 3,
};
